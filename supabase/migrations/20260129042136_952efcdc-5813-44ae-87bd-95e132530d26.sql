-- Create activity_logs table to track member visits and class attendance
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('visit', 'class_attendance', 'booking', 'purchase')),
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  details JSONB DEFAULT '{}'::jsonb,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Managers can view all activity logs
CREATE POLICY "Managers can view all activity logs"
  ON public.activity_logs
  FOR SELECT
  USING (is_manager_or_admin(auth.uid()));

-- Concierges can view and create activity logs
CREATE POLICY "Concierges can view activity logs"
  ON public.activity_logs
  FOR SELECT
  USING (user_has_role(auth.uid(), 'concierge'));

CREATE POLICY "Concierges can create activity logs"
  ON public.activity_logs
  FOR INSERT
  WITH CHECK (user_has_role(auth.uid(), 'concierge'));

-- Trainers can view activity for assigned members
CREATE POLICY "Trainers can view assigned member activity"
  ON public.activity_logs
  FOR SELECT
  USING (is_trainer(auth.uid()) AND member_id = ANY(get_trainer_member_ids(auth.uid())));

-- Create daily_report_history table for storing shift reports with aggregated data
CREATE TABLE public.daily_report_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('AM', 'PM')),
  staff_user_id UUID NOT NULL,
  staff_name TEXT,
  
  -- Members section
  member_feedback JSONB DEFAULT '[]'::jsonb,
  membership_requests JSONB DEFAULT '[]'::jsonb,
  celebratory_events JSONB DEFAULT '[]'::jsonb,
  
  -- Tours section
  scheduled_tours JSONB DEFAULT '[]'::jsonb,
  tour_notes JSONB DEFAULT '[]'::jsonb,
  
  -- Facilities section
  facility_issues JSONB DEFAULT '[]'::jsonb,
  busiest_areas TEXT,
  
  -- System issues
  system_issues JSONB DEFAULT '[]'::jsonb,
  
  -- Management notes
  management_notes TEXT,
  
  -- Future shift notes
  future_shift_notes JSONB DEFAULT '[]'::jsonb,
  
  -- Aggregated API data (to be populated by integrations)
  arketa_reservations JSONB DEFAULT '{}'::jsonb,
  arketa_payments JSONB DEFAULT '{}'::jsonb,
  toast_sales JSONB DEFAULT '{}'::jsonb,
  sling_shift_data JSONB DEFAULT '{}'::jsonb,
  
  -- Summary stats
  total_visits INTEGER DEFAULT 0,
  total_class_attendance INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: one report per shift per day
  UNIQUE(report_date, shift_type)
);

-- Enable RLS on daily_report_history
ALTER TABLE public.daily_report_history ENABLE ROW LEVEL SECURITY;

-- Managers can manage all reports
CREATE POLICY "Managers can manage all reports"
  ON public.daily_report_history
  FOR ALL
  USING (is_manager_or_admin(auth.uid()));

-- Concierges can view all reports
CREATE POLICY "Concierges can view reports"
  ON public.daily_report_history
  FOR SELECT
  USING (user_has_role(auth.uid(), 'concierge'));

-- Concierges can create and update their own reports
CREATE POLICY "Concierges can create reports"
  ON public.daily_report_history
  FOR INSERT
  WITH CHECK (user_has_role(auth.uid(), 'concierge') AND staff_user_id = auth.uid());

CREATE POLICY "Concierges can update their own reports"
  ON public.daily_report_history
  FOR UPDATE
  USING (user_has_role(auth.uid(), 'concierge') AND staff_user_id = auth.uid() AND status = 'draft');

-- Add trigger for updated_at
CREATE TRIGGER update_daily_report_history_updated_at
  BEFORE UPDATE ON public.daily_report_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_activity_logs_member_id ON public.activity_logs(member_id);
CREATE INDEX idx_activity_logs_activity_date ON public.activity_logs(activity_date DESC);
CREATE INDEX idx_activity_logs_activity_type ON public.activity_logs(activity_type);
CREATE INDEX idx_daily_report_history_date ON public.daily_report_history(report_date DESC);
CREATE INDEX idx_daily_report_history_staff ON public.daily_report_history(staff_user_id);