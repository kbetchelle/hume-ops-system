-- Add column for duplicate batch detection
ALTER TABLE public.backfill_jobs 
ADD COLUMN IF NOT EXISTS last_batch_first_id text;

-- Add comment explaining purpose
COMMENT ON COLUMN public.backfill_jobs.last_batch_first_id IS 
  'Stores the first record ID from the previous batch to detect if API is returning duplicate data';
