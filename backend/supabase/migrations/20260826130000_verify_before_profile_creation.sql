-- Defer profile creation until the user's email has been verified via OTP or link

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only create a profile when the user's email has been verified!
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

-- Replace trigger to execute on INSERT OR UPDATE of email_confirmed_at
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.handle_new_user();
