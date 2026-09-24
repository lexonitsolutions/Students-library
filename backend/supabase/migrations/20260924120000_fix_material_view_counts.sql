-- Keep views equal to recorded unique signed-in viewers.
-- Matches this project's existing Clerk client/profile-ID integration.
begin;

-- Serialize the repair against visits while installing the corrected RPC.
lock table public.materials, public.material_views in share row exclusive mode;

drop function if exists public.increment_material_views(uuid);
drop function if exists public.increment_material_views(uuid, uuid);

create function public.increment_material_views(
  p_material_id uuid,
  p_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := coalesce(auth.uid(), p_user_id);
begin
  if v_user_id is null then
    raise exception 'A signed-in viewer is required';
  end if;
  if not exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'Viewer profile does not exist';
  end if;

  -- Lock the material before writing history so concurrent viewers cannot
  -- overwrite each other's totals. Pending/deleted materials do not get views.
  perform 1 from public.materials
  where id = p_material_id and status = 'approved'
  for update;
  if not found then
    return;
  end if;

  insert into public.material_views (material_id, user_id, viewed_at)
  values (p_material_id, v_user_id, now())
  on conflict (material_id, user_id) do update set viewed_at = excluded.viewed_at;

  update public.materials
  set views_count = (
    select count(*) from public.material_views where material_id = p_material_id
  )
  where id = p_material_id;
end;
$$;

revoke all on function public.increment_material_views(uuid, uuid) from public;
grant execute on function public.increment_material_views(uuid, uuid) to anon, authenticated;

-- Only recorded history is recoverable; unrecorded past visits cannot be inferred.
update public.materials m
set views_count = (select count(*) from public.material_views v where v.material_id = m.id);

commit;
