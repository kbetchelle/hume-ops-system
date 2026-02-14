-- Create sick day pay requests table
CREATE TABLE public.sick_day_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  user_name TEXT NOT NULL,
  requested_dates DATE[] NOT NULL,
  notes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by_id UUID REFERENCES auth.users(id),
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_sick_requests_user ON public.sick_day_requests(user_id);
CREATE INDEX idx_sick_requests_status ON public.sick_day_requests(status);
CREATE INDEX idx_sick_requests_dates ON public.sick_day_requests USING gin(requested_dates);

-- RLS Policies
ALTER TABLE public.sick_day_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own sick day requests"
ON public.sick_day_requests FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own sick day requests"
ON public.sick_day_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Managers/admins can view all requests
CREATE POLICY "Managers can view all sick day requests"
ON public.sick_day_requests FOR SELECT
USING (public.is_manager_or_admin(auth.uid()));

-- Managers/admins can update requests
CREATE POLICY "Managers can update sick day requests"
ON public.sick_day_requests FOR UPDATE
USING (public.is_manager_or_admin(auth.uid()));
