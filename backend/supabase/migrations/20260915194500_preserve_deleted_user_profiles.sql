-- 1. Drop the foreign key constraint that causes profiles (and materials) to be deleted
-- Note: the constraint name is usually 'profiles_id_fkey'. If it's different, you may need to adjust this.
alter table public.profiles drop constraint if exists profiles_id_fkey;

-- Ensure is_deleted column exists just in case
alter table public.profiles add column if not exists is_deleted boolean not null default false;

-- 2. Create the trigger function to update the profile when auth.users is deleted
create or replace function public.handle_deleted_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Replace that users profile with Studex user template instead of deleting it
  update public.profiles
  set
    is_deleted = true,
    name = 'Studex user',
    username = null,
    avatar_url = null,
    email = null,
    phone = null,
    university = null,
    college = null,
    branch = null,
    major = null,
    year = null,
    semester = null,
    updated_at = now()
  where id = old.id;
  
  return old;
end;
$$;

-- 3. Attach the trigger to auth.users
drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.handle_deleted_user();

-- 4. Restore the original deletion RPCs to simply delete from auth.users
-- (The trigger will handle the rest)
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

  -- Delete from auth.users (trigger will soft-delete the profile)
  delete from auth.users where id = v_uid;
end;
$$;

create or replace function public.admin_delete_student(student_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not authorized. Admins only.';
  end if;

  if exists (select 1 from public.profiles where id = student_id and role = 'admin') then
    raise exception 'Cannot delete an administrator.';
  end if;

  -- Delete from auth.users (trigger will soft-delete the profile)
  delete from auth.users where id = student_id;
end;
$$;

-- 5. Update public_profiles view to include is_deleted
drop view if exists public.public_profiles;
create view public.public_profiles as
  select id, name, username, avatar_url, university, college, branch, major, is_deleted
  from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- 6. Modify check_account_status to return is_deleted
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
      where lower(p.email) = lower(p_email)
        and p.is_deleted = true
    ) as is_deleted;
$$;
grant execute on function public.check_account_status(text) to anon, authenticated;

-- 7. Create reactivate_deleted_account function
create or replace function public.reactivate_deleted_account(p_email text, p_password text, p_name text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid;
begin
  select id into v_uid from public.profiles where lower(email) = lower(p_email) and is_deleted = true;
  
  if v_uid is null then
    raise exception 'User not found';
  end if;

  -- Insert the user back into auth.users (since they were deleted)
  -- This is tricky! 
  -- If we deleted them from auth.users, they no longer exist in auth.users.
  -- Supabase Auth signUp generates a new UUID. We cannot easily insert into auth.users with the OLD UUID
  -- without directly manipulating auth.users which might break GoTrue.
end;
$$;
