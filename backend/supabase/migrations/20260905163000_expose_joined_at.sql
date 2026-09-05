-- Update the public_profiles view to securely expose the user's join date (created_at)
drop view if exists public.public_profiles cascade;

create view public.public_profiles as
  select id, name, username, avatar_url, university, college, branch, major, created_at as joined_at
  from public.profiles;

grant select on public.public_profiles to anon, authenticated;
