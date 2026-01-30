-- Create staging table for sling_users (if not already created)
CREATE TABLE IF NOT EXISTS public.sling_users_staging (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_batch_id uuid NOT NULL,
  sling_user_id integer NOT NULL,
  first_name text,
  last_name text,
  email text,
  positions text[],
  is_active boolean DEFAULT true,
  position_id bigint,
  position_name text,
  raw_data jsonb,
  staged_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on staging table
ALTER TABLE public.sling_users_staging ENABLE ROW LEVEL SECURITY;

-- RLS policy for staging table (drop if exists first)
DROP POLICY IF EXISTS "Managers can manage sling_users_staging" ON public.sling_users_staging;
CREATE POLICY "Managers can manage sling_users_staging"
  ON public.sling_users_staging
  FOR ALL
  USING (is_manager_or_admin(auth.uid()));

-- Add sling_users sync to sync_schedule if not exists
INSERT INTO public.sync_schedule (
  sync_type,
  display_name,
  function_name,
  interval_minutes,
  is_enabled
)
SELECT 
  'sling_users',
  'Sling Users',
  'sling-api',
  60,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.sync_schedule WHERE sync_type = 'sling_users'
);

-- Add API endpoint for sling users
INSERT INTO public.api_endpoints (
  api_name,
  endpoint_type,
  base_url,
  endpoint_path,
  rate_limit_per_min,
  is_active
)
SELECT
  'sling',
  'users',
  'https://api.getsling.com/v1',
  '/{org_id}/users',
  60,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.api_endpoints 
  WHERE api_name = 'sling' AND endpoint_type = 'users'
);

-- Create index on sling_user_id for better lookup performance
CREATE INDEX IF NOT EXISTS idx_sling_users_sling_user_id 
  ON public.sling_users(sling_user_id);

CREATE INDEX IF NOT EXISTS idx_staff_shifts_sling_user_id 
  ON public.staff_shifts(sling_user_id);