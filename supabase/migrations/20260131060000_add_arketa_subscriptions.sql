-- Create arketa_subscriptions table
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

-- Create staging table
CREATE TABLE IF NOT EXISTS public.arketa_subscriptions_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_batch_id TEXT NOT NULL,
  arketa_subscription_id TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  staged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_arketa_subscriptions_client_id ON public.arketa_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_arketa_subscriptions_client_email ON public.arketa_subscriptions(client_email);
CREATE INDEX IF NOT EXISTS idx_arketa_subscriptions_status ON public.arketa_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_arketa_subscriptions_offering_id ON public.arketa_subscriptions(offering_id);
CREATE INDEX IF NOT EXISTS idx_arketa_subscriptions_synced_at ON public.arketa_subscriptions(synced_at);
CREATE INDEX IF NOT EXISTS idx_arketa_subscriptions_staging_batch ON public.arketa_subscriptions_staging(sync_batch_id);

-- Enable RLS
ALTER TABLE public.arketa_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arketa_subscriptions_staging ENABLE ROW LEVEL SECURITY;

-- RLS policies for arketa_subscriptions
DROP POLICY IF EXISTS "Authenticated users can view subscriptions" ON public.arketa_subscriptions;
CREATE POLICY "Authenticated users can view subscriptions"
  ON public.arketa_subscriptions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.arketa_subscriptions;
CREATE POLICY "Service role can manage subscriptions"
  ON public.arketa_subscriptions
  FOR ALL
  TO service_role
  USING (true);

-- RLS policies for staging
DROP POLICY IF EXISTS "Service role can manage subscriptions staging" ON public.arketa_subscriptions_staging;
CREATE POLICY "Service role can manage subscriptions staging"
  ON public.arketa_subscriptions_staging
  FOR ALL
  TO service_role
  USING (true);

-- Grants
GRANT SELECT ON public.arketa_subscriptions TO authenticated;
GRANT ALL ON public.arketa_subscriptions TO service_role;
GRANT ALL ON public.arketa_subscriptions_staging TO service_role;

-- Updated trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger
DROP TRIGGER IF EXISTS update_arketa_subscriptions_updated_at ON public.arketa_subscriptions;
CREATE TRIGGER update_arketa_subscriptions_updated_at
    BEFORE UPDATE ON public.arketa_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
