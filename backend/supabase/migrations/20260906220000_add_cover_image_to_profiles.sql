-- Add cover_image to public.profiles table
alter table public.profiles add column if not exists cover_image text;

-- Update public.public_profiles view to include cover_image if desired
create or replace view public.public_profiles as
  select id, name, username, avatar_url, cover_image, university, college, branch, major
  from public.profiles;

grant select on public.public_profiles to anon, authenticated;
