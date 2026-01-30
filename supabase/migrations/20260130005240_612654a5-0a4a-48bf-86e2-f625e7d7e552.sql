-- Remove user_email and location from staff_shifts
ALTER TABLE public.staff_shifts 
  DROP COLUMN IF EXISTS user_email,
  DROP COLUMN IF EXISTS location;

-- Remove user_email and location from sling_shifts_staging
ALTER TABLE public.sling_shifts_staging
  DROP COLUMN IF EXISTS user_email,
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS location_id,
  DROP COLUMN IF EXISTS location_name;

-- Make shift_date a generated column based on shift_start in LA timezone
-- First drop the existing column
ALTER TABLE public.staff_shifts DROP COLUMN IF EXISTS shift_date;

-- Add it back as a generated column
ALTER TABLE public.staff_shifts 
  ADD COLUMN shift_date date GENERATED ALWAYS AS (
    (shift_start AT TIME ZONE 'America/Los_Angeles')::date
  ) STORED;

-- Create index on the new computed column
CREATE INDEX IF NOT EXISTS idx_staff_shifts_shift_date ON public.staff_shifts(shift_date);