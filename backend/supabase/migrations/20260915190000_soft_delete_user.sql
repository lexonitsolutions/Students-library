-- Add is_deleted to profiles
alter table public.profiles add column if not exists is_deleted boolean not null default false;

-- Update public_profiles view to include is_deleted
drop view if exists public.public_profiles;
create view public.public_profiles as
  select id, name, username, avatar_url, university, college, branch, major, is_deleted
  from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- Modify check_account_status to return is_deleted
drop function if exists public.check_account_status(text);

create or replace function public.check_account_status(p_email text)
returns table (has_account boolean, is_admin boolean, is_unconfirmed boolean, is_deleted boolean)
language sql
security definer
set search_path = public, auth
stable
as $$
  select
    exists (
      select 1 from public.profiles p
      join auth.users u on u.id = p.id
      where lower(u.email) = lower(p_email)
        and u.email_confirmed_at is not null
        and not coalesce(p.is_deleted, false)
    ) as has_account,
    coalesce(
      (select p.role = 'admin' from public.profiles p where lower(p.email) = lower(p_email)),
      exists (select 1 from public.admin_allowlist a where lower(a.email) = lower(p_email))
    ) as is_admin,
    exists (
      select 1 from auth.users u
      where lower(u.email) = lower(p_email)
        and u.email_confirmed_at is null
    ) as is_unconfirmed,
    exists (
      select 1 from public.profiles p
      join auth.users u on u.id = p.id
      where lower(u.email) = lower(p_email)
        and coalesce(p.is_deleted, false) = true
    ) as is_deleted;
$$;

grant execute on function public.check_account_status(text) to anon, authenticated;

-- Replace delete_user_account to perform a soft delete
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Soft delete profile
  update public.profiles
  set
    is_deleted = true,
    name = 'Studex user',
    username = null,
    avatar_url = null,
    phone = null,
    university = null,
    college = null,
    branch = null,
    major = null,
    year = null,
    semester = null,
    updated_at = now()
  where id = v_uid;

  -- Scramble auth.users password to prevent sign-in until reactivated
  update auth.users
  set encrypted_password = crypt(gen_random_uuid()::text, gen_salt('bf'))
  where id = v_uid;
end;
$$;

grant execute on function public.delete_user_account() to authenticated;

-- Create reactivate_deleted_account function
create or replace function public.reactivate_deleted_account(p_email text, p_password text, p_name text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users where lower(email) = lower(p_email);
  
  if v_uid is null then
    raise exception 'User not found';
  end if;

  -- Update auth.users password
  update auth.users
  set encrypted_password = crypt(p_password, gen_salt('bf'))
  where id = v_uid;

  -- Restore profile
  update public.profiles
  set
    is_deleted = false,
    name = p_name,
    updated_at = now()
  where id = v_uid;
end;
$$;

grant execute on function public.reactivate_deleted_account(text, text, text) to anon, authenticated;
-- Modify admin_delete_student to perform a soft delete as well
create or replace function public.admin_delete_student(student_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $function
begin
  -- check if calling user is admin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not authorized. Admins only.';
  end if;

  -- ensure cannot delete self or another admin
  if exists (select 1 from public.profiles where id = student_id and role = 'admin') then
    raise exception 'Cannot delete an administrator.';
  end if;

  -- Soft delete profile
  update public.profiles
  set
    is_deleted = true,
    name = 'Studex user',
    username = null,
    avatar_url = null,
    phone = null,
    university = null,
    college = null,
    branch = null,
    major = null,
    year = null,
    semester = null,
    updated_at = now()
  where id = student_id;

  -- Scramble auth.users password to prevent sign-in until reactivated
  update auth.users
  set encrypted_password = crypt(gen_random_uuid()::text, gen_salt('bf'))
  where id = student_id;
end;
$function;

grant execute on function public.admin_delete_student(uuid) to authenticated;
