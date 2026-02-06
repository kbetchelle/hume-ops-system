-- Align Arketa staging/history tables and api_sync_status/api_logs with reference schema.
-- Target: arketa_reservations_history (staging cols + synced_at, unique reservation_id+class_id),
--         arketa_payments_staging (full reference columns), arketa_payments_history,
--         api_sync_status (last_processed_date, last_sync_status), api_logs (records_updated).

-- 1) arketa_reservations_staging: add missing columns to match reference
ALTER TABLE public.arketa_reservations_staging
  ADD COLUMN IF NOT EXISTS purchase_id text,
  ADD COLUMN IF NOT EXISTS reservation_type text,
  ADD COLUMN IF NOT EXISTS class_id text,
  ADD COLUMN IF NOT EXISTS class_name text,
  ADD COLUMN IF NOT EXISTS class_date date,
  ADD COLUMN IF NOT EXISTS checked_in boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS experience_type text,
  ADD COLUMN IF NOT EXISTS late_cancel boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS gross_amount_paid numeric,
  ADD COLUMN IF NOT EXISTS net_amount_paid numeric;

-- Backfill class_id from arketa_class_id where class_id is null
UPDATE public.arketa_reservations_staging SET class_id = arketa_class_id WHERE class_id IS NULL AND arketa_class_id IS NOT NULL;

-- 2) arketa_reservations_history (target): same columns as staging + synced_at, unique (reservation_id, class_id)
CREATE TABLE IF NOT EXISTS public.arketa_reservations_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id text NOT NULL,
  client_id text,
  purchase_id text,
  reservation_type text,
  class_id text NOT NULL,
  class_name text,
  class_date date,
  status text,
  checked_in boolean DEFAULT false,
  checked_in_at timestamptz,
  experience_type text,
  late_cancel boolean DEFAULT false,
  gross_amount_paid numeric,
  net_amount_paid numeric,
  raw_data jsonb,
  sync_batch_id uuid,
  synced_at timestamptz DEFAULT now(),
  UNIQUE(reservation_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_arketa_reservations_history_class_date ON public.arketa_reservations_history(class_date);
CREATE INDEX IF NOT EXISTS idx_arketa_reservations_history_reservation_class ON public.arketa_reservations_history(reservation_id, class_id);
ALTER TABLE public.arketa_reservations_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can manage arketa_reservations_history"
  ON public.arketa_reservations_history FOR ALL USING (is_manager_or_admin(auth.uid()));

-- 3) arketa_payments_staging: add reference columns (keep existing id/sync_batch_id; add record_id as alias or new)
ALTER TABLE public.arketa_payments_staging
  ADD COLUMN IF NOT EXISTS record_id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS source_endpoint text,
  ADD COLUMN IF NOT EXISTS payment_id text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS offering_id text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS remaining_uses integer,
  ADD COLUMN IF NOT EXISTS total_refunded numeric,
  ADD COLUMN IF NOT EXISTS net_sales numeric,
  ADD COLUMN IF NOT EXISTS transaction_fees numeric,
  ADD COLUMN IF NOT EXISTS stripe_fees numeric,
  ADD COLUMN IF NOT EXISTS tax numeric,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS synced_at timestamptz DEFAULT now();

-- Backfill payment_id/source_endpoint from existing arketa_payment_id where missing
UPDATE public.arketa_payments_staging SET payment_id = arketa_payment_id WHERE payment_id IS NULL AND arketa_payment_id IS NOT NULL;
UPDATE public.arketa_payments_staging SET source_endpoint = 'purchases' WHERE source_endpoint IS NULL;

-- 4) arketa_payments_history (target): same columns as staging, unique (payment_id, source_endpoint)
CREATE TABLE IF NOT EXISTS public.arketa_payments_history (
  record_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_endpoint text NOT NULL,
  payment_id text NOT NULL,
  client_id text,
  amount numeric,
  status text,
  description text,
  payment_type text,
  category text,
  offering_id text,
  start_date date,
  end_date date,
  remaining_uses integer,
  currency text,
  total_refunded numeric,
  net_sales numeric,
  transaction_fees numeric,
  stripe_fees numeric,
  tax numeric,
  updated_at timestamptz,
  synced_at timestamptz DEFAULT now(),
  sync_batch_id uuid,
  UNIQUE(payment_id, source_endpoint)
);

CREATE INDEX IF NOT EXISTS idx_arketa_payments_history_payment_source ON public.arketa_payments_history(payment_id, source_endpoint);
ALTER TABLE public.arketa_payments_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can manage arketa_payments_history"
  ON public.arketa_payments_history FOR ALL USING (is_manager_or_admin(auth.uid()));

-- 5) api_sync_status: add last_processed_date, last_sync_status (is_enabled already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'api_sync_status' AND column_name = 'last_processed_date') THEN
    ALTER TABLE public.api_sync_status ADD COLUMN last_processed_date text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'api_sync_status' AND column_name = 'last_sync_status') THEN
    ALTER TABLE public.api_sync_status ADD COLUMN last_sync_status text;
  END IF;
END $$;

-- 6) api_logs: add records_updated if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'api_logs' AND column_name = 'records_updated') THEN
    ALTER TABLE public.api_logs ADD COLUMN records_updated int DEFAULT 0;
  END IF;
END $$;

COMMENT ON TABLE public.arketa_reservations_history IS 'Target for reservations backfill; staging -> history via sync-from-staging. Unique (reservation_id, class_id).';
COMMENT ON TABLE public.arketa_payments_history IS 'Target for payments backfill; staging -> history via sync-from-staging. Unique (payment_id, source_endpoint).';
