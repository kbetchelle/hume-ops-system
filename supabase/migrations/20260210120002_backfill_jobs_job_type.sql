-- Add job_type to backfill_jobs for run-backfill-job compatibility (arketa-gym-flow style).
-- job_type = arketa_reservations | arketa_payments | arketa_classes
ALTER TABLE public.backfill_jobs
  ADD COLUMN IF NOT EXISTS job_type text;

-- Backfill job_type from api_source + data_type
UPDATE public.backfill_jobs
  SET job_type = api_source || '_' || data_type
  WHERE job_type IS NULL AND api_source IS NOT NULL AND data_type IS NOT NULL;

-- Add results column for run-backfill-job (array of SyncResult per date)
ALTER TABLE public.backfill_jobs
  ADD COLUMN IF NOT EXISTS results jsonb DEFAULT '[]'::jsonb;

-- Add total_records, total_new_records, total_dates, completed_dates for run-backfill-job
ALTER TABLE public.backfill_jobs
  ADD COLUMN IF NOT EXISTS total_records integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_new_records integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_dates integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_dates integer DEFAULT 0;

-- Backfill total_dates/completed_dates from total_days/days_processed
UPDATE public.backfill_jobs SET total_dates = total_days WHERE total_dates = 0 AND total_days > 0;
UPDATE public.backfill_jobs SET completed_dates = days_processed WHERE completed_dates = 0 AND days_processed > 0;
