-- Create storage bucket for staff documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('staff-documents', 'staff-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to view staff documents
CREATE POLICY "Authenticated users can view staff documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'staff-documents' AND auth.role() = 'authenticated');

-- Allow managers and admins to upload staff documents
CREATE POLICY "Managers and admins can upload staff documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'staff-documents' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Allow managers and admins to delete staff documents
CREATE POLICY "Managers and admins can delete staff documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'staff-documents' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Update staff_documents table to add uploaded_by_id for proper tracking
ALTER TABLE public.staff_documents 
ADD COLUMN IF NOT EXISTS uploaded_by_id uuid REFERENCES auth.users(id);

-- Add RLS policy for managers/admins to insert documents
CREATE POLICY "Managers and admins can insert staff documents"
ON public.staff_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Add RLS policy for managers/admins to delete documents
CREATE POLICY "Managers and admins can delete staff documents"
ON public.staff_documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);