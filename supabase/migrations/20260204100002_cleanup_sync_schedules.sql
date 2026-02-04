-- Cleanup sync schedules - remove derived tables and fix configurations
-- arketa_classes and arketa_instructors are derived from other API data
-- and should not have direct API syncs

-- Disable arketa_classes sync (it's a derived table)
-- Note: last_status must be one of: 'pending', 'running', 'success', 'failed', 'timeout'
UPDATE public.sync_schedule 
SET is_enabled = false
WHERE sync_type = 'arketa_classes';

-- Disable arketa_instructors sync (it's a derived table)
UPDATE public.sync_schedule 
SET is_enabled = false
WHERE sync_type = 'arketa_instructors';

-- Update display names for clarity
UPDATE public.sync_schedule 
SET display_name = CASE sync_type
    WHEN 'arketa_clients' THEN 'Arketa Clients'
    WHEN 'arketa_reservations' THEN 'Arketa Reservations'
    WHEN 'arketa_payments' THEN 'Arketa Payments'
    WHEN 'arketa_subscriptions' THEN 'Arketa Subscriptions'
    WHEN 'sling_users' THEN 'Sling Users'
    WHEN 'sling_shifts' THEN 'Sling Shifts'
    WHEN 'toast_sales' THEN 'Toast Sales'
    ELSE display_name
  END
WHERE sync_type IN (
  'arketa_clients', 'arketa_reservations', 'arketa_payments', 
  'arketa_subscriptions', 'sling_users', 'sling_shifts', 'toast_sales'
);

-- Ensure function_name is set correctly for all active syncs
UPDATE public.sync_schedule 
SET function_name = CASE sync_type
    WHEN 'arketa_clients' THEN 'sync-arketa-clients'
    WHEN 'arketa_reservations' THEN 'sync-arketa-reservations'
    WHEN 'arketa_payments' THEN 'sync-arketa-payments'
    WHEN 'arketa_subscriptions' THEN 'sync-arketa-subscriptions'
    WHEN 'sling_users' THEN 'sling-api'
    WHEN 'sling_shifts' THEN 'sling-api'
    WHEN 'toast_sales' THEN 'sync-toast-orders'
    ELSE function_name
  END
WHERE sync_type IN (
  'arketa_clients', 'arketa_reservations', 'arketa_payments', 
  'arketa_subscriptions', 'sling_users', 'sling_shifts', 'toast_sales'
);

-- Add comment
COMMENT ON TABLE public.sync_schedule IS 'API sync schedules - arketa_classes and arketa_instructors are disabled as they are derived tables';
