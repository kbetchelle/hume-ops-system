-- Drop the partially created table if it exists
DROP TABLE IF EXISTS public.page_dev_status;

-- Create table for page development status
CREATE TABLE public.page_dev_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  page_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_path)
);

-- Enable RLS
ALTER TABLE public.page_dev_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for page_dev_status - only admins and managers can access via user_roles
CREATE POLICY "Admins and managers can view page status"
ON public.page_dev_status FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can insert page status"
ON public.page_dev_status FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can update page status"
ON public.page_dev_status FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'manager')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_page_dev_status_updated_at
BEFORE UPDATE ON public.page_dev_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial page status records for all admin/manager pages
INSERT INTO public.page_dev_status (page_path, page_title, status) VALUES
  ('/dashboard', 'Dashboard', 'not_started'),
  ('/dashboard/members', 'Membership', 'not_started'),
  ('/dashboard/analytics', 'Analytics', 'not_started'),
  ('/dashboard/reports', 'Reports', 'not_started'),
  ('/dashboard/checklists', 'Checklists', 'not_started'),
  ('/dashboard/staff-announcements', 'Staff Announcements', 'not_started'),
  ('/dashboard/user-management', 'User Management', 'not_started'),
  ('/dashboard/api-syncing', 'API Syncing', 'not_started'),
  ('/dashboard/api-data-mapping', 'API Data Mapping', 'not_started'),
  ('/dashboard/backfill', 'Backfill Manager', 'not_started')
ON CONFLICT (page_path) DO NOTHING;