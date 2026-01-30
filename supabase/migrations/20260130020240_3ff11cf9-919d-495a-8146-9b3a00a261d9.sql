-- Add missing columns for resumable backfill with cursor-based pagination
ALTER TABLE public.backfill_jobs 
ADD COLUMN IF NOT EXISTS last_cursor text,
ADD COLUMN IF NOT EXISTS total_records_expected integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS retry_scheduled_at timestamptz,
ADD COLUMN IF NOT EXISTS staging_synced boolean DEFAULT false;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';