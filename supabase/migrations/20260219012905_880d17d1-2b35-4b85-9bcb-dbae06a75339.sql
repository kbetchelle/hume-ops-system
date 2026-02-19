
CREATE TABLE public.api_sync_skipped_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  secondary_id TEXT,
  reason TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_sync_skipped_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read skipped records"
  ON public.api_sync_skipped_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert skipped records"
  ON public.api_sync_skipped_records
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX idx_skipped_records_api_name ON public.api_sync_skipped_records (api_name);
CREATE INDEX idx_skipped_records_created_at ON public.api_sync_skipped_records (created_at DESC);
