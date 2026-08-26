-- Ensure user accounts and profiles are only created when email_confirmed_at is NOT NULL

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only create profile if email_confirmed_at is set (user clicked verification link / entered OTP)
  if new.email_confirmed_at is not null then
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
    on conflict (id) do update set
      name = coalesce(excluded.name, profiles.name),
      email = excluded.email;
  end if;
  return new;
end;
$$;

-- Drop old trigger and create trigger that fires when email_confirmed_at becomes NOT NULL
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.handle_new_user();

-- Update check_account_status to only consider accounts with confirmed email
create or replace function public.check_account_status(p_email text)
returns table (has_account boolean, is_admin boolean)
language sql
security definer
set search_path = public, auth
stable
as $$
  select
    exists (
      select 1 from auth.users u
      where lower(u.email) = lower(p_email)
        and u.email_confirmed_at is not null
    ) as has_account,
    coalesce(
      (select p.role = 'admin' from public.profiles p where lower(p.email) = lower(p_email)),
      exists (select 1 from public.admin_allowlist a where lower(a.email) = lower(p_email))
    ) as is_admin;
$$;

grant execute on function public.check_account_status(text) to anon, authenticated;
