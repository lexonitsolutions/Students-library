-- Update the notification trigger to also handle new inserts (pending approval)
create or replace function public.notify_material_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- For INSERT operations (new material uploaded)
  if tg_op = 'INSERT' then
    if new.status = 'pending' then
      insert into public.notifications (user_id, type, title, description)
      values (
        new.uploader_id,
        'system',
        'Upload Sent for Approval',
        format('Your material "%s" has been submitted successfully and is pending admin approval.', new.title)
      );
    end if;
  -- For UPDATE operations (status changed by admin)
  elsif tg_op = 'UPDATE' then
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
  end if;
  return null;
end;
$$;

-- Drop the old trigger and recreate it to fire on both INSERT and UPDATE
drop trigger if exists trg_notify_material_status on public.materials;

create trigger trg_notify_material_status
  after insert or update on public.materials
  for each row execute function public.notify_material_status_change();
