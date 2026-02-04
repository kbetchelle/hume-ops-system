-- Create enum for task status
CREATE TYPE public.dev_task_status AS ENUM ('not_started', 'in_progress', 'finishing_touches', 'completed');

-- Create table for dev tasks/pages
CREATE TABLE public.dev_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status dev_task_status NOT NULL DEFAULT 'not_started',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for dev notes
CREATE TABLE public.dev_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.dev_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_notes ENABLE ROW LEVEL SECURITY;

-- Everyone can read dev_tasks
CREATE POLICY "Anyone can view dev tasks"
ON public.dev_tasks FOR SELECT
TO authenticated
USING (true);

-- Only Kat can modify dev_tasks (will check by email in app layer, but allow admins)
CREATE POLICY "Admins can modify dev tasks"
ON public.dev_tasks FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Everyone can read dev_notes
CREATE POLICY "Anyone can view dev notes"
ON public.dev_notes FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify dev_notes
CREATE POLICY "Admins can modify dev notes"
ON public.dev_notes FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Insert initial dev note record
INSERT INTO public.dev_notes (content) VALUES ('');

-- Add trigger for updated_at
CREATE TRIGGER update_dev_tasks_updated_at
  BEFORE UPDATE ON public.dev_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dev_notes_updated_at
  BEFORE UPDATE ON public.dev_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();