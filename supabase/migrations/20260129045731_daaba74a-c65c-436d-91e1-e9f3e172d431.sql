-- Create training_plans table
CREATE TABLE public.training_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  trainer_user_id UUID NOT NULL,
  share_slug UUID UNIQUE DEFAULT gen_random_uuid(),
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_template BOOLEAN NOT NULL DEFAULT false,
  plan_type TEXT NOT NULL DEFAULT 'workout' CHECK (plan_type IN ('workout', 'nutrition', 'combined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training_plan_content table for rich content sections
CREATE TABLE public.training_plan_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  training_plan_id UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  section_title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'workout' CHECK (content_type IN ('workout', 'nutrition', 'notes')),
  content TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_plan_content ENABLE ROW LEVEL SECURITY;

-- Trainers can view their own plans
CREATE POLICY "Trainers can view their own plans"
ON public.training_plans
FOR SELECT
USING (trainer_user_id = auth.uid());

-- Trainers can create plans for their assigned members or templates
CREATE POLICY "Trainers can create plans"
ON public.training_plans
FOR INSERT
WITH CHECK (
  is_trainer(auth.uid()) 
  AND trainer_user_id = auth.uid()
  AND (
    member_id IS NULL 
    OR member_id = ANY(get_trainer_member_ids(auth.uid()))
  )
);

-- Trainers can update their own plans
CREATE POLICY "Trainers can update their own plans"
ON public.training_plans
FOR UPDATE
USING (trainer_user_id = auth.uid());

-- Trainers can delete their own plans
CREATE POLICY "Trainers can delete their own plans"
ON public.training_plans
FOR DELETE
USING (trainer_user_id = auth.uid());

-- Managers can view all plans
CREATE POLICY "Managers can view all plans"
ON public.training_plans
FOR SELECT
USING (is_manager_or_admin(auth.uid()));

-- Public access for shared plans (no auth required)
CREATE POLICY "Public can view shared plans"
ON public.training_plans
FOR SELECT
USING (is_public = true);

-- Content policies follow plan access
CREATE POLICY "Users can view content of accessible plans"
ON public.training_plan_content
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.training_plans tp
    WHERE tp.id = training_plan_content.training_plan_id
    AND (
      tp.trainer_user_id = auth.uid()
      OR is_manager_or_admin(auth.uid())
      OR tp.is_public = true
    )
  )
);

CREATE POLICY "Trainers can manage content of their plans"
ON public.training_plan_content
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.training_plans tp
    WHERE tp.id = training_plan_content.training_plan_id
    AND tp.trainer_user_id = auth.uid()
  )
);

-- Add updated_at triggers
CREATE TRIGGER update_training_plans_updated_at
  BEFORE UPDATE ON public.training_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_plan_content_updated_at
  BEFORE UPDATE ON public.training_plan_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_training_plans_trainer ON public.training_plans(trainer_user_id);
CREATE INDEX idx_training_plans_member ON public.training_plans(member_id);
CREATE INDEX idx_training_plans_share_slug ON public.training_plans(share_slug);
CREATE INDEX idx_training_plan_content_plan ON public.training_plan_content(training_plan_id);