-- Table for logging records skipped or anomalous per API sync (e.g. reservations without matching class_id).
-- Dev Tools page shows one tab per api_name with tables that update when backfill/cron/manual sync runs.

CREATE TABLE IF NOT EXISTS public.api_sync_skipped_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name text NOT NULL,
  record_id text NOT NULL,
  secondary_id text,
  reason text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_sync_skipped_records_api_name ON public.api_sync_skipped_records(api_name);
CREATE INDEX IF NOT EXISTS idx_api_sync_skipped_records_created_at ON public.api_sync_skipped_records(created_at DESC);

ALTER TABLE public.api_sync_skipped_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view api_sync_skipped_records"
  ON public.api_sync_skipped_records FOR SELECT
  USING (public.is_manager_or_admin(auth.uid()));

-- Inserts are done by edge functions using service role (bypasses RLS).

COMMENT ON TABLE public.api_sync_skipped_records IS 'Per-record log of skipped or anomalous records from API syncs; used by Dev Tools Sync Skipped Records page.';
