-- Reports: "Reported material and reason" from the data plan.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

create index reports_status_idx on public.reports (status);

alter table public.reports enable row level security;

create policy "Authenticated users can report materials"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "Users see their own reports, admins see all"
  on public.reports for select
  using (reporter_id = auth.uid() or public.is_admin(auth.uid()));

create policy "Admins can resolve reports"
  on public.reports for update
  using (public.is_admin(auth.uid()));
