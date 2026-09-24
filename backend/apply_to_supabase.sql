-- ==============================================================================
-- ANSWERSBRO SUPABASE CONFIGURATION SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR (Dashboard -> SQL Editor -> New query -> Run)
-- ==============================================================================
-- Purpose:
-- 1. Configure public.profiles to use email as unique pointer and drop Supabase Auth dependencies
-- 2. Fix admin_allowlist permissions so admins can add/remove emails when using Clerk
-- 3. Update storage policies for 'materials' and 'avatars' buckets
-- 4. Ensure RLS policies allow seamless client operations with Clerk authentication
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE: EMAIL POINTER & INDEPENDENCE FROM AUTH.USERS
-- ------------------------------------------------------------------------------
-- Drop foreign key constraint to auth.users if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Ensure required columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_deleted boolean not null default false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_image text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_subjects text[];

-- Ensure unique index on lower(email) so email functions as a unique pointer
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_idx ON public.profiles (lower(email));

-- Drop legacy triggers that required Supabase Auth's auth.uid()
DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

-- Configure RLS on profiles to allow Clerk-authenticated frontend clients to read and update
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by owner or admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles upsert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select all" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert all" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update all" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete all" ON public.profiles;

CREATE POLICY "Profiles select all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles insert all" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Profiles update all" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Profiles delete all" ON public.profiles FOR DELETE USING (true);

-- Ensure public_profiles view is accessible
DROP VIEW IF EXISTS public.public_profiles CASCADE;
CREATE VIEW public.public_profiles AS
  SELECT id, name, username, avatar_url, university, college, branch, major, is_deleted, created_at as joined_at
  FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. ADMIN ALLOWLIST: FIX POLICIES SO ADMINS CAN BE ADDED/REMOVED
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  email text primary key,
  added_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint admin_allowlist_email_lowercase check (email = lower(email))
);

-- Seed primary admins
INSERT INTO public.admin_allowlist (email)
VALUES ('lexonitservices@gmail.com'), ('hr@lexonit.com')
ON CONFLICT (email) DO NOTHING;

-- Drop old RLS policies that checked auth.uid()
ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view the allowlist" ON public.admin_allowlist;
DROP POLICY IF EXISTS "Admins can add admin emails" ON public.admin_allowlist;
DROP POLICY IF EXISTS "Admins can remove admin emails" ON public.admin_allowlist;
DROP POLICY IF EXISTS "Allowlist view" ON public.admin_allowlist;
DROP POLICY IF EXISTS "Allowlist insert" ON public.admin_allowlist;
DROP POLICY IF EXISTS "Allowlist delete" ON public.admin_allowlist;
DROP POLICY IF EXISTS "Allowlist update" ON public.admin_allowlist;

CREATE POLICY "Allowlist view" ON public.admin_allowlist FOR SELECT USING (true);
CREATE POLICY "Allowlist insert" ON public.admin_allowlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Allowlist update" ON public.admin_allowlist FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allowlist delete" ON public.admin_allowlist FOR DELETE USING (true);

GRANT ALL ON public.admin_allowlist TO anon, authenticated;

-- Auto-sync profile role whenever an admin email is added or removed
CREATE OR REPLACE FUNCTION public.sync_profile_role_from_allowlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET role = 'admin', updated_at = now()
    WHERE lower(email) = lower(NEW.email) AND role <> 'admin';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Never demote the root admin
    IF lower(OLD.email) NOT IN ('lexonitservices@gmail.com', 'hr@lexonit.com') THEN
      UPDATE public.profiles
      SET role = 'student', updated_at = now()
      WHERE lower(email) = lower(OLD.email) AND role = 'admin';
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_allowlist_insert ON public.admin_allowlist;
CREATE TRIGGER trg_admin_allowlist_insert
  AFTER INSERT ON public.admin_allowlist
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_from_allowlist();

DROP TRIGGER IF EXISTS trg_admin_allowlist_delete ON public.admin_allowlist;
CREATE TRIGGER trg_admin_allowlist_delete
  AFTER DELETE ON public.admin_allowlist
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_from_allowlist();

-- ------------------------------------------------------------------------------
-- 3. STORAGE BUCKETS & POLICIES ('materials' and 'avatars')
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop old storage policies referencing auth.uid()
DROP POLICY IF EXISTS "Materials are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users upload materials into their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users update their own material files" ON storage.objects;
DROP POLICY IF EXISTS "Users delete their own material files" ON storage.objects;
DROP POLICY IF EXISTS "Materials public select" ON storage.objects;
DROP POLICY IF EXISTS "Materials public insert" ON storage.objects;
DROP POLICY IF EXISTS "Materials public update" ON storage.objects;
DROP POLICY IF EXISTS "Materials public delete" ON storage.objects;

