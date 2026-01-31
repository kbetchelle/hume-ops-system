-- Create staff_announcement_comments table
CREATE TABLE public.staff_announcement_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_announcement_comments ENABLE ROW LEVEL SECURITY;

-- Policies: Any authenticated user can read comments
CREATE POLICY "Authenticated users can view comments"
  ON public.staff_announcement_comments FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can add comments"
  ON public.staff_announcement_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.staff_announcement_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_staff_announcement_comments_announcement 
  ON public.staff_announcement_comments(announcement_id);