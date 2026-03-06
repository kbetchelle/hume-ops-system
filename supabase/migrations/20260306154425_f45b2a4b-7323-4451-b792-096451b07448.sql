
-- Add parent_log_id, records_skipped, skip_reasons to api_logs
ALTER TABLE public.api_logs
  ADD COLUMN IF NOT EXISTS parent_log_id uuid REFERENCES public.api_logs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS records_skipped integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS skip_reasons jsonb;

-- Index for grouping queries
CREATE INDEX IF NOT EXISTS idx_api_logs_parent_log_id ON public.api_logs(parent_log_id);
