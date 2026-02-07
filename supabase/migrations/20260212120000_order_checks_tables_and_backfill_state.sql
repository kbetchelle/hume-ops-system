-- Toast order checks: target table, staging table, and backfill state for per-check sync from Toast ordersBulk.

-- 1.1 Target table order_checks (one row per Toast Check)
CREATE TABLE IF NOT EXISTS public.order_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_guid TEXT NOT NULL UNIQUE,
  order_guid TEXT NOT NULL,
  business_date DATE NOT NULL,
  amount NUMERIC(10,2),
  tax_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  payment_status TEXT,
  paid_date TIMESTAMPTZ,
  closed_date TIMESTAMPTZ,
  voided BOOLEAN DEFAULT false,
  void_date TIMESTAMPTZ,
  raw_data JSONB,
  sync_batch_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_checks_check_guid ON public.order_checks(check_guid);
CREATE INDEX IF NOT EXISTS idx_order_checks_business_date ON public.order_checks(business_date);
CREATE INDEX IF NOT EXISTS idx_order_checks_order_guid ON public.order_checks(order_guid);
CREATE INDEX IF NOT EXISTS idx_order_checks_sync_batch ON public.order_checks(sync_batch_id);

ALTER TABLE public.order_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view order_checks" ON public.order_checks;
CREATE POLICY "Authenticated users can view order_checks"
  ON public.order_checks
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can manage order_checks" ON public.order_checks;
CREATE POLICY "Service role can manage order_checks"
  ON public.order_checks
  FOR ALL
  TO service_role
  USING (true);

GRANT SELECT ON public.order_checks TO authenticated;
GRANT ALL ON public.order_checks TO service_role;

COMMENT ON TABLE public.order_checks IS 'Per-check data synced from Toast POS ordersBulk API';

-- 1.2 Staging table order_checks_staging
CREATE TABLE IF NOT EXISTS public.order_checks_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_guid TEXT NOT NULL,
  order_guid TEXT NOT NULL,
  business_date DATE NOT NULL,
  amount NUMERIC(10,2),
  tax_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  payment_status TEXT,
  paid_date TIMESTAMPTZ,
  closed_date TIMESTAMPTZ,
  voided BOOLEAN DEFAULT false,
  void_date TIMESTAMPTZ,
  raw_data JSONB,
  sync_batch_id UUID NOT NULL,
  staged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(check_guid, sync_batch_id)
);

CREATE INDEX IF NOT EXISTS idx_order_checks_staging_batch ON public.order_checks_staging(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_order_checks_staging_business_date ON public.order_checks_staging(business_date);

ALTER TABLE public.order_checks_staging ENABLE ROW LEVEL SECURITY;

-- Staging: managers can manage (same pattern as toast_staging); service_role for edge functions
DROP POLICY IF EXISTS "Managers can manage order_checks_staging" ON public.order_checks_staging;
CREATE POLICY "Managers can manage order_checks_staging"
  ON public.order_checks_staging
  FOR ALL
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Service role can manage order_checks_staging" ON public.order_checks_staging;
CREATE POLICY "Service role can manage order_checks_staging"
  ON public.order_checks_staging
  FOR ALL
  TO service_role
  USING (true);

GRANT ALL ON public.order_checks_staging TO service_role;

COMMENT ON TABLE public.order_checks_staging IS 'Staging for Toast order checks before transfer to order_checks';

-- 1.3 Backfill state table order_checks_backfill_state
CREATE TABLE IF NOT EXISTS public.order_checks_backfill_state (
  id TEXT PRIMARY KEY DEFAULT 'order_checks_backfill',
  cursor_date DATE NOT NULL DEFAULT '2024-08-01',
  cursor_page INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'paused')),
  last_error TEXT,
  last_synced_at TIMESTAMPTZ,
  total_checks_synced INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.order_checks_backfill_state ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.order_checks_backfill_state IS 'Resumable Toast order checks backfill: cursor_date + cursor_page.';

INSERT INTO public.order_checks_backfill_state (id, cursor_date, cursor_page, status)
VALUES ('order_checks_backfill', '2024-08-01', 1, 'running')
ON CONFLICT (id) DO NOTHING;

-- 1.4 Sync schedule for order_checks_backfill
INSERT INTO public.sync_schedule (
  sync_type,
  display_name,
  function_name,
  interval_minutes,
  is_enabled,
  next_run_at,
  last_status
) VALUES (
  'order_checks_backfill',
  'Toast Order Checks Backfill',
  'toast-order-checks-backfill',
  3,
  true,
  now(),
  'pending'
) ON CONFLICT (sync_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  function_name = EXCLUDED.function_name,
  interval_minutes = EXCLUDED.interval_minutes,
  is_enabled = EXCLUDED.is_enabled;
