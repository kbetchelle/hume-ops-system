-- Re-assert the auto_match_sling_user function with LOWER() email comparison
-- and re-run the backfill now that sling_users table is populated.

-- 1. Re-assert the trigger function (ensures LOWER comparison is in place)
CREATE OR REPLACE FUNCTION public.auto_match_sling_user()
RETURNS TRIGGER AS $$
DECLARE
  matched_sling_id uuid;
BEGIN
  -- Case-insensitive email match against sling_users
  SELECT id INTO matched_sling_id
  FROM public.sling_users
  WHERE LOWER(email) = LOWER(NEW.email)
    AND is_active = true
  LIMIT 1;
  
  -- If found, auto-approve and link to sling
  IF matched_sling_id IS NOT NULL THEN
    NEW.sling_id := matched_sling_id;
    NEW.approval_status := 'auto_approved';
    NEW.approved_at := now();
  ELSE
    -- No Sling match, keep as pending
    NEW.approval_status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Ensure trigger exists
DROP TRIGGER IF EXISTS trigger_auto_match_sling_user ON public.profiles;
CREATE TRIGGER trigger_auto_match_sling_user
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_match_sling_user();

-- 3. Backfill: auto-approve existing pending profiles that match sling_users
UPDATE public.profiles p
SET
  approval_status = 'auto_approved',
  approved_at = now(),
  sling_id = s.id
FROM public.sling_users s
WHERE LOWER(p.email) = LOWER(s.email)
  AND s.is_active = true
  AND p.approval_status = 'pending';

-- 4. Also fix any profiles that have a sling_id linked but are still pending
UPDATE public.profiles
SET
  approval_status = 'auto_approved',
  approved_at = now()
WHERE sling_id IS NOT NULL
  AND approval_status = 'pending';
