-- Create build_status table for tracking project build progress
CREATE TABLE public.build_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  task TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Not Started',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.build_status ENABLE ROW LEVEL SECURITY;

-- Managers and Admins can view build status
CREATE POLICY "Managers and Admins can view build status"
  ON public.build_status
  FOR SELECT
  USING (public.is_manager_or_admin(auth.uid()));

-- Managers and Admins can insert build status
CREATE POLICY "Managers and Admins can insert build status"
  ON public.build_status
  FOR INSERT
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

-- Managers and Admins can update build status
CREATE POLICY "Managers and Admins can update build status"
  ON public.build_status
  FOR UPDATE
  USING (public.is_manager_or_admin(auth.uid()));

-- Managers and Admins can delete build status
CREATE POLICY "Managers and Admins can delete build status"
  ON public.build_status
  FOR DELETE
  USING (public.is_manager_or_admin(auth.uid()));

-- Create trigger for updating updated_at
CREATE TRIGGER update_build_status_updated_at
  BEFORE UPDATE ON public.build_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();