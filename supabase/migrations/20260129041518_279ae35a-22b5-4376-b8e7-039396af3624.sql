-- Create email templates table for template library
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Managers can manage all templates
CREATE POLICY "Managers can manage templates"
  ON public.email_templates
  FOR ALL
  USING (is_manager_or_admin(auth.uid()));

-- Staff with member access can view templates
CREATE POLICY "Staff can view templates"
  ON public.email_templates
  FOR SELECT
  USING (user_has_any_role(auth.uid(), ARRAY['concierge', 'trainer']::app_role[]));

-- Create member_communications table for logging all communications
CREATE TABLE public.member_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'note', 'call', 'message')),
  subject TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on member_communications
ALTER TABLE public.member_communications ENABLE ROW LEVEL SECURITY;

-- Managers can view all communications
CREATE POLICY "Managers can view all communications"
  ON public.member_communications
  FOR SELECT
  USING (is_manager_or_admin(auth.uid()));

-- Concierges can view and create communications
CREATE POLICY "Concierges can view communications"
  ON public.member_communications
  FOR SELECT
  USING (user_has_role(auth.uid(), 'concierge'));

CREATE POLICY "Concierges can create communications"
  ON public.member_communications
  FOR INSERT
  WITH CHECK (user_has_role(auth.uid(), 'concierge') AND user_id = auth.uid());

-- Trainers can view/create communications for their assigned members
CREATE POLICY "Trainers can view assigned member communications"
  ON public.member_communications
  FOR SELECT
  USING (is_trainer(auth.uid()) AND member_id = ANY(get_trainer_member_ids(auth.uid())));

CREATE POLICY "Trainers can create communications for assigned members"
  ON public.member_communications
  FOR INSERT
  WITH CHECK (is_trainer(auth.uid()) AND user_id = auth.uid() AND member_id = ANY(get_trainer_member_ids(auth.uid())));

-- Users can delete their own communications
CREATE POLICY "Users can delete own communications"
  ON public.member_communications
  FOR DELETE
  USING (user_id = auth.uid());

-- Add trigger for updated_at on email_templates
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_member_communications_member_id ON public.member_communications(member_id);
CREATE INDEX idx_member_communications_created_at ON public.member_communications(created_at DESC);
CREATE INDEX idx_email_templates_category ON public.email_templates(category);