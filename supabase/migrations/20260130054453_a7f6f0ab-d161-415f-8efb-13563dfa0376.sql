-- Add columns to track new vs updated records per batch
ALTER TABLE public.backfill_jobs 
ADD COLUMN IF NOT EXISTS records_inserted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS records_updated INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cumulative_inserted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cumulative_updated INTEGER DEFAULT 0;