-- ============================================================================
-- Migration: Create Bug Reports Table
-- Version: 20260204000005
-- Description: Adds bug reporting functionality for all users
-- ============================================================================

-- Create bug_reports table
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('bug', 'feature', 'ui', 'performance', 'general')),
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  page_url TEXT,
  user_agent TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_user ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created ON bug_reports(created_at DESC);

-- Enable RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can insert their own bug reports
CREATE POLICY "Users can create bug reports"
  ON bug_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can view their own bug reports
CREATE POLICY "Users can view own bug reports"
  ON bug_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Admins and managers can view all bug reports
CREATE POLICY "Admins can view all bug reports"
  ON bug_reports FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('admin', 'manager')
    )
  );

-- RLS Policy: Admins and managers can update bug reports
CREATE POLICY "Admins can update bug reports"
  ON bug_reports FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('admin', 'manager')
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_bug_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS bug_reports_updated_at ON bug_reports;
CREATE TRIGGER bug_reports_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_reports_updated_at();

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Bug Reports table created successfully';
  RAISE NOTICE 'Users can now report bugs through the app';
  RAISE NOTICE 'Admins/Managers can view and manage reports';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
