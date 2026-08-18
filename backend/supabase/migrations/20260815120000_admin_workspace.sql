-- Admin workspace: a single Supabase Auth account can hold the 'admin' role
-- (see profiles.role from ..._profiles.sql). This migration adds the
-- allowlist that controls which emails are allowed to hold that role, plus
-- an RPC the sign-in page uses to steer a given email toward the right flow
-- (normal password sign-in, "set your admin password", etc) before the user
-- has authenticated.

create table public.admin_allowlist (
  email text primary key,
  added_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint admin_allowlist_email_lowercase check (email = lower(email))
);

alter table public.admin_allowlist enable row level security;

create policy "Admins can view the allowlist"
  on public.admin_allowlist for select
  using (public.is_admin(auth.uid()));

create policy "Admins can add admin emails"
  on public.admin_allowlist for insert
  with check (public.is_admin(auth.uid()));

create policy "Admins can remove admin emails"
  on public.admin_allowlist for delete
  using (public.is_admin(auth.uid()));

-- The seeded root admin (hr@lexonit.com) can never be removed by another
-- admin, so the workspace can't be locked out entirely.
create or replace function public.protect_root_admin()
returns trigger
language plpgsql
as $$
begin
  if lower(old.email) = 'hr@lexonit.com' then
    raise exception 'The root admin account cannot be removed.';
  end if;
  return old;
end;
$$;

create trigger trg_protect_root_admin
  before delete on public.admin_allowlist
  for each row execute function public.protect_root_admin();

-- Keep profiles.role in sync with the allowlist: promote a matching profile
-- to admin when its email is added, demote it back to student when removed.
-- Runs as the inserting/deleting admin (auth.uid() is preserved through
-- SECURITY DEFINER), so it passes the trg_protect_profile_role guard on
-- profiles the same way any other admin-driven role change would.
create or replace function public.sync_profile_role_from_allowlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set role = 'admin' where lower(email) = lower(new.email) and role <> 'admin';
    return new;
  else
    update public.profiles set role = 'student' where lower(email) = lower(old.email) and role = 'admin';
    return old;
  end if;
end;
$$;

create trigger trg_admin_allowlist_insert
  after insert on public.admin_allowlist
  for each row execute function public.sync_profile_role_from_allowlist();

create trigger trg_admin_allowlist_delete
  after delete on public.admin_allowlist
  for each row execute function public.sync_profile_role_from_allowlist();

-- New signups get the admin role immediately if their email was
-- pre-authorized (supersedes the version of this function from
-- ..._profiles.sql, which always defaulted new profiles to 'student').
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Student'),
    new.email,
    case
      when exists (select 1 from public.admin_allowlist a where lower(a.email) = lower(new.email))
        then 'admin'::public.user_role
      else 'student'::public.user_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Lets the sign-in page ask, before authenticating, whether an email
-- belongs to an existing account and whether it should sign in as an admin
-- — without ever exposing auth.users or password hashes to the client.
create or replace function public.check_account_status(p_email text)
returns table (has_account boolean, is_admin boolean)
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (select 1 from public.profiles p where lower(p.email) = lower(p_email)) as has_account,
    coalesce(
      (select p.role = 'admin' from public.profiles p where lower(p.email) = lower(p_email)),
      exists (select 1 from public.admin_allowlist a where lower(a.email) = lower(p_email))
    ) as is_admin;
$$;

grant execute on function public.check_account_status(text) to anon, authenticated;

-- Seed the root admin. This only authorizes the email — Supabase Auth users
-- can't be created directly via SQL migration, so hr@lexonit.com must
-- complete the "set your admin password" step once from the sign-in page
-- (password SandyMahi@2026) to actually activate the account. See
-- backend/README.md.
insert into public.admin_allowlist (email) values ('hr@lexonit.com')
  on conflict (email) do nothing;
