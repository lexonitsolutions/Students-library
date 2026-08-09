-- Notifications: "Approval and activity notifications" from the data plan.
-- Rows are only ever created by the server-side trigger below (security
-- definer), never inserted directly by a client -- a user can only read,
-- mark-read, or delete their own notifications.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('download', 'approval', 'rejection', 'comment', 'system', 'save')),
  title text not null,
  description text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users manage their own notifications"
  on public.notifications for select using (user_id = auth.uid());

create policy "Users can update their own notifications"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (user_id = auth.uid());

-- Notify the uploader when an admin approves or rejects their material.
create or replace function public.notify_material_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
    insert into public.notifications (user_id, type, title, description)
    values (
      new.uploader_id,
      case when new.status = 'approved' then 'approval' else 'rejection' end,
      case when new.status = 'approved' then 'Your upload was approved' else 'Your upload was rejected' end,
      case
        when new.status = 'approved' then format('"%s" is now live in the library.', new.title)
        else format('"%s" was rejected.%s', new.title, coalesce(' ' || new.rejection_reason, ''))
      end
    );
  end if;
  return null;
end;
$$;

create trigger trg_notify_material_status
  after update on public.materials
  for each row execute function public.notify_material_status_change();
