-- Toast backfill: state table for resume-on-error and cron schedule (every 3 min until through 08/01/24)

-- State table: one row for toast backfill; cursor = (cursor_date, cursor_page) to resume where we left off
CREATE TABLE IF NOT EXISTS public.toast_backfill_state (
  id text PRIMARY KEY DEFAULT 'toast_backfill',
  cursor_date date NOT NULL DEFAULT '2024-08-01',
  cursor_page int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'paused')),
  last_error text,
  last_synced_at timestamptz,
  total_days_synced int DEFAULT 0,
  total_records_synced int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: only service_role (edge function) can read/write
ALTER TABLE public.toast_backfill_state ENABLE ROW LEVEL SECURITY;

-- No policies = anon/authenticated cannot access; service_role bypasses RLS
COMMENT ON TABLE public.toast_backfill_state IS 'Resumable Toast API backfill: cursor_date + cursor_page. Backfill runs through 2024-08-01.';

-- Seed initial state (start from 2024-08-01)
INSERT INTO public.toast_backfill_state (id, cursor_date, cursor_page, status)
VALUES ('toast_backfill', '2024-08-01', 1, 'running')
ON CONFLICT (id) DO NOTHING;

-- Add toast_backfill to sync_schedule: runs every 3 minutes
INSERT INTO public.sync_schedule (
  sync_type,
  display_name,
  function_name,
  interval_minutes,
  is_enabled,
  next_run_at,
  last_status
) VALUES (
  'toast_backfill',
  'Toast Backfill (through 08/01/24)',
  'toast-backfill-sync',
  3,
  true,
  now(),
  'pending'
) ON CONFLICT (sync_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  function_name = EXCLUDED.function_name,
  interval_minutes = EXCLUDED.interval_minutes,
  is_enabled = EXCLUDED.is_enabled;

COMMENT ON TABLE public.toast_backfill_state IS 'Toast API backfill state. Cron runs every 3 min; resumes from cursor_date/cursor_page on error.';
