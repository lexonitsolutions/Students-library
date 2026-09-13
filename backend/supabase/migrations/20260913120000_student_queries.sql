-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Student Queries & Admin Query Management
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Table: student_queries
create table if not exists public.student_queries (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references public.profiles(id) on delete cascade,
  student_name        text not null,
  student_email       text,
  student_phone       text,
  category            text not null default 'General Inquiry',
  subject             text not null,
  description         text not null,
  status              text not null default 'Pending' check (status in ('Pending', 'Opened', 'Resolved')),
  assigned_admin_id   uuid references public.profiles(id) on delete set null,
  assigned_at         timestamptz,
  resolved_at         timestamptz,
  resolved_by         uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.student_queries add column if not exists student_phone text;

create index if not exists idx_student_queries_status on public.student_queries(status);
create index if not exists idx_student_queries_assigned on public.student_queries(assigned_admin_id);
create index if not exists idx_student_queries_student on public.student_queries(student_id);
create index if not exists idx_student_queries_created_at on public.student_queries(created_at desc);

alter table public.student_queries enable row level security;

-- Policies for student_queries:
create policy "Students can view own queries"
  on public.student_queries for select
  using (auth.uid() = student_id or public.is_admin(auth.uid()));

create policy "Students can insert own queries"
  on public.student_queries for insert
  with check (auth.uid() = student_id);

create policy "Admins can update queries"
  on public.student_queries for update
  using (public.is_admin(auth.uid()));

-- 2. Table: query_messages
create table if not exists public.query_messages (
  id            uuid primary key default gen_random_uuid(),
  query_id      uuid not null references public.student_queries(id) on delete cascade,
  sender_id     uuid not null references public.profiles(id) on delete cascade,
  sender_name   text not null,
  sender_role   text not null check (sender_role in ('student', 'admin')),
  message       text not null check (char_length(message) > 0 and char_length(message) <= 5000),
  created_at    timestamptz not null default now()
);

create index if not exists idx_query_messages_query on public.query_messages(query_id, created_at);

alter table public.query_messages enable row level security;

create policy "Participants can read query messages"
  on public.query_messages for select
  using (
    public.is_admin(auth.uid()) or exists (
      select 1 from public.student_queries q
      where q.id = query_id and q.student_id = auth.uid()
    )
  );

create policy "Participants can send query messages"
  on public.query_messages for insert
  with check (
    auth.uid() = sender_id and (
      public.is_admin(auth.uid()) or exists (
        select 1 from public.student_queries q
        where q.id = query_id and q.student_id = auth.uid()
      )
    )
  );

-- 3. Concurrency-safe Atomic Claim RPC
create or replace function public.claim_student_query(p_query_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller          uuid := auth.uid();
  v_caller_role     text;
  v_existing_admin  uuid;
  v_existing_status text;
  v_updated         public.student_queries%rowtype;
begin
  if v_caller is null then
    return json_build_object('success', false, 'reason', 'Not authenticated');
  end if;

  if not public.is_admin(v_caller) then
    return json_build_object('success', false, 'reason', 'Only administrators can claim queries');
  end if;

  update public.student_queries
  set assigned_admin_id = v_caller,
      assigned_at = now(),
      status = 'Opened',
      updated_at = now()
  where id = p_query_id
    and assigned_admin_id is null
    and status = 'Pending'
  returning * into v_updated;

  if found then
    return json_build_object(
      'success', true,
      'query_id', v_updated.id,
      'assigned_admin_id', v_updated.assigned_admin_id,
      'status', v_updated.status
    );
  end if;

  select assigned_admin_id, status into v_existing_admin, v_existing_status
  from public.student_queries
  where id = p_query_id;

  if not found then
    return json_build_object('success', false, 'reason', 'Query does not exist');
  end if;

  if v_existing_admin is not null and v_existing_admin <> v_caller then
    return json_build_object(
      'success', false,
      'already_assigned', true,
      'reason', 'This query has already been assigned to another admin.'
    );
  end if;

  if v_existing_admin = v_caller then
    return json_build_object(
      'success', true,
      'query_id', p_query_id,
      'assigned_admin_id', v_caller,
      'status', v_existing_status
    );
  end if;

  return json_build_object(
    'success', false,
    'reason', format('Cannot claim query in %s status', v_existing_status)
  );
end;
$$;

grant execute on function public.claim_student_query(uuid) to authenticated;

-- 4. Mark query as Resolved RPC
create or replace function public.resolve_student_query(p_query_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    return json_build_object('success', false, 'reason', 'Not authenticated');
  end if;

  if not public.is_admin(v_caller) then
    return json_build_object('success', false, 'reason', 'Only administrators can resolve queries');
  end if;

  update public.student_queries
  set status = 'Resolved',
      resolved_at = now(),
      resolved_by = v_caller,
      updated_at = now()
  where id = p_query_id;

  if not found then
    return json_build_object('success', false, 'reason', 'Query not found');
  end if;

  return json_build_object('success', true);
end;
$$;

grant execute on function public.resolve_student_query(uuid) to authenticated;