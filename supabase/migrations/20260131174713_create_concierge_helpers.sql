-- Create helper tables for concierge shift report tracking

-- Celebratory events tracker
CREATE TABLE IF NOT EXISTS public.celebratory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date DATE,
  reported_date DATE NOT NULL,
  reported_by TEXT,
  shift_type TEXT CHECK (shift_type IN ('AM', 'PM')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_celebratory_events_date ON public.celebratory_events(event_date);
CREATE INDEX IF NOT EXISTS idx_celebratory_events_reported ON public.celebratory_events(reported_date);

-- Enable RLS
ALTER TABLE public.celebratory_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage celebratory events" ON public.celebratory_events;
CREATE POLICY "Managers can manage celebratory events"
  ON public.celebratory_events
  FOR ALL
  USING (is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Concierges can view celebratory events" ON public.celebratory_events;
CREATE POLICY "Concierges can view celebratory events"
  ON public.celebratory_events
  FOR SELECT
  USING (user_has_role(auth.uid(), 'concierge'));

DROP POLICY IF EXISTS "Concierges can create celebratory events" ON public.celebratory_events;
CREATE POLICY "Concierges can create celebratory events"
  ON public.celebratory_events
  FOR INSERT
  WITH CHECK (user_has_role(auth.uid(), 'concierge'));

-- Facility issues tracker with 48-hour deduplication
CREATE TABLE IF NOT EXISTS public.facility_issues_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  photo_url TEXT,
  reported_date DATE NOT NULL,
  reported_by TEXT,
  shift_type TEXT CHECK (shift_type IN ('AM', 'PM')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create partial unique index for deduplication (only on unresolved issues)
CREATE UNIQUE INDEX IF NOT EXISTS idx_facility_issues_dedup 
  ON public.facility_issues_tracker(description, reported_date)
  WHERE status IN ('open', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_facility_issues_status ON public.facility_issues_tracker(status);
CREATE INDEX IF NOT EXISTS idx_facility_issues_date ON public.facility_issues_tracker(reported_date DESC);

-- Enable RLS
ALTER TABLE public.facility_issues_tracker ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage facility issues" ON public.facility_issues_tracker;
CREATE POLICY "Managers can manage facility issues"
  ON public.facility_issues_tracker
  FOR ALL
  USING (is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Concierges can view facility issues" ON public.facility_issues_tracker;
CREATE POLICY "Concierges can view facility issues"
  ON public.facility_issues_tracker
  FOR SELECT
  USING (user_has_role(auth.uid(), 'concierge'));

DROP POLICY IF EXISTS "Concierges can create facility issues" ON public.facility_issues_tracker;
CREATE POLICY "Concierges can create facility issues"
  ON public.facility_issues_tracker
  FOR INSERT
  WITH CHECK (user_has_role(auth.uid(), 'concierge'));

-- Trigger for updating updated_at
DROP TRIGGER IF EXISTS update_facility_issues_updated_at ON public.facility_issues_tracker;
CREATE TRIGGER update_facility_issues_updated_at
  BEFORE UPDATE ON public.facility_issues_tracker
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- System issues / FOH Q&A tracker
CREATE TABLE IF NOT EXISTS public.foh_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_type TEXT NOT NULL CHECK (issue_type IN ('arketa', 'jolt', 'database', 'question', 'other')),
  description TEXT NOT NULL,
  photo_url TEXT,
  reported_date DATE NOT NULL,
  reported_by TEXT,
  shift_type TEXT CHECK (shift_type IN ('AM', 'PM')),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_foh_questions_type ON public.foh_questions(issue_type);
CREATE INDEX IF NOT EXISTS idx_foh_questions_resolved ON public.foh_questions(resolved);
CREATE INDEX IF NOT EXISTS idx_foh_questions_date ON public.foh_questions(reported_date DESC);

-- Enable RLS
ALTER TABLE public.foh_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage FOH questions" ON public.foh_questions;
CREATE POLICY "Managers can manage FOH questions"
  ON public.foh_questions
  FOR ALL
  USING (is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Concierges can view FOH questions" ON public.foh_questions;
CREATE POLICY "Concierges can view FOH questions"
  ON public.foh_questions
  FOR SELECT
  USING (user_has_role(auth.uid(), 'concierge'));

DROP POLICY IF EXISTS "Concierges can create FOH questions" ON public.foh_questions;
CREATE POLICY "Concierges can create FOH questions"
  ON public.foh_questions
  FOR INSERT
  WITH CHECK (user_has_role(auth.uid(), 'concierge'));

-- Trigger for updating updated_at
DROP TRIGGER IF EXISTS update_foh_questions_updated_at ON public.foh_questions;
CREATE TRIGGER update_foh_questions_updated_at
  BEFORE UPDATE ON public.foh_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.celebratory_events IS 'Tracker for member celebratory events (birthdays, anniversaries, etc.)';
COMMENT ON TABLE public.facility_issues_tracker IS 'Tracker for facility maintenance and equipment issues with 48-hour deduplication';
COMMENT ON TABLE public.foh_questions IS 'Tracker for system issues and questions for management from front desk staff';
