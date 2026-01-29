-- Add partial_success status to member_sync_log
-- First, let's check if we need to add a check constraint or if it's just a text field
-- Since status is a text field, we can just add documentation
COMMENT ON COLUMN public.member_sync_log.status IS 'Sync status: running, completed, partial_success, completed_with_errors, failed';

-- Add columns for tracking individual record failures
ALTER TABLE public.member_sync_log 
ADD COLUMN IF NOT EXISTS failed_record_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS success_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failure_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS retry_attempts INTEGER DEFAULT 0;