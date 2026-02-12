-- Fix: The remote_schema migration (20260210162035) dropped:
--   1. profiles.sling_id column (line 755)
--   2. trigger_auto_match_sling_user trigger (line 18)
--   3. auto_match_sling_user() function (line 117)
--
-- The approval system migration (20260211135346) recreated the function but NOT
-- the column or trigger. Without these, auto_match_sling_user() never fires and
-- would fail anyway since sling_id doesn't exist on profiles.

-- 1. Restore sling_id column on profiles (dropped by remote_schema)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sling_id uuid REFERENCES public.sling_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_sling_id ON public.profiles(sling_id);

-- 2. Recreate the trigger so future signups get auto-matched and auto-approved
DROP TRIGGER IF EXISTS trigger_auto_match_sling_user ON public.profiles;

CREATE TRIGGER trigger_auto_match_sling_user
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_match_sling_user();

-- 3. Backfill: auto-approve existing profiles that match sling_users but are stuck as 'pending'
UPDATE public.profiles p
SET
  approval_status = 'auto_approved',
  approved_at = now(),
  sling_id = s.id
FROM public.sling_users s
WHERE LOWER(p.email) = LOWER(s.email)
  AND s.is_active = true
  AND p.approval_status = 'pending';

-- Also fix profiles that already have a sling_id but are still pending
UPDATE public.profiles
SET
  approval_status = 'auto_approved',
  approved_at = now()
WHERE sling_id IS NOT NULL
  AND approval_status = 'pending';
