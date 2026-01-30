-- Add new columns for enhanced cursor-based sync
ALTER TABLE backfill_jobs ADD COLUMN IF NOT EXISTS batch_cursor text;
ALTER TABLE backfill_jobs ADD COLUMN IF NOT EXISTS current_batch_count integer DEFAULT 0;
ALTER TABLE backfill_jobs ADD COLUMN IF NOT EXISTS sync_phase text DEFAULT 'idle';
ALTER TABLE backfill_jobs ADD COLUMN IF NOT EXISTS last_batch_synced_at timestamptz;
ALTER TABLE backfill_jobs ADD COLUMN IF NOT EXISTS total_batches_completed integer DEFAULT 0;
ALTER TABLE backfill_jobs ADD COLUMN IF NOT EXISTS records_in_current_batch integer DEFAULT 0;
ALTER TABLE backfill_jobs ADD COLUMN IF NOT EXISTS no_more_records boolean DEFAULT false;

-- Add comment explaining sync_phase values
COMMENT ON COLUMN backfill_jobs.sync_phase IS 'Current phase: idle | fetching_api | staging | transforming | upserting | clearing_staging | complete';

-- Add comment explaining batch_cursor
COMMENT ON COLUMN backfill_jobs.batch_cursor IS 'API cursor for resuming fetch from last position. Format varies by API.';

-- Create index for active job queries
CREATE INDEX IF NOT EXISTS idx_backfill_jobs_active ON backfill_jobs(status) WHERE status IN ('pending', 'running', 'paused');