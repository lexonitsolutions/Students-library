-- Bookmarks: "Saved material by user" from the data plan.
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, material_id)
);

create index bookmarks_user_idx on public.bookmarks (user_id);

alter table public.bookmarks enable row level security;

create policy "Users manage their own bookmarks"
  on public.bookmarks for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Keep materials.saves_count denormalized so listing pages don't need a
-- count(*) subquery per card.
create or replace function public.sync_material_saves_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.materials set saves_count = saves_count + 1 where id = new.material_id;
  elsif tg_op = 'DELETE' then
    update public.materials set saves_count = greatest(saves_count - 1, 0) where id = old.material_id;
  end if;
  return null;
end;
$$;

create trigger trg_bookmarks_sync_saves
  after insert or delete on public.bookmarks
  for each row execute function public.sync_material_saves_count();
