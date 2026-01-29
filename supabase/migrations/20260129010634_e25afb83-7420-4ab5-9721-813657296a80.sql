-- Create checklists table (assigned to roles)
CREATE TABLE public.checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  role public.app_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checklist items table
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checklist completions table (tracks daily completions)
CREATE TABLE public.checklist_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_item_id UUID NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(checklist_item_id, user_id, completion_date)
);

-- Enable RLS
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_completions ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX idx_checklist_items_checklist_id ON public.checklist_items(checklist_id);
CREATE INDEX idx_checklist_items_sort_order ON public.checklist_items(sort_order);
CREATE INDEX idx_checklist_completions_date ON public.checklist_completions(completion_date);
CREATE INDEX idx_checklist_completions_user ON public.checklist_completions(user_id);
CREATE INDEX idx_checklists_role ON public.checklists(role);

-- Triggers for updated_at
CREATE TRIGGER update_checklists_updated_at
  BEFORE UPDATE ON public.checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.user_has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for checklists

-- Managers/admins can do everything with checklists
CREATE POLICY "Managers can manage checklists"
  ON public.checklists
  FOR ALL
  USING (public.is_manager_or_admin(auth.uid()));

-- Staff can view active checklists for their roles
CREATE POLICY "Staff can view checklists for their roles"
  ON public.checklists
  FOR SELECT
  USING (
    is_active = true 
    AND public.user_has_role(auth.uid(), role)
  );

-- RLS Policies for checklist_items

-- Managers/admins can manage all items
CREATE POLICY "Managers can manage checklist items"
  ON public.checklist_items
  FOR ALL
  USING (public.is_manager_or_admin(auth.uid()));

-- Staff can view items for checklists they have access to
CREATE POLICY "Staff can view checklist items for their roles"
  ON public.checklist_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.checklists c
      WHERE c.id = checklist_id
        AND c.is_active = true
        AND public.user_has_role(auth.uid(), c.role)
    )
  );

-- RLS Policies for checklist_completions

-- Users can insert their own completions
CREATE POLICY "Users can create their own completions"
  ON public.checklist_completions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.checklist_items ci
      JOIN public.checklists c ON c.id = ci.checklist_id
      WHERE ci.id = checklist_item_id
        AND c.is_active = true
        AND public.user_has_role(auth.uid(), c.role)
    )
  );

-- Users can delete their own completions (uncheck)
CREATE POLICY "Users can delete their own completions"
  ON public.checklist_completions
  FOR DELETE
  USING (user_id = auth.uid());

-- Users can view their own completions
CREATE POLICY "Users can view their own completions"
  ON public.checklist_completions
  FOR SELECT
  USING (user_id = auth.uid());

-- Managers can view all completions
CREATE POLICY "Managers can view all completions"
  ON public.checklist_completions
  FOR SELECT
  USING (public.is_manager_or_admin(auth.uid()));