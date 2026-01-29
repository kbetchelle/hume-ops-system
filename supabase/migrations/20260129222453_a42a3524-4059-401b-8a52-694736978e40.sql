-- Create staff_shifts table for GetSling shift data
CREATE TABLE public.staff_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,
  user_name TEXT,
  user_email TEXT,
  position TEXT,
  shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_end TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_date DATE NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'scheduled',
  raw_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_sales table for Toast POS data
CREATE TABLE public.daily_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_date DATE NOT NULL UNIQUE,
  total_sales NUMERIC(12,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  payment_breakdown JSONB DEFAULT '{}',
  top_items JSONB DEFAULT '[]',
  raw_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sling_sync_log table for tracking sync operations
CREATE TABLE public.sling_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running',
  records_synced INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  failed_record_ids TEXT[],
  error_message TEXT,
  retry_attempts INTEGER DEFAULT 0
);

-- Create toast_sync_log table for tracking sync operations
CREATE TABLE public.toast_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running',
  records_synced INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  error_message TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sling_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toast_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for staff_shifts - authenticated users can read
CREATE POLICY "Authenticated users can view staff shifts"
  ON public.staff_shifts
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS policies for daily_sales - authenticated users can read
CREATE POLICY "Authenticated users can view daily sales"
  ON public.daily_sales
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS policies for sling_sync_log - managers and admins can view
CREATE POLICY "Managers and admins can view sling sync logs"
  ON public.sling_sync_log
  FOR SELECT
  USING (public.is_manager_or_admin(auth.uid()));

-- RLS policies for toast_sync_log - managers and admins can view
CREATE POLICY "Managers and admins can view toast sync logs"
  ON public.toast_sync_log
  FOR SELECT
  USING (public.is_manager_or_admin(auth.uid()));

-- Create indexes for common queries
CREATE INDEX idx_staff_shifts_date ON public.staff_shifts (shift_date);
CREATE INDEX idx_staff_shifts_status ON public.staff_shifts (status);
CREATE INDEX idx_daily_sales_date ON public.daily_sales (business_date);
CREATE INDEX idx_sling_sync_log_status ON public.sling_sync_log (status);
CREATE INDEX idx_toast_sync_log_status ON public.toast_sync_log (status);