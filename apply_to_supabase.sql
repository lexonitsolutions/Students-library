-- 1. Remove the foreign key that causes profiles to be deleted when auth.users is deleted
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Add is_deleted column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_deleted boolean not null default false;

-- 3. Create a trigger function to convert deleted users into the "Studex user" template
CREATE OR REPLACE FUNCTION public.handle_deleted_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When auth.user is deleted, replace the profile with the Studex user template
  UPDATE public.profiles
  SET
    is_deleted = true,
    name = 'Studex user',
    username = null,
    avatar_url = null,
    phone = null,
    university = null,
    college = null,
    branch = null,
    major = null,
    year = null,
    semester = null,
    updated_at = now()
  WHERE id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- 4. Attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_user();

-- 5. Modify the handle_new_user trigger to AUTOMATICALLY restore materials if the user signs up again
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_id uuid;
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Check if they previously had an account that was deleted
    SELECT id INTO v_old_id 
    FROM public.profiles 
    WHERE lower(email) = lower(NEW.email) AND is_deleted = true 
    LIMIT 1;

    IF v_old_id IS NOT NULL THEN
      -- Transfer all documents and stats to the new account ID
      UPDATE public.materials SET uploader_id = NEW.id WHERE uploader_id = v_old_id;
      UPDATE public.bookmarks SET user_id = NEW.id WHERE user_id = v_old_id;
      UPDATE public.downloads SET user_id = NEW.id WHERE user_id = v_old_id;
      UPDATE public.profile_stats SET id = NEW.id WHERE id = v_old_id;
      
      -- Delete the old template profile
      DELETE FROM public.profiles WHERE id = v_old_id;
    END IF;

    -- Create their new active profile
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'name', SPLIT_PART(NEW.email, '@', 1), 'Student'),
      NEW.email,
      CASE
        WHEN EXISTS (SELECT 1 FROM public.admin_allowlist a WHERE lower(a.email) = lower(NEW.email))
          THEN 'admin'::public.user_role
        ELSE 'student'::public.user_role
      END
    )
    ON CONFLICT (id) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, profiles.name),
      email = EXCLUDED.email;
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Update the public_profiles view to include the is_deleted flag
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
  SELECT id, name, username, avatar_url, university, college, branch, major, is_deleted
  FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 7. Revert deletion RPCs to simply delete from auth.users, letting the trigger handle the rest
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_student(student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized. Admins only.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = student_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Cannot delete an administrator.';
  END IF;

  DELETE FROM auth.users WHERE id = student_id;
END;
$$;
