-- ==============================================================================
-- ANSWERSBRO COMPLETE DATABASE & STORAGE CLEANUP SCRIPT (V3 - DYNAMIC & SAFE)
-- ==============================================================================
-- Target: Supabase SQL Editor (Run as postgres superuser)
--
-- Actions:
-- 1. Safely wipes all existing data tables (handles missing tables automatically)
-- 2. Removes ALL materials, past papers, notes, bookmarks, likes, chats
-- 3. Removes ALL non-admin users from auth.users and public.profiles
-- 4. RETAINS and PROMOTES ONLY the main admin: lexonitservices@gmail.com
-- ==============================================================================

BEGIN;

-- 1. Temporarily disable triggers that might convert users to soft-deleted or block role sync
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;

-- 2. Dynamically delete from all interaction/material tables if they exist
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'query_messages', 'student_queries', 'student_query_messages',
    'messages', 'message_requests', 'conversation_participants', 'conversations',
    'notifications', 'reports', 'bookmarks', 'downloads',
    'material_likes', 'material_shares', 'material_views', 'material_unique_views',
    'materials'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('DELETE FROM public.%I', tbl);
    END IF;
  END LOOP;
END $$;

-- 3. Ensure the admin allowlist contains the main admin
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_allowlist') THEN
    INSERT INTO public.admin_allowlist (email)
    VALUES ('lexonitservices@gmail.com')
    ON CONFLICT (email) DO NOTHING;

    DELETE FROM public.admin_allowlist
    WHERE lower(email) NOT IN ('lexonitservices@gmail.com', 'hr@lexonit.com');
  END IF;
END $$;

-- 4. Promote main admin to 'admin' role and restore active status
UPDATE public.profiles
SET
  role = 'admin',
  is_deleted = false,
  updated_at = now()
WHERE lower(email) = 'lexonitservices@gmail.com';

-- 5. Delete all other user profiles (only lexonitservices@gmail.com is kept)
DELETE FROM public.profiles
WHERE lower(coalesce(email, '')) != 'lexonitservices@gmail.com';

-- 6. Delete all other auth.users (only lexonitservices@gmail.com is kept)
DELETE FROM auth.users
WHERE lower(coalesce(email, '')) != 'lexonitservices@gmail.com';

-- 7. Re-enable the role guard trigger if the function exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'protect_profile_role') THEN
    DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
    CREATE TRIGGER trg_protect_profile_role
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();
  END IF;
END $$;

COMMIT;

-- 8. Audit verification: confirm table counts
SELECT 'public.profiles' AS table_name, count(*) AS count FROM public.profiles
UNION ALL
SELECT 'auth.users', count(*) FROM auth.users
UNION ALL
SELECT 'public.materials', count(*) FROM public.materials;

-- Show the remaining main admin profile
SELECT id, name, email, role, is_deleted FROM public.profiles;
