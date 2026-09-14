-- Migration: Strictly enforce single like per user per document and synchronize likes_count from material_likes

-- 1. Ensure table exists with unique primary key
create table if not exists public.material_likes (
  material_id uuid not null references public.materials (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (material_id, user_id)
);

-- Ensure unique index
create unique index if not exists material_likes_user_material_unique_idx
  on public.material_likes (material_id, user_id);

-- Enable RLS
alter table public.material_likes enable row level security;

-- Idempotent policies
drop policy if exists "Anyone can view likes" on public.material_likes;
drop policy if exists "Authenticated users can insert their own likes" on public.material_likes;
drop policy if exists "Authenticated users can delete their own likes" on public.material_likes;

create policy "Anyone can view likes"
  on public.material_likes for select
  using (true);

create policy "Authenticated users can insert their own likes"
  on public.material_likes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Authenticated users can delete their own likes"
  on public.material_likes for delete
  to authenticated
  using (user_id = auth.uid());

-- 2. Drop any trigger that resets likes_count to row count of material_likes
drop trigger if exists tr_sync_material_likes on public.material_likes;
drop function if exists public.sync_material_likes_count();

-- 3. Atomic toggle RPC that preserves baseline like count and prevents race conditions
create or replace function public.toggle_material_like(p_material_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_liked boolean;
  v_count int;
  v_current_likes int;
  v_current_saves int;
  v_base_likes int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Must be logged in to like materials';
  end if;

  -- Read current counts from materials to preserve baseline
  select coalesce(likes_count, 0), coalesce(saves_count, 0)
  into v_current_likes, v_current_saves
  from public.materials
  where id = p_material_id;

  v_base_likes := greatest(v_current_likes, v_current_saves);

  if exists (select 1 from public.material_likes where material_id = p_material_id and user_id = v_user_id) then
    delete from public.material_likes where material_id = p_material_id and user_id = v_user_id;
    v_liked := false;
    v_count := greatest(0, v_base_likes - 1);
  else
    insert into public.material_likes (material_id, user_id)
    values (p_material_id, v_user_id)
    on conflict (material_id, user_id) do nothing;
    v_liked := true;
    v_count := v_base_likes + 1;
  end if;

  update public.materials
  set likes_count = v_count
  where id = p_material_id;

  return json_build_object('is_liked', v_liked, 'likes_count', v_count);
end;
$$;

grant execute on function public.toggle_material_like(uuid) to authenticated;
