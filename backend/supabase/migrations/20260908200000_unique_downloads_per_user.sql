-- Enforce unique downloads per user per material so 1 download count per account

-- 1. Ensure unique index on (user_id, material_id) in downloads table
create unique index if not exists downloads_user_material_uidx 
  on public.downloads (user_id, material_id);

-- 2. Update record_material_download function to avoid duplicate counts per user account
create or replace function public.record_material_download(p_material_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_count int;
  v_already_downloaded boolean := false;
begin
  v_user_id := auth.uid();

  if v_user_id is not null then
    -- Check if user has already downloaded this material
    select exists(
      select 1 from public.downloads
      where user_id = v_user_id and material_id = p_material_id
    ) into v_already_downloaded;

    if not v_already_downloaded then
      -- Insert download record (the trigger trg_downloads_sync_count will increment downloads_count)
      insert into public.downloads (user_id, material_id)
      values (v_user_id, p_material_id)
      on conflict (user_id, material_id) do nothing;
    end if;
  else
    -- Guest / anonymous download
    update public.materials
    set downloads_count = downloads_count + 1
    where id = p_material_id;
  end if;

  select downloads_count into v_count from public.materials where id = p_material_id;
  return coalesce(v_count, 0);
end;
$$;

grant execute on function public.record_material_download(uuid) to anon, authenticated;
