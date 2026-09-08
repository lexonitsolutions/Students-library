-- Fix the notification trigger so rejection notifications show a clean human-readable
-- reason instead of the raw REJECTED:{...json...} metadata string.
create or replace function public.notify_material_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reason text;
  v_description text;
begin
  -- For INSERT operations (new material uploaded)
  if tg_op = ''INSERT'' then
    if new.status = ''pending'' then
      insert into public.notifications (user_id, type, title, description)
      select
        id as user_id,
        ''system'' as type,
        ''New Material for Approval'' as title,
        format(''A new material "%s" has been uploaded and requires your review.'', new.title) as description
      from public.profiles
      where role = ''admin'';
    end if;

  -- For UPDATE operations (status changed by admin)
  elsif tg_op = ''UPDATE'' then
    if new.status is distinct from old.status and new.status in (''approved'', ''rejected'') then

      if new.status = ''rejected'' then
        -- Parse the human-readable reason from the REJECTED:{...} JSON metadata
        if new.rejection_reason is not null and new.rejection_reason like ''REJECTED:{%'' then
          begin
            v_reason := (regexp_replace(new.rejection_reason, ''^REJECTED:'', ''''))::jsonb ->> ''reason'';
          exception when others then
            v_reason := null;
          end;
        else
          v_reason := new.rejection_reason;
        end if;

        v_reason := coalesce(nullif(trim(both ''"'' from coalesce(v_reason, '''')), ''''), ''Did not meet guidelines'');
        v_description := format(''"%s" was rejected. Reason: %s'', new.title, v_reason);
      else
        v_description := format(''"%s" is now live in the library.'', new.title);
      end if;

      insert into public.notifications (user_id, type, title, description)
      values (
        new.uploader_id,
        case when new.status = ''approved'' then ''approval'' else ''rejection'' end,
        case when new.status = ''approved'' then ''Your upload was approved'' else ''Your upload was rejected'' end,
        v_description
      );
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_notify_material_status on public.materials;

create trigger trg_notify_material_status
  after insert or update on public.materials
  for each row execute function public.notify_material_status_change();
