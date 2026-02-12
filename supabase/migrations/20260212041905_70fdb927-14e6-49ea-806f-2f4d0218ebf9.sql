
-- ============================================================
-- Arketa Payments Migration: Switch from /purchases to /payments
-- ============================================================

-- 1. Drop old tables (CASCADE safe - no FK references)
DROP TABLE IF EXISTS public.arketa_payments_staging CASCADE;
DROP TABLE IF EXISTS public.arketa_payments_history CASCADE;
DROP TABLE IF EXISTS public.arketa_payments CASCADE;

-- 2. Create arketa_payments (main table)
CREATE TABLE public.arketa_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id text NOT NULL UNIQUE,
  amount numeric,
  status text,
  created_at_api timestamptz,
  currency text,
  amount_refunded numeric,
  description text,
  invoice_id text,
  normalized_category text[],
  net_sales numeric,
  transaction_fees numeric,
  tax numeric,
  location_name text,
  source text,
  payment_type text,
  promo_code text,
  offering_name text[],
  seller_name text,
  client_id text,
  client_first_name text,
  client_last_name text,
  client_email text,
  client_phone text,
  raw_data jsonb,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_arketa_payments_payment_id ON public.arketa_payments(payment_id);
CREATE INDEX idx_arketa_payments_client_id ON public.arketa_payments(client_id);
CREATE INDEX idx_arketa_payments_status ON public.arketa_payments(status);
CREATE INDEX idx_arketa_payments_location ON public.arketa_payments(location_name);
CREATE INDEX idx_arketa_payments_created_api ON public.arketa_payments(created_at_api);

ALTER TABLE public.arketa_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read" ON public.arketa_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service role all" ON public.arketa_payments FOR ALL USING (true) WITH CHECK (true);

-- 3. Create arketa_payments_history
CREATE TABLE public.arketa_payments_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id text NOT NULL UNIQUE,
  amount numeric,
  status text,
  created_at_api timestamptz,
  currency text,
  amount_refunded numeric,
  description text,
  invoice_id text,
  normalized_category text[],
  net_sales numeric,
  transaction_fees numeric,
  tax numeric,
  location_name text,
  source text,
  payment_type text,
  promo_code text,
  offering_name text[],
  seller_name text,
  client_id text,
  client_first_name text,
  client_last_name text,
  client_email text,
  client_phone text,
  raw_data jsonb,
  synced_at timestamptz DEFAULT now(),
  sync_batch_id text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.arketa_payments_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read" ON public.arketa_payments_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service role all" ON public.arketa_payments_history FOR ALL USING (true) WITH CHECK (true);

-- 4. Create arketa_payments_staging
CREATE TABLE public.arketa_payments_staging (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_batch_id text NOT NULL,
  cursor_position text,
  payment_id text NOT NULL,
  amount numeric,
  status text,
  created_at_api timestamptz,
  currency text,
  amount_refunded numeric,
  description text,
  invoice_id text,
  normalized_category text[],
  net_sales numeric,
  transaction_fees numeric,
  tax numeric,
  location_name text,
  source text,
  payment_type text,
  promo_code text,
  offering_name text[],
  seller_name text,
  client_id text,
  client_first_name text,
  client_last_name text,
  client_email text,
  client_phone text,
  raw_data jsonb,
  staged_at timestamptz DEFAULT now()
);

ALTER TABLE public.arketa_payments_staging ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role all" ON public.arketa_payments_staging FOR ALL USING (true) WITH CHECK (true);

-- 5. Create sync state table for resumable cursor
CREATE TABLE IF NOT EXISTS public.arketa_payments_sync_state (
  id text NOT NULL DEFAULT 'payments' PRIMARY KEY,
  cursor text,
  status text DEFAULT 'idle',
  records_synced integer DEFAULT 0,
  estimated_total integer,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.arketa_payments_sync_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role all" ON public.arketa_payments_sync_state FOR ALL USING (true) WITH CHECK (true);

-- 6. Update calendar function for payments
CREATE OR REPLACE FUNCTION public.get_backfill_payments_calendar()
 RETURNS TABLE(d date, record_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    (created_at_api AT TIME ZONE 'UTC')::date AS d,
    COUNT(*)::bigint AS record_count
  FROM arketa_payments
  WHERE created_at_api >= '2024-08-01' AND created_at_api IS NOT NULL
  GROUP BY (created_at_api AT TIME ZONE 'UTC')::date
  ORDER BY d;
$function$;

-- 7. Trigger for updated_at
CREATE TRIGGER update_arketa_payments_updated_at
  BEFORE UPDATE ON public.arketa_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
