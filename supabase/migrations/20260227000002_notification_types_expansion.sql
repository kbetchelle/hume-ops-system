-- =============================================
-- Notification Types Expansion
-- =============================================
-- Adds push_enabled master toggle to notification_preferences
-- and documents valid notification types for reference.

-- Add master push toggle per user
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS push_enabled boolean DEFAULT false;

-- Document valid notification types (for reference)
-- Types: qa_answered, qa_new_question, announcement, message, bug_report_update,
-- member_alert, class_turnover, mat_cleaning, account_approval_pending,
-- account_approved, account_rejected, resource_outdated, package_arrived,
-- room_turnover, tour_alert
COMMENT ON TABLE public.notification_preferences IS 'User notification preferences. Valid notification types: qa_answered, qa_new_question, announcement, message, bug_report_update, member_alert, class_turnover, mat_cleaning, account_approval_pending, account_approved, account_rejected, resource_outdated, package_arrived, room_turnover, tour_alert';
