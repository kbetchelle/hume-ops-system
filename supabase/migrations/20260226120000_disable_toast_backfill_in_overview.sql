-- Remove Toast Backfill (through 08/01/24) from API Sync Overview and SyncStatusIndicator.
-- Backfill through 08/01/24 is complete; row remains in sync_schedule but is disabled.
UPDATE public.sync_schedule
SET is_enabled = false,
    updated_at = now()
WHERE sync_type = 'toast_backfill';
