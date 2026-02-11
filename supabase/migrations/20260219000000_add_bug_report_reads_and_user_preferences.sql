-- ============================================================================
-- Migration: Add Bug Report Reads and User Preferences Tables
-- Version: 20260219000000
-- Description: Adds bug_report_reads for tracking read state per user,
--              user_preferences for notification toggles, and enables
--              Supabase Realtime on bug_reports.
-- ============================================================================

-- 1. Create bug_report_reads table
CREATE TABLE IF NOT EXISTS public.bug_report_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_report_id UUID REFERENCES public.bug_reports(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (bug_report_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bug_report_reads_user ON bug_report_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_report_reads_bug ON bug_report_reads(bug_report_id);

-- Enable RLS on bug_report_reads
ALTER TABLE bug_report_reads ENABLE ROW LEVEL SECURITY;

-- Users can insert their own read receipts
CREATE POLICY "Users can mark bug reports as read"
  ON bug_report_reads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own read receipts
CREATE POLICY "Users can view own read receipts"
  ON bug_report_reads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own read receipts (needed for UPSERT on conflict)
CREATE POLICY "Users can update own read receipts"
  ON bug_report_reads FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Admins/managers can view all read receipts
CREATE POLICY "Admins can view all read receipts"
  ON bug_report_reads FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT ur.user_id FROM user_roles ur
      WHERE ur.role IN ('admin', 'manager')
    )
  );

-- 2. Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bug_report_badge_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at trigger for user_preferences
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_preferences_updated_at ON user_preferences;
CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- 3. Enable Supabase Realtime on bug_reports for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE bug_reports;

-- ============================================================================
-- Migration Complete
-- ============================================================================
