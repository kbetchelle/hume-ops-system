-- Add outdated tracking columns to response_templates
ALTER TABLE public.response_templates 
ADD COLUMN IF NOT EXISTS is_outdated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS marked_outdated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS marked_outdated_by_name text,
ADD COLUMN IF NOT EXISTS marked_outdated_at timestamp with time zone;

-- Create template_outdated_notifications table
CREATE TABLE IF NOT EXISTS public.template_outdated_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.response_templates(id) ON DELETE CASCADE NOT NULL,
  marked_by_user_id uuid REFERENCES auth.users(id) NOT NULL,
  marked_by_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  is_read boolean DEFAULT false,
  read_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.template_outdated_notifications ENABLE ROW LEVEL SECURITY;

-- Managers and admins can view notifications
CREATE POLICY "Managers and admins can view notifications"
ON public.template_outdated_notifications
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Authenticated users can create notifications
CREATE POLICY "Authenticated users can create notifications"
ON public.template_outdated_notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = marked_by_user_id);

-- Managers and admins can update notifications (mark as read)
CREATE POLICY "Managers and admins can update notifications"
ON public.template_outdated_notifications
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Update response_templates RLS to allow any authenticated user to update
DROP POLICY IF EXISTS "Users can update templates" ON public.response_templates;
CREATE POLICY "Authenticated users can update templates"
ON public.response_templates
FOR UPDATE
TO authenticated
USING (true);