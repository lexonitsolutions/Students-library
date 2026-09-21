-- ==============================================================================
-- Migration: Fix material approval trigger for Clerk authentication
-- ==============================================================================
-- Drop the legacy trigger that prevented material status updates
DROP TRIGGER IF EXISTS trg_enforce_material_status ON public.materials;

-- Replace enforce_material_status to set 'pending' on insert, but allow updates freely
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

-- Approve cxzccxzc or any pending document
UPDATE public.materials
SET status = 'approved', updated_at = now()
WHERE title = 'cxzccxzc' OR id = '5c76dbe6-65e9-420b-ace2-78fa9772853e';
