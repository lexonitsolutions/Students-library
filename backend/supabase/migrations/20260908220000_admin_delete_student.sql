-- Allow admins to delete student accounts completely (auth.users + public.profiles + cascade)
create or replace function public.admin_delete_student(student_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  -- check if calling user is admin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not authorized. Admins only.';
  end if;

  -- ensure cannot delete self or another admin
  if exists (select 1 from public.profiles where id = student_id and role = 'admin') then
    raise exception 'Cannot delete an administrator.';
  end if;

  -- Delete from auth.users (cascades to public.profiles and all associated records)
  delete from auth.users where id = student_id;

  -- Delete from public.profiles in case profile was orphaned
  delete from public.profiles where id = student_id;
end;
$$;

grant execute on function public.admin_delete_student(uuid) to authenticated;

-- Add RLS delete policy on public.profiles for admins
drop policy if exists "Admins can delete student profiles" on public.profiles;

create policy "Admins can delete student profiles"
  on public.profiles for delete
  using (public.is_admin(auth.uid()) and role = 'student');
