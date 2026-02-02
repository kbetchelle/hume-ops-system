-- Create storage bucket for checklist photos
-- Migration created: 2026-02-02

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('checklist-photos', 'checklist-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for checklist-photos bucket
CREATE POLICY "Authenticated users can upload checklist photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'checklist-photos');

CREATE POLICY "Authenticated users can view checklist photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'checklist-photos');

CREATE POLICY "Users can update their own checklist photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'checklist-photos');

CREATE POLICY "Managers can delete checklist photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'checklist-photos' 
    AND public.is_manager_or_admin(auth.uid())
  );
