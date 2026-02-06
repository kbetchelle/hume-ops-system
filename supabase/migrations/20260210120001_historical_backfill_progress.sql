-- Create historical_backfill_progress table for date-based backfill orchestration (arketa-gym-flow style).
-- Used by historical-backfill-cron to track progress per API.

CREATE TABLE IF NOT EXISTS public.historical_backfill_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_name TEXT NOT NULL,
  current_date_cursor DATE NOT NULL DEFAULT CURRENT_DATE,
  target_end_date DATE NOT NULL DEFAULT '2024-05-01',
  chunk_days INTEGER NOT NULL DEFAULT 2,
  total_records_synced BIGINT NOT NULL DEFAULT 0,
  last_chunk_records INTEGER NOT NULL DEFAULT 0,
  last_chunk_started_at TIMESTAMPTZ,
  last_chunk_completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  backfill_phase TEXT DEFAULT 'initial',
  priority INTEGER DEFAULT 2,
  empty_dates_cursor TEXT,
  reverify_cursor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT historical_backfill_progress_api_name_key UNIQUE (api_name)
);

CREATE INDEX IF NOT EXISTS idx_historical_backfill_progress_status ON public.historical_backfill_progress(status);

ALTER TABLE public.historical_backfill_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to historical_backfill_progress"
  ON public.historical_backfill_progress FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public read access to historical_backfill_progress"
  ON public.historical_backfill_progress FOR SELECT TO public USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.historical_backfill_progress;

-- Seed: reservations and payments (plan matches arketa-gym-flow - reservations first, then payments)
INSERT INTO public.historical_backfill_progress (api_name, current_date_cursor, target_end_date, chunk_days, status, backfill_phase, priority)
VALUES
  ('arketa_reservations', CURRENT_DATE, '2024-05-01', 2, 'pending', 'initial', 2),
  ('arketa_payments', CURRENT_DATE, '2024-05-01', 2, 'pending', 'initial', 2)
ON CONFLICT (api_name) DO NOTHING;

CREATE TRIGGER update_historical_backfill_progress_updated_at
  BEFORE UPDATE ON public.historical_backfill_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
