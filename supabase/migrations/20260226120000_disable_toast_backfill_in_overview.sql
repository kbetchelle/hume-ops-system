-- Remove Toast Backfill (through 08/01/24) from API Sync Overview and SyncStatusIndicator.
-- Backfill through 08/01/24 is complete; row remains in sync_schedule but is disabled.
--
-- If `supabase db push` fails because earlier migrations already exist on remote, run this
-- in Supabase Dashboard → SQL Editor, then: supabase migration repair 20260226120000 --status applied
UPDATE public.sync_schedule
SET is_enabled = false,
    updated_at = now()
WHERE sync_type = 'toast_backfill';
