-- Table may already exist from 20260216120000_api_sync_skipped_records.sql; make idempotent for shadow DB / db pull.
CREATE TABLE IF NOT EXISTS public.api_sync_skipped_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  secondary_id TEXT,
  reason TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_sync_skipped_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read skipped records" ON public.api_sync_skipped_records;
CREATE POLICY "Authenticated users can read skipped records"
  ON public.api_sync_skipped_records
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can insert skipped records" ON public.api_sync_skipped_records;
CREATE POLICY "Service role can insert skipped records"
  ON public.api_sync_skipped_records
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_skipped_records_api_name ON public.api_sync_skipped_records (api_name);
CREATE INDEX IF NOT EXISTS idx_skipped_records_created_at ON public.api_sync_skipped_records (created_at DESC);
