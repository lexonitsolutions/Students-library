-- Function to allow an authenticated user to permanently delete their account
-- from both public.profiles and auth.users (Authentication).

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

  -- Delete profile record from public.profiles (cascades to all user materials, bookmarks, downloads, stats)
  delete from public.profiles where id = v_uid;

  -- Delete user record from auth.users (permanently removes login credentials from Supabase Auth)
  delete from auth.users where id = v_uid;
end;
$$;

grant execute on function public.delete_user_account() to authenticated;