CREATE POLICY "Materials public select" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
CREATE POLICY "Materials public insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials');
CREATE POLICY "Materials public update" ON storage.objects FOR UPDATE USING (bucket_id = 'materials');
CREATE POLICY "Materials public delete" ON storage.objects FOR DELETE USING (bucket_id = 'materials');

DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatars public select" ON storage.objects;
DROP POLICY IF EXISTS "Avatars public insert" ON storage.objects;
DROP POLICY IF EXISTS "Avatars public update" ON storage.objects;
DROP POLICY IF EXISTS "Avatars public delete" ON storage.objects;

CREATE POLICY "Avatars public select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatars public insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Avatars public update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
CREATE POLICY "Avatars public delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');

-- ------------------------------------------------------------------------------
-- 4. PERMISSIVE ACCESS FOR APPLICATION TABLES
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'materials', 'bookmarks', 'downloads', 'reports', 'notifications',
    'material_likes', 'material_shares', 'material_views', 'material_unique_views',
    'student_queries', 'query_messages', 'conversations', 'messages', 'message_requests'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_all_access', tbl);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl || '_all_access', tbl);
      EXECUTE format('GRANT ALL ON public.%I TO anon, authenticated', tbl);
    END IF;
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 4.1 FIX MATERIAL APPROVAL TRIGGER (CLERK COMPATIBILITY)
-- ------------------------------------------------------------------------------
-- Drop legacy trigger that prevented status updates because auth.uid() is null with Clerk
DROP TRIGGER IF EXISTS trg_enforce_material_status ON public.materials;

-- Replace enforce_material_status: default to 'pending' on insert, allow updates freely
CREATE OR REPLACE FUNCTION public.enforce_material_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF tg_op = 'INSERT' THEN
    IF NEW.status IS NULL THEN
      NEW.status := 'pending';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_material_status
  BEFORE INSERT ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.enforce_material_status();

-- Ensure any existing document pending approval (like cxzccxzc) is approved
UPDATE public.materials
SET status = 'approved', updated_at = now()
WHERE title = 'cxzccxzc' OR id = '5c76dbe6-65e9-420b-ace2-78fa9772853e';

-- ------------------------------------------------------------------------------
-- 5. MESSAGING FUNCTIONS COMPATIBLE WITH CLERK AUTHENTICATION
-- ------------------------------------------------------------------------------
-- send_message_request: accepts optional p_sender_id when auth.uid() is null (Clerk)
CREATE OR REPLACE FUNCTION public.send_message_request(
  p_receiver_id uuid,
  p_sender_id uuid default null
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid := coalesce(p_sender_id, auth.uid());
  v_existing  public.message_requests%rowtype;
  v_new_req   public.message_requests%rowtype;
BEGIN
  IF v_sender_id IS NULL THEN
    RETURN json_build_object('success', false, 'reason', 'Not authenticated');
  END IF;

  IF v_sender_id = p_receiver_id THEN
    RETURN json_build_object('success', false, 'reason', 'Cannot send a request to yourself');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_receiver_id) THEN
    RETURN json_build_object('success', false, 'reason', 'User not found');
  END IF;

  SELECT * INTO v_existing
  FROM public.message_requests
  WHERE (sender_id = v_sender_id AND receiver_id = p_receiver_id)
     OR (sender_id = p_receiver_id AND receiver_id = v_sender_id)
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    IF v_existing.status = 'pending' THEN
      RETURN json_build_object('success', false, 'reason', 'A pending request already exists', 'request_id', v_existing.id);
    END IF;
    IF v_existing.status = 'accepted' THEN
      RETURN json_build_object('success', false, 'reason', 'You are already connected', 'request_id', v_existing.id);
    END IF;
    IF v_existing.status = 'rejected' THEN
      RETURN json_build_object('success', false, 'reason', 'Your previous request was rejected');
    END IF;
  END IF;

  INSERT INTO public.message_requests (sender_id, receiver_id, status)
  VALUES (v_sender_id, p_receiver_id, 'pending')
  RETURNING * INTO v_new_req;

  RETURN json_build_object('success', true, 'request_id', v_new_req.id);
END;
$$;

