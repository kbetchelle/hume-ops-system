-- Create backfill_jobs table
CREATE TABLE public.backfill_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_source TEXT NOT NULL,
  data_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  processing_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  total_days INTEGER NOT NULL DEFAULT 0,
  days_processed INTEGER NOT NULL DEFAULT 0,
  records_processed INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_api_source CHECK (api_source IN ('arketa', 'sling')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'paused'))
);

-- Enable RLS
ALTER TABLE public.backfill_jobs ENABLE ROW LEVEL SECURITY;

-- Admin-only RLS policies
CREATE POLICY "Admins can view backfill jobs"
  ON public.backfill_jobs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create backfill jobs"
  ON public.backfill_jobs FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update backfill jobs"
  ON public.backfill_jobs FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete backfill jobs"
  ON public.backfill_jobs FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_backfill_jobs_status ON public.backfill_jobs(status);
CREATE INDEX idx_backfill_jobs_api_source ON public.backfill_jobs(api_source);
CREATE INDEX idx_backfill_jobs_created_at ON public.backfill_jobs(created_at DESC);

-- Enable realtime for backfill_jobs
ALTER PUBLICATION supabase_realtime ADD TABLE public.backfill_jobs;