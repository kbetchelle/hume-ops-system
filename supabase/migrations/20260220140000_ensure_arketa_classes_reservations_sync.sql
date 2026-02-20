-- Ensure Arketa Classes + Reservations sync appears on API Syncing page.
-- Uses combined function sync-arketa-classes-and-reservations (classes first, then reservations, then sync-from-staging).
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
  'arketa_classes',
  'Arketa Classes + Reservations',
  'sync-arketa-classes-and-reservations',
  20,
  now(),
  true,
  'pending'
)
ON CONFLICT (sync_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  function_name = EXCLUDED.function_name,
  interval_minutes = EXCLUDED.interval_minutes,
  is_enabled = true,
  next_run_at = EXCLUDED.next_run_at,
  updated_at = now();
