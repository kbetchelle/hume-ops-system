-- Enable the combined classes+reservations sync on a 20-minute interval,
-- and disable the standalone reservations sync (now handled by the combined function).

UPDATE public.sync_schedule
SET function_name = 'sync-arketa-classes-and-reservations',
    interval_minutes = 20,
    is_enabled = true,
    display_name = 'Arketa Classes + Reservations',
    next_run_at = now(),
    updated_at = now()
WHERE sync_type = 'arketa_classes';

UPDATE public.sync_schedule
SET is_enabled = false,
    updated_at = now()
WHERE sync_type = 'arketa_reservations';
