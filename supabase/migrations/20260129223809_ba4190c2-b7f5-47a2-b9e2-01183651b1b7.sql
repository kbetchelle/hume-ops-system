-- Create staff_shifts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name TEXT,
  schedule_date DATE,
  shift_start TIMESTAMPTZ,
  shift_end TIMESTAMPTZ,
  position TEXT,
  location TEXT,
  status TEXT DEFAULT 'scheduled',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ
);

-- Update staff_shifts table to include sling-specific columns
ALTER TABLE public.staff_shifts 
  ADD COLUMN IF NOT EXISTS sling_shift_id bigint UNIQUE,
  ADD COLUMN IF NOT EXISTS sling_user_id bigint;

-- Add index for sling_user_id
CREATE INDEX IF NOT EXISTS idx_staff_shifts_sling_user ON public.staff_shifts(sling_user_id);

-- Update sling_users table with additional columns
ALTER TABLE public.sling_users 
  ADD COLUMN IF NOT EXISTS position_id bigint,
  ADD COLUMN IF NOT EXISTS position_name text,
  ADD COLUMN IF NOT EXISTS raw_data jsonb;

-- Add index for email linking
CREATE INDEX IF NOT EXISTS idx_sling_users_email ON public.sling_users(email);

-- Ensure RLS is enabled on staff_shifts
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Authenticated users can view staff_shifts" ON public.staff_shifts;
DROP POLICY IF EXISTS "Managers can manage staff_shifts" ON public.staff_shifts;

-- RLS policies for staff_shifts
CREATE POLICY "Authenticated users can view staff_shifts"
  ON public.staff_shifts
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage staff_shifts"
  ON public.staff_shifts
  FOR ALL
  USING (is_manager_or_admin(auth.uid()));

-- Add api_sync_status entry for sling if not exists
INSERT INTO public.api_sync_status (api_name, is_enabled, sync_frequency_minutes)
VALUES ('sling', true, 30)
ON CONFLICT (api_name) DO NOTHING;