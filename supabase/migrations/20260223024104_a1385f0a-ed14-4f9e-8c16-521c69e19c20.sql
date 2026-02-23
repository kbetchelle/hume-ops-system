
-- Create facility_issues table
CREATE TABLE public.facility_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  photo_url TEXT,
  reported_by_name TEXT NOT NULL,
  reported_by_id UUID,
  source TEXT NOT NULL DEFAULT 'concierge' CHECK (source IN ('concierge', 'cafe', 'boh')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_at TIMESTAMPTZ,
  resolved_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.facility_issues ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert
CREATE POLICY "Authenticated users can report facility issues"
ON public.facility_issues FOR INSERT TO authenticated
WITH CHECK (true);

-- Managers and admins can view all
CREATE POLICY "Managers and admins can view facility issues"
ON public.facility_issues FOR SELECT TO authenticated
USING (public.is_manager_or_admin(auth.uid()));

-- Managers and admins can update status
CREATE POLICY "Managers and admins can update facility issues"
ON public.facility_issues FOR UPDATE TO authenticated
USING (public.is_manager_or_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_facility_issues_updated_at
BEFORE UPDATE ON public.facility_issues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
