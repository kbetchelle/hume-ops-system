-- Lost and Found enhancements: category enum, photo_url, member_requested, member_requests table, storage bucket
-- Migration created: 2026-02-07

-- 1. Create enum for object category
CREATE TYPE public.lost_and_found_category AS ENUM (
  'wallet',
  'keys',
  'phone',
  'clothing',
  'jewelry',
  'bag',
  'water_bottle',
  'other'
);

-- 2. Alter lost_and_found: add photo_url, object_category, member_requested
ALTER TABLE public.lost_and_found
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS object_category public.lost_and_found_category,
  ADD COLUMN IF NOT EXISTS member_requested boolean DEFAULT false;

-- 3. New table: lost_and_found_member_requests
CREATE TABLE IF NOT EXISTS public.lost_and_found_member_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  member_name text,
  member_contact text,
  date_inquired date DEFAULT CURRENT_DATE,
  notes text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
  matched_item_id uuid REFERENCES public.lost_and_found(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.lost_and_found_member_requests ENABLE ROW LEVEL SECURITY;

-- RLS for lost_and_found_member_requests
CREATE POLICY "Authenticated users can read member requests"
  ON public.lost_and_found_member_requests FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can insert member requests"
  ON public.lost_and_found_member_requests FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Staff can update member requests"
  ON public.lost_and_found_member_requests FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can delete member requests"
  ON public.lost_and_found_member_requests FOR DELETE
  USING (public.is_manager_or_admin(auth.uid()));

-- Indexes for lost_and_found_member_requests
CREATE INDEX IF NOT EXISTS idx_lost_and_found_member_requests_status ON public.lost_and_found_member_requests(status);
CREATE INDEX IF NOT EXISTS idx_lost_and_found_member_requests_matched_item_id ON public.lost_and_found_member_requests(matched_item_id);
CREATE INDEX IF NOT EXISTS idx_lost_and_found_object_category ON public.lost_and_found(object_category);
CREATE INDEX IF NOT EXISTS idx_lost_and_found_member_requested ON public.lost_and_found(member_requested);

-- 4. Storage bucket for lost-and-found photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('lost-and-found-photos', 'lost-and-found-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload lost and found photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'lost-and-found-photos');

CREATE POLICY "Authenticated users can view lost and found photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'lost-and-found-photos');

CREATE POLICY "Users can update lost and found photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'lost-and-found-photos');

CREATE POLICY "Managers can delete lost and found photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lost-and-found-photos'
    AND public.is_manager_or_admin(auth.uid())
  );
