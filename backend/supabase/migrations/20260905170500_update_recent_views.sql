-- Update material_views to update the viewed_at timestamp so recently viewed works nicely
create or replace function public.increment_material_views(p_material_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_inserted boolean;
begin
  v_user_id := auth.uid();
  
  -- Only track authenticated users
  if v_user_id is not null then
    
    -- Insert or update the view record to keep viewed_at fresh
    insert into public.material_views (material_id, user_id)
    values (p_material_id, v_user_id)
    on conflict (material_id, user_id) do update 
    set viewed_at = now()
    returning (xmax = 0) into v_inserted;
    
    -- If xmax = 0, it was a new insert, so increment the global counter
    if v_inserted then
      update public.materials
      set views_count = views_count + 1
      where id = p_material_id and status = 'approved';
    end if;
    
  end if;
end;
$$;
