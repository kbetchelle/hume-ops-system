-- Add sync_schedule entries for new API sync functions
-- These enable scheduled syncing for arketa_subscriptions and toast_sales

-- Add arketa_subscriptions to sync_schedule
INSERT INTO public.sync_schedule (
  sync_type,
  display_name,
  function_name,
  interval_minutes,
  is_enabled,
  next_run_at,
  last_status
) VALUES (
  'arketa_subscriptions',
  'Arketa Subscriptions',
  'sync-arketa-subscriptions',
  60,
  true,
  now(),
  'pending'
) ON CONFLICT (sync_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  function_name = EXCLUDED.function_name,
  is_enabled = EXCLUDED.is_enabled;

-- Add toast_sales to sync_schedule
INSERT INTO public.sync_schedule (
  sync_type,
  display_name,
  function_name,
  interval_minutes,
  is_enabled,
  next_run_at,
  last_status
) VALUES (
  'toast_sales',
  'Toast Sales',
  'sync-toast-orders',
  30,
  true,
  now(),
  'pending'
) ON CONFLICT (sync_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  function_name = EXCLUDED.function_name,
  is_enabled = EXCLUDED.is_enabled;

-- Add api_sync_status entries for tracking
INSERT INTO public.api_sync_status (api_name, last_sync_success)
VALUES 
  ('arketa_subscriptions', true),
  ('toast_sales', true)
ON CONFLICT (api_name) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.toast_sales IS 'Daily sales data synced from Toast POS API - synced every 30 minutes';
