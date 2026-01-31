-- NOTE: staff_announcement_comments table is created in 20260130163917_add_announcement_comments_and_scheduling.sql
-- This migration is kept for compatibility but all operations are idempotent

-- Create table only if it doesn't exist (it should already exist from earlier migration)
CREATE TABLE IF NOT EXISTS public.staff_announcement_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (idempotent)
ALTER TABLE public.staff_announcement_comments ENABLE ROW LEVEL SECURITY;

-- Policies (drop if exist first to make idempotent)
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.staff_announcement_comments;
CREATE POLICY "Authenticated users can view comments"
  ON public.staff_announcement_comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can add comments" ON public.staff_announcement_comments;
CREATE POLICY "Users can add comments"
  ON public.staff_announcement_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.staff_announcement_comments;
CREATE POLICY "Users can delete own comments"
  ON public.staff_announcement_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index (idempotent)
CREATE INDEX IF NOT EXISTS idx_staff_announcement_comments_announcement 
  ON public.staff_announcement_comments(announcement_id);