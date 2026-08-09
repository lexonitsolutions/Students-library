-- Materials: "PDF details" from the data plan. The actual file bytes live in
-- Supabase Storage (see the storage migration) -- this table only stores the
-- metadata and the storage URL, per the plan's "Database vs File Storage" rule.
create type public.material_type as enum ('pdf', 'doc', 'notes', 'slides', 'past-paper', 'lab-manual');
create type public.material_status as enum ('approved', 'pending', 'rejected');

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject text not null,
  semester text,
  university text,
  college text,
  branch text,
  year text,
  type public.material_type not null default 'notes',
  file_path text not null,
  file_url text not null,
  file_size_mb numeric,
  pages int,
  uploader_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  status public.material_status not null default 'pending',
  rejection_reason text,
  views_count int not null default 0,
  downloads_count int not null default 0,
  saves_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index materials_status_idx on public.materials (status);
create index materials_subject_idx on public.materials (subject);
create index materials_uploader_idx on public.materials (uploader_id);
create index materials_created_at_idx on public.materials (created_at desc);

alter table public.materials enable row level security;

create policy "Approved materials are public, owners and admins see all"
  on public.materials for select
  using (status = 'approved' or uploader_id = auth.uid() or public.is_admin(auth.uid()));

create policy "Authenticated users can upload materials"
  on public.materials for insert
  to authenticated
  with check (uploader_id = auth.uid());

create policy "Owners edit their own materials, admins edit any"
  on public.materials for update
  using (uploader_id = auth.uid() or public.is_admin(auth.uid()))
  with check (uploader_id = auth.uid() or public.is_admin(auth.uid()));

create policy "Owners or admins can delete materials"
  on public.materials for delete
  using (uploader_id = auth.uid() or public.is_admin(auth.uid()));

-- New uploads always start pending, and only an admin may change `status`
-- (the moderation/approval workflow from the data plan).
create or replace function public.enforce_material_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.rejection_reason := null;
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status and not public.is_admin(auth.uid()) then
      new.status := old.status;
      new.rejection_reason := old.rejection_reason;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_enforce_material_status
  before insert or update on public.materials
  for each row execute function public.enforce_material_status();
