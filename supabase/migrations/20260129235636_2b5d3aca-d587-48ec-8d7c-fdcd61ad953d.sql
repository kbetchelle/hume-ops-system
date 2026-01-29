-- Create sync_metrics table for historical analysis
CREATE TABLE IF NOT EXISTS public.sync_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  records_fetched INTEGER,
  records_synced INTEGER,
  records_failed INTEGER,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sync_metrics ENABLE ROW LEVEL SECURITY;

-- Allow managers/admins to view metrics
CREATE POLICY "Managers can view sync_metrics" ON public.sync_metrics
  FOR SELECT USING (is_manager_or_admin(auth.uid()));

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sync_metrics_sync_type ON public.sync_metrics(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_metrics_started_at ON public.sync_metrics(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_metrics_type_started ON public.sync_metrics(sync_type, started_at DESC);

-- Add comment describing the table
COMMENT ON TABLE public.sync_metrics IS 'Historical sync performance metrics for monitoring and analysis';