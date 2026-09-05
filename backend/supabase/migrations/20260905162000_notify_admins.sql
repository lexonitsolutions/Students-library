-- Update the notification trigger to notify ADMINS (not the uploader) on new inserts
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
      -- Find all admins and send them a notification in their bell
      insert into public.notifications (user_id, type, title, description)
      select 
        id as user_id,
        'system' as type,
        'New Material for Approval' as title,
        format('A new material "%s" has been uploaded and requires your review.', new.title) as description
      from public.profiles
      where role = 'admin';
    end if;

  -- For UPDATE operations (status changed by admin)
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
      -- Notify the uploader about the decision
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
