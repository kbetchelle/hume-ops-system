-- SQL Queries to Create Arketa Subscriptions Tables
-- Run these in Supabase SQL Editor if migration hasn't been applied

-- ============================================
-- 1. CREATE STAGING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.arketa_subscriptions_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_batch_id TEXT NOT NULL,
  arketa_subscription_id TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  staged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staging table index
CREATE INDEX IF NOT EXISTS idx_arketa_subscriptions_staging_batch 
ON public.arketa_subscriptions_staging(sync_batch_id);

-- Staging table RLS
ALTER TABLE public.arketa_subscriptions_staging ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage subscriptions staging" 
ON public.arketa_subscriptions_staging;

CREATE POLICY "Service role can manage subscriptions staging"
  ON public.arketa_subscriptions_staging
  FOR ALL
  TO service_role
  USING (true);

GRANT ALL ON public.arketa_subscriptions_staging TO service_role;

-- ============================================
-- 2. CREATE TARGET TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.arketa_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL, -- Arketa subscription_id
  client_id TEXT,
  client_email TEXT,
  type TEXT,
  offering_id TEXT,
  status TEXT,
  name TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  remaining_uses INTEGER,
  price NUMERIC,
  api_updated_at TIMESTAMPTZ,
  cancellation_date TIMESTAMPTZ,
  pause_start_date TIMESTAMPTZ,
  cancel_at_date TIMESTAMPTZ,
  pause_end_date TIMESTAMPTZ,
  next_renewal_date TIMESTAMPTZ,
  has_payment_method BOOLEAN,
  substatus TEXT,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Target table indexes
CREATE INDEX IF NOT EXISTS idx_arketa_subscriptions_client_id 
ON public.arketa_subscriptions(client_id);

CREATE INDEX IF NOT EXISTS idx_arketa_subscriptions_client_email 
ON public.arketa_subscriptions(client_email);

CREATE INDEX IF NOT EXISTS idx_arketa_subscriptions_status 
ON public.arketa_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_arketa_subscriptions_offering_id 
ON public.arketa_subscriptions(offering_id);

CREATE INDEX IF NOT EXISTS idx_arketa_subscriptions_synced_at 
ON public.arketa_subscriptions(synced_at);

-- Target table RLS
ALTER TABLE public.arketa_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view subscriptions" 
ON public.arketa_subscriptions;

CREATE POLICY "Authenticated users can view subscriptions"
  ON public.arketa_subscriptions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can manage subscriptions" 
ON public.arketa_subscriptions;

CREATE POLICY "Service role can manage subscriptions"
  ON public.arketa_subscriptions
  FOR ALL
  TO service_role
  USING (true);

-- Grants
GRANT SELECT ON public.arketa_subscriptions TO authenticated;
GRANT ALL ON public.arketa_subscriptions TO service_role;

-- ============================================
-- 3. CREATE UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_arketa_subscriptions_updated_at 
ON public.arketa_subscriptions;

CREATE TRIGGER update_arketa_subscriptions_updated_at
    BEFORE UPDATE ON public.arketa_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. VERIFY TABLES CREATED
-- ============================================
-- Run these to verify:
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('arketa_subscriptions', 'arketa_subscriptions_staging')
ORDER BY table_name;

-- Check unique constraint on external_id
SELECT 
  constraint_name, 
  constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'arketa_subscriptions' 
  AND constraint_type IN ('UNIQUE', 'PRIMARY KEY');
