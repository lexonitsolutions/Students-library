-- "Views / download counts" from the data plan: anonymous visitors can bump
-- a material's view counter without needing UPDATE rights on the row itself.
create or replace function public.increment_material_views(p_material_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.materials
  set views_count = views_count + 1
  where id = p_material_id and status = 'approved';
$$;

grant execute on function public.increment_material_views(uuid) to anon, authenticated;

-- Per-user aggregate counts shown on the profile page (uploads / downloads / saved).
create view public.profile_stats as
  select
    p.id as user_id,
    coalesce((select count(*) from public.materials m where m.uploader_id = p.id and m.status = 'approved'), 0) as uploads_count,
    coalesce((select count(*) from public.downloads d where d.user_id = p.id), 0) as downloads_count,
    coalesce((select count(*) from public.bookmarks b where b.user_id = p.id), 0) as saved_count
  from public.profiles p;

grant select on public.profile_stats to authenticated;
