-- Add updated_at and updated_by columns to response_templates
ALTER TABLE public.response_templates 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by_name TEXT;

-- Add category_order column for drag-and-drop ordering
ALTER TABLE public.response_templates
ADD COLUMN IF NOT EXISTS category_order INTEGER DEFAULT 0;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_response_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_response_templates_updated_at ON public.response_templates;
CREATE TRIGGER update_response_templates_updated_at
  BEFORE UPDATE ON public.response_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_response_templates_updated_at();