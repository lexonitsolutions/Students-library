-- Revert the notification trigger to ONLY handle UPDATE operations (admin approvals/rejections)
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

-- Recreate trigger to only fire on UPDATE again
drop trigger if exists trg_notify_material_status on public.materials;

create trigger trg_notify_material_status
  after update on public.materials
  for each row execute function public.notify_material_status_change();
