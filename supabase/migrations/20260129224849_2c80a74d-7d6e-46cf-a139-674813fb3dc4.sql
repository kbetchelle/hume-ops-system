-- Create sync_schedule table for automated sync scheduling
CREATE TABLE public.sync_schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type text NOT NULL UNIQUE,
  interval_minutes integer NOT NULL DEFAULT 60,
  last_run_at timestamptz,
  next_run_at timestamptz,
  is_enabled boolean NOT NULL DEFAULT true,
  last_status text DEFAULT 'pending',
  last_error text,
  records_synced integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for sync_schedule
CREATE INDEX idx_sync_schedule_next_run ON public.sync_schedule(next_run_at) WHERE is_enabled = true;
CREATE INDEX idx_sync_schedule_type ON public.sync_schedule(sync_type);

-- Enable RLS on sync_schedule
ALTER TABLE public.sync_schedule ENABLE ROW LEVEL SECURITY;

-- RLS policies for sync_schedule
CREATE POLICY "Authenticated users can view sync_schedule"
  ON public.sync_schedule
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage sync_schedule"
  ON public.sync_schedule
  FOR ALL
  USING (is_manager_or_admin(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_sync_schedule_updated_at
  BEFORE UPDATE ON public.sync_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default sync schedules
INSERT INTO public.sync_schedule (sync_type, interval_minutes, next_run_at, is_enabled, last_status)
VALUES 
  ('arketa_members', 60, now(), true, 'pending'),
  ('arketa_classes', 30, now(), true, 'pending'),
  ('arketa_reservations', 15, now(), true, 'pending'),
  ('arketa_payments', 30, now(), true, 'pending'),
  ('arketa_instructors', 240, now(), true, 'pending'),
  ('sling_users', 240, now(), true, 'pending'),
  ('sling_shifts', 60, now(), true, 'pending')
ON CONFLICT (sync_type) DO NOTHING;

-- Add additional fields to api_endpoints table if not exists
DO $$ 
BEGIN
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'api_endpoints' 
                 AND column_name = 'updated_at') THEN
    ALTER TABLE public.api_endpoints ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Seed Arketa endpoints
INSERT INTO public.api_endpoints (api_name, endpoint_type, base_url, endpoint_path, rate_limit_per_min, is_active)
VALUES 
  ('arketa', 'classes', 'https://us-central1-sutra-prod.cloudfunctions.net', '/partnerApi/v0/{partnerId}/classes', 100, true),
  ('arketa', 'reservations', 'https://us-central1-sutra-prod.cloudfunctions.net', '/partnerApi/v0/{partnerId}/reservations', 100, true),
  ('arketa', 'clients', 'https://us-central1-sutra-prod.cloudfunctions.net', '/partnerApiDev/v0/{partnerId}/clients', 100, true),
  ('arketa', 'staff', 'https://us-central1-sutra-prod.cloudfunctions.net', '/partnerApiDev/v0/{partnerId}/staff', 50, true),
  ('arketa', 'purchases', 'https://us-central1-sutra-prod.cloudfunctions.net', '/partnerApi/v0/{partnerId}/purchases', 100, true),
  ('arketa', 'products', 'https://us-central1-sutra-prod.cloudfunctions.net', '/partnerApi/v0/{partnerId}/products', 50, true),
  ('arketa', 'services', 'https://us-central1-sutra-prod.cloudfunctions.net', '/partnerApi/v0/{partnerId}/services', 50, true),
  ('arketa', 'subscriptions', 'https://us-central1-sutra-prod.cloudfunctions.net', '/partnerApi/v0/{partnerId}/subscriptions', 50, true),
  ('arketa', 'waitlists', 'https://us-central1-sutra-prod.cloudfunctions.net', '/partnerApi/v0/{partnerId}/waitlists', 50, true),
  ('sling', 'users', 'https://api.getsling.com', '/v1/users', 60, true),
  ('sling', 'groups', 'https://api.getsling.com', '/v1/groups', 60, true),
  ('sling', 'roster', 'https://api.getsling.com', '/v1/reports/roster', 30, true),
  ('sling', 'timesheets', 'https://api.getsling.com', '/v1/reports/timesheets', 30, true),
  ('sling', 'calendar', 'https://api.getsling.com', '/v1/calendar/working', 60, true)
ON CONFLICT DO NOTHING;

-- Update sling roster/timesheets with max_date_range
UPDATE public.api_endpoints 
SET max_date_range_days = 31 
WHERE api_name = 'sling' AND endpoint_type IN ('roster', 'timesheets');