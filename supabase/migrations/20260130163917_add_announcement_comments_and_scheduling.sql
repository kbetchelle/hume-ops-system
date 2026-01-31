-- Add comments table for staff announcements
CREATE TABLE IF NOT EXISTS public.staff_announcement_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.staff_announcements(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  user_name text NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster comment lookups
CREATE INDEX IF NOT EXISTS idx_staff_announcement_comments_announcement_id 
  ON public.staff_announcement_comments(announcement_id);

-- Add scheduling column to staff_announcements
ALTER TABLE public.staff_announcements 
ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
ADD COLUMN IF NOT EXISTS created_by_id uuid REFERENCES auth.users(id);

-- Create storage bucket for announcement photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('staff-announcements', 'staff-announcements', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for staff_announcement_comments

-- Enable RLS
ALTER TABLE public.staff_announcement_comments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all comments
DROP POLICY IF EXISTS "Authenticated users can read comments" ON public.staff_announcement_comments;
CREATE POLICY "Authenticated users can read comments"
  ON public.staff_announcement_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert their own comments
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.staff_announcement_comments;
CREATE POLICY "Authenticated users can insert comments"
  ON public.staff_announcement_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments, managers/admins can delete any
DROP POLICY IF EXISTS "Users can delete own comments or managers can delete any" ON public.staff_announcement_comments;
CREATE POLICY "Users can delete own comments or managers can delete any"
  ON public.staff_announcement_comments
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.is_manager_or_admin(auth.uid())
  );

-- Storage policies for staff-announcements bucket

-- Anyone can view announcement photos (public bucket)
DROP POLICY IF EXISTS "Public can view announcement photos" ON storage.objects;
CREATE POLICY "Public can view announcement photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'staff-announcements');

-- Managers and admins can upload photos
DROP POLICY IF EXISTS "Managers can upload announcement photos" ON storage.objects;
CREATE POLICY "Managers can upload announcement photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'staff-announcements' 
    AND public.is_manager_or_admin(auth.uid())
  );

-- Managers and admins can delete photos
DROP POLICY IF EXISTS "Managers can delete announcement photos" ON storage.objects;
CREATE POLICY "Managers can delete announcement photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'staff-announcements' 
    AND public.is_manager_or_admin(auth.uid())
  );

-- Grant permissions
GRANT ALL ON public.staff_announcement_comments TO authenticated;
GRANT ALL ON public.staff_announcement_comments TO service_role;
