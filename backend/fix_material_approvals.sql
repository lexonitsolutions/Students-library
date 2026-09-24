-- ==============================================================================
-- RUN THIS IN SUPABASE SQL EDITOR (Dashboard -> SQL Editor -> New query -> Run)
-- ==============================================================================
-- Purpose:
-- Fix document approval & rejection so approved materials immediately move out
-- of Pending Review Queue into Manage Documents and Students Dashboard.
-- ==============================================================================

-- 1. Drop the legacy trigger that blocked status updates because auth.uid() is null under Clerk
DROP TRIGGER IF EXISTS trg_enforce_material_status ON public.materials;

-- 2. Update the enforce_material_status function so it only sets 'pending' on new inserts,
--    and allows status updates ('approved' / 'rejected') to proceed freely.
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

-- 3. Re-create the trigger for INSERT only
CREATE TRIGGER trg_enforce_material_status
  BEFORE INSERT ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.enforce_material_status();

-- 4. Mark cxzccxzc (or any currently pending document intended to be approved) as approved
UPDATE public.materials
SET status = 'approved', updated_at = now()
WHERE title = 'cxzccxzc' OR id = '5c76dbe6-65e9-420b-ace2-78fa9772853e';

-- 5. Verification query
SELECT id, title, status, subject, uploader_id, created_at, updated_at
FROM public.materials;