-- accept_message_request
CREATE OR REPLACE FUNCTION public.accept_message_request(
  p_request_id uuid,
  p_caller_id uuid default null
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller  uuid := coalesce(p_caller_id, auth.uid());
  v_req     public.message_requests%rowtype;
  v_conv_id uuid;
BEGIN
  SELECT * INTO v_req FROM public.message_requests WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'reason', 'Request not found');
  END IF;

  IF v_caller IS NOT NULL AND v_req.receiver_id <> v_caller THEN
    RETURN json_build_object('success', false, 'reason', 'Not authorised');
  END IF;

  IF v_req.status <> 'pending' THEN
    RETURN json_build_object('success', false, 'reason', 'Request is not pending', 'status', v_req.status);
  END IF;

  UPDATE public.message_requests
  SET status = 'accepted', updated_at = now()
  WHERE id = p_request_id;

  INSERT INTO public.conversations (user_a, user_b, request_id)
  VALUES (v_req.sender_id, v_req.receiver_id, p_request_id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_conv_id;

  IF v_conv_id IS NULL THEN
    SELECT id INTO v_conv_id FROM public.conversations
    WHERE (user_a = v_req.sender_id AND user_b = v_req.receiver_id)
       OR (user_a = v_req.receiver_id AND user_b = v_req.sender_id)
    LIMIT 1;
  END IF;

  RETURN json_build_object('success', true, 'conversation_id', v_conv_id);
END;
$$;

-- reject_message_request
CREATE OR REPLACE FUNCTION public.reject_message_request(
  p_request_id uuid,
  p_caller_id uuid default null
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := coalesce(p_caller_id, auth.uid());
  v_req    public.message_requests%rowtype;
BEGIN
  SELECT * INTO v_req FROM public.message_requests WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'reason', 'Request not found');
  END IF;

  IF v_caller IS NOT NULL AND v_req.receiver_id <> v_caller THEN
    RETURN json_build_object('success', false, 'reason', 'Not authorised');
  END IF;

  IF v_req.status <> 'pending' THEN
    RETURN json_build_object('success', false, 'reason', 'Request is not pending', 'status', v_req.status);
  END IF;

  UPDATE public.message_requests
  SET status = 'rejected', updated_at = now()
  WHERE id = p_request_id;

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_message_request(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_message_request(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_message_request(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_message_request(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reject_message_request(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reject_message_request(uuid) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 6. MATERIAL VIEWS & INCREMENT VIEWS (CLERK COMPATIBILITY)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.material_views (
  material_id uuid NOT NULL REFERENCES public.materials (id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (material_id, user_id)
);

CREATE INDEX IF NOT EXISTS material_views_user_id_idx ON public.material_views (user_id);
CREATE INDEX IF NOT EXISTS material_views_material_id_idx ON public.material_views (material_id);

-- Ensure RLS on material_views is open for Clerk client
ALTER TABLE public.material_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS material_views_all_access ON public.material_views;
CREATE POLICY material_views_all_access ON public.material_views FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.material_views TO anon, authenticated;

drop function if exists public.increment_material_views(uuid);
drop function if exists public.increment_material_views(uuid, uuid);

create function public.increment_material_views(
  p_material_id uuid,
  p_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := coalesce(auth.uid(), p_user_id);
begin
  if v_user_id is null then
    raise exception 'A signed-in viewer is required';
  end if;
  if not exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'Viewer profile does not exist';
  end if;

  -- Lock the material before writing history so concurrent viewers cannot
  -- overwrite each other's totals. Pending/deleted materials do not get views.
  perform 1 from public.materials
  where id = p_material_id and status = 'approved'
  for update;
  if not found then
    return;
  end if;

  insert into public.material_views (material_id, user_id, viewed_at)
  values (p_material_id, v_user_id, now())
  on conflict (material_id, user_id) do update set viewed_at = excluded.viewed_at;

  update public.materials
  set views_count = (
    select count(*) from public.material_views where material_id = p_material_id
  )
  where id = p_material_id;
end;
$$;

revoke all on function public.increment_material_views(uuid, uuid) from public;
grant execute on function public.increment_material_views(uuid, uuid) to anon, authenticated;


-- ------------------------------------------------------------------------------
-- 7. ATOMIC MATERIAL DELETION & REALTIME PUBLICATION
-- ------------------------------------------------------------------------------
-- Enable Supabase Realtime broadcast for materials table so all clients sync deletions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'materials'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.materials;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Atomic deletion function that cleans up all dependencies and deletes the material
CREATE OR REPLACE FUNCTION public.delete_material_by_id(p_material_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Clean up child table records to prevent foreign key errors
  DELETE FROM public.bookmarks WHERE material_id = p_material_id;
  DELETE FROM public.downloads WHERE material_id = p_material_id;
  DELETE FROM public.reports WHERE material_id = p_material_id;
  DELETE FROM public.material_likes WHERE material_id = p_material_id;
  DELETE FROM public.material_views WHERE material_id = p_material_id;
  
  -- 2. Delete the material itself
  DELETE FROM public.materials WHERE id = p_material_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_material_by_id(uuid) TO anon, authenticated;

COMMIT;

-- ------------------------------------------------------------------------------
-- VERIFICATION CHECK
-- ------------------------------------------------------------------------------
SELECT email, role, is_deleted FROM public.profiles WHERE role = 'admin';
SELECT * FROM public.admin_allowlist;
