-- Toast API sync: align staging table with CSV format and set daily 1am schedule
-- CSV columns: id;business_date;net_sales;gross_sales;cafe_sales;raw_data;sync_batch_id;created_at
--
-- To run Toast (and other due syncs) daily at 1am: ensure scheduled-sync-runner
-- is invoked at 01:00 UTC (e.g. Supabase Dashboard → Integrations → Cron, or
-- external scheduler POST to /functions/v1/scheduled-sync-runner).

-- Add cafe_sales to toast_staging (match CSV and target toast_sales)
ALTER TABLE public.toast_staging
  ADD COLUMN IF NOT EXISTS cafe_sales numeric(10,2) DEFAULT 0;

-- Ensure toast_sales sync runs daily at 1am (UTC)
-- interval_minutes = 1440 (24h); next_run_at set to next 01:00 UTC so first run is at 1am
UPDATE public.sync_schedule
SET
  interval_minutes = 1440,
  next_run_at = (
    (date_trunc('day', (now() AT TIME ZONE 'UTC')) + interval '1 day' + interval '1 hour')
    AT TIME ZONE 'UTC'
  ),
  is_enabled = true,
  display_name = 'Toast Sales',
  function_name = 'sync-toast-orders'
WHERE sync_type = 'toast_sales';

COMMENT ON COLUMN public.toast_staging.cafe_sales IS 'Cafe sales amount for the business date (from Toast API / CSV)';
