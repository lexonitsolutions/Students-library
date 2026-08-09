-- Download history: "User and material records" from the data plan.
create table public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  downloaded_at timestamptz not null default now()
);

create index downloads_user_idx on public.downloads (user_id);
create index downloads_material_idx on public.downloads (material_id);

alter table public.downloads enable row level security;

create policy "Users see their own download history, admins see all"
  on public.downloads for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "Authenticated users can record their own downloads"
  on public.downloads for insert
  to authenticated
  with check (user_id = auth.uid());

create or replace function public.sync_material_downloads_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.materials set downloads_count = downloads_count + 1 where id = new.material_id;
  return null;
end;
$$;

create trigger trg_downloads_sync_count
  after insert on public.downloads
  for each row execute function public.sync_material_downloads_count();
