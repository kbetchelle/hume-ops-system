-- Add daily report aggregation to sync_schedule for hourly auto-runs
INSERT INTO public.sync_schedule (
  sync_type,
  display_name,
  function_name,
  interval_minutes,
  next_run_at,
  is_enabled,
  last_status
)
VALUES (
  'daily_report_aggregation',
  'Daily Report Aggregation',
  'auto-aggregate-daily-report',
  60,
  now(),
  true,
  'pending'
)
ON CONFLICT (sync_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  function_name = EXCLUDED.function_name,
  interval_minutes = EXCLUDED.interval_minutes,
  is_enabled = EXCLUDED.is_enabled;
