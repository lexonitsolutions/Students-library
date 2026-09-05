-- Migration: Add likes_count, shares_count to materials, create material_likes table and interaction RPCs

-- 1. Add likes_count and shares_count columns to materials table
alter table public.materials
  add column if not exists likes_count int not null default 0,
  add column if not exists shares_count int not null default 0;

-- 2. Create material_likes table to track individual user likes
create table if not exists public.material_likes (
  material_id uuid not null references public.materials (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (material_id, user_id)
);

create index if not exists material_likes_material_idx on public.material_likes (material_id);
create index if not exists material_likes_user_idx on public.material_likes (user_id);

-- Enable RLS
alter table public.material_likes enable row level security;

-- Drop existing policies if any to ensure idempotency
drop policy if exists "Anyone can view likes" on public.material_likes;
drop policy if exists "Authenticated users can insert their own likes" on public.material_likes;
drop policy if exists "Authenticated users can delete their own likes" on public.material_likes;

-- Policies for material_likes
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

-- 3. Function to atomically toggle a like
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
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Must be logged in to like materials';
  end if;

  if exists (select 1 from public.material_likes where material_id = p_material_id and user_id = v_user_id) then
    delete from public.material_likes where material_id = p_material_id and user_id = v_user_id;
    update public.materials
    set likes_count = greatest(0, likes_count - 1)
    where id = p_material_id
    returning likes_count into v_count;
    v_liked := false;
  else
    insert into public.material_likes (material_id, user_id)
    values (p_material_id, v_user_id);
    update public.materials
    set likes_count = likes_count + 1
    where id = p_material_id
    returning likes_count into v_count;
    v_liked := true;
  end if;

  return json_build_object('is_liked', v_liked, 'likes_count', coalesce(v_count, 0));
end;
$$;

grant execute on function public.toggle_material_like(uuid) to authenticated;

-- 4. Function to atomically increment shares
create or replace function public.increment_material_shares(p_material_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update public.materials
  set shares_count = shares_count + 1
  where id = p_material_id
  returning shares_count into v_count;

  return coalesce(v_count, 0);
end;
$$;

grant execute on function public.increment_material_shares(uuid) to anon, authenticated;

-- 5. Function to atomically record downloads and sync count
create or replace function public.record_material_download(p_material_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_count int;
begin
  v_user_id := auth.uid();

  if v_user_id is not null then
    -- Record in download history (the trigger trg_downloads_sync_count will increment downloads_count)
    insert into public.downloads (user_id, material_id)
    values (v_user_id, p_material_id);
  else
    -- Anonymous / guest download
    update public.materials
    set downloads_count = downloads_count + 1
    where id = p_material_id;
  end if;

  select downloads_count into v_count from public.materials where id = p_material_id;
  return coalesce(v_count, 0);
end;
$$;

grant execute on function public.record_material_download(uuid) to anon, authenticated;
