-- Ensure Arketa sync order and single scheduled job for classes+reservations.
-- Only the combined wrapper (sync-arketa-classes-and-reservations) should run on schedule;
-- standalone arketa_reservations is disabled so classes always sync before reservations.
-- Idempotent: safe to re-run.

-- 1) arketa_classes: use combined wrapper and ensure enabled
UPDATE public.sync_schedule
SET function_name = 'sync-arketa-classes-and-reservations',
    display_name = 'Arketa Classes + Reservations',
    is_enabled = true,
    updated_at = now()
WHERE sync_type = 'arketa_classes';

-- 2) arketa_reservations: disable (handled inside wrapper); keep function_name for clarity if re-enabled
UPDATE public.sync_schedule
SET is_enabled = false,
    function_name = 'sync-arketa-reservations',
    updated_at = now()
WHERE sync_type = 'arketa_reservations';

-- Post-deploy verification: run in Supabase SQL editor to confirm state:
--   SELECT sync_type, is_enabled, function_name FROM sync_schedule WHERE sync_type IN ('arketa_classes','arketa_reservations');
-- Expected: arketa_classes is_enabled=true, function_name='sync-arketa-classes-and-reservations';
--           arketa_reservations is_enabled=false. Check api_logs.error_message and Edge logs for any failures.
