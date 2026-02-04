-- Staging table for Calendly events
CREATE TABLE IF NOT EXISTS scheduled_tours_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendly_event_id text NOT NULL,
  event_uri text,
  event_type text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  status text,
  invitee_name text,
  invitee_email text,
  invitee_phone text,
  invitee_questions_answers jsonb,
  raw_event_data jsonb,
  raw_invitee_data jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(calendly_event_id)
);

-- Add indexes for staging table
CREATE INDEX IF NOT EXISTS idx_staging_tours_event_id ON scheduled_tours_staging(calendly_event_id);
CREATE INDEX IF NOT EXISTS idx_staging_tours_start_time ON scheduled_tours_staging(start_time);

-- Add Calendly sync to sync_schedule
INSERT INTO public.sync_schedule (
  sync_type,
  display_name,
  function_name,
  interval_minutes,
  is_enabled,
  next_run_at,
  last_status
) VALUES (
  'calendly_events',
  'Calendly Events',
  'sync-calendly-events',
  30,
  true,
  now(),
  'pending'
) ON CONFLICT (sync_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  function_name = EXCLUDED.function_name,
  is_enabled = EXCLUDED.is_enabled;

-- Add to api_sync_status
INSERT INTO public.api_sync_status (api_name, last_sync_success)
VALUES ('calendly_events', true)
ON CONFLICT (api_name) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON scheduled_tours_staging TO authenticated;
ALTER TABLE scheduled_tours_staging ENABLE ROW LEVEL SECURITY;

-- RLS policies for staging table
CREATE POLICY "Managers can manage staging tours"
  ON scheduled_tours_staging FOR ALL
  USING (is_manager_or_admin(auth.uid()));

-- Add comment
COMMENT ON TABLE scheduled_tours_staging IS 'Staging table for Calendly events - synced every 30 minutes';
