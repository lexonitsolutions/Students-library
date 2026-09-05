-- Create a table to track unique views per user and material
create table if not exists public.material_views (
  material_id uuid not null references public.materials (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (material_id, user_id)
);

-- Enable RLS
alter table public.material_views enable row level security;

-- Users can view their own view history (optional but good for RLS completeness)
create policy "Users can see their own views"
  on public.material_views for select
  using (user_id = auth.uid());

create policy "Users can insert their own views"
  on public.material_views for insert
  with check (user_id = auth.uid());

-- Drop the old simple increment function
drop function if exists public.increment_material_views(uuid);

-- Create the new smart increment function
create or replace function public.increment_material_views(p_material_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  
  -- Only track authenticated users
  if v_user_id is not null then
    
    -- Attempt to insert a new view record. 
    -- If this exact user has already viewed this material, it will conflict and do nothing.
    insert into public.material_views (material_id, user_id)
    values (p_material_id, v_user_id)
    on conflict (material_id, user_id) do nothing;
    
    -- "found" is true if the insert actually inserted a row (a new unique view)
    if found then
      update public.materials
      set views_count = views_count + 1
      where id = p_material_id and status = 'approved';
    end if;
    
  end if;
end;
$$;
