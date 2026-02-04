-- Create toast_sales table for Toast POS sales data
-- This table stores daily aggregated sales from Toast API

CREATE TABLE IF NOT EXISTS public.toast_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_date DATE NOT NULL UNIQUE,
  net_sales NUMERIC(10,2) DEFAULT 0,
  gross_sales NUMERIC(10,2) DEFAULT 0,
  cafe_sales NUMERIC(10,2) DEFAULT 0,
  raw_data JSONB,
  sync_batch_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_toast_sales_business_date ON public.toast_sales(business_date);
CREATE INDEX IF NOT EXISTS idx_toast_sales_sync_batch ON public.toast_sales(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_toast_sales_created_at ON public.toast_sales(created_at);

-- Enable RLS
ALTER TABLE public.toast_sales ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Authenticated users can view toast_sales" ON public.toast_sales;
CREATE POLICY "Authenticated users can view toast_sales"
  ON public.toast_sales
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can manage toast_sales" ON public.toast_sales;
CREATE POLICY "Service role can manage toast_sales"
  ON public.toast_sales
  FOR ALL
  TO service_role
  USING (true);

-- Grants
GRANT SELECT ON public.toast_sales TO authenticated;
GRANT ALL ON public.toast_sales TO service_role;

-- Add comment
COMMENT ON TABLE public.toast_sales IS 'Daily sales data synced from Toast POS API';
