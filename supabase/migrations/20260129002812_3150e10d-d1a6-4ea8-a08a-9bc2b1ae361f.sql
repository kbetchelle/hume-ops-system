-- Create membership tier enum
CREATE TYPE public.membership_tier AS ENUM ('basic', 'standard', 'premium', 'vip');

-- Create members table (cache for external API data)
CREATE TABLE public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE NOT NULL,
  email text NOT NULL,
  first_name text,
  last_name text,
  full_name text,
  phone text,
  membership_tier membership_tier DEFAULT 'basic',
  join_date timestamptz,
  external_trainer_id text,
  avatar_url text,
  raw_data jsonb,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create trainer assignments table (for manual assignments by admin or trainer)
CREATE TABLE public.trainer_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  trainer_user_id uuid NOT NULL,
  assigned_by uuid NOT NULL,
  assignment_type text NOT NULL DEFAULT 'manual', -- 'manual', 'external', 'lead'
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, trainer_user_id)
);

-- Create member notes table
CREATE TABLE public.member_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create sync log table for tracking background jobs
CREATE TABLE public.member_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  records_synced integer DEFAULT 0,
  error_message text
);

-- Enable RLS on all tables
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_sync_log ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is manager or admin
CREATE OR REPLACE FUNCTION public.is_manager_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager')
  )
$$;

-- Create function to check if user is a trainer
CREATE OR REPLACE FUNCTION public.is_trainer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'trainer'
  )
$$;

-- Create function to get trainer's assigned member IDs
CREATE OR REPLACE FUNCTION public.get_trainer_member_ids(_trainer_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(member_id), ARRAY[]::uuid[])
  FROM public.trainer_assignments
  WHERE trainer_user_id = _trainer_id
$$;

-- RLS Policies for members table
-- Managers and admins can see all members
CREATE POLICY "Managers and admins can view all members"
ON public.members FOR SELECT
USING (public.is_manager_or_admin(auth.uid()));

-- Trainers can see only their assigned clients
CREATE POLICY "Trainers can view assigned members"
ON public.members FOR SELECT
USING (
  public.is_trainer(auth.uid()) 
  AND id = ANY(public.get_trainer_member_ids(auth.uid()))
);

-- RLS Policies for trainer_assignments
-- Managers and admins can manage all assignments
CREATE POLICY "Managers and admins can manage assignments"
ON public.trainer_assignments FOR ALL
USING (public.is_manager_or_admin(auth.uid()));

-- Trainers can view their own assignments
CREATE POLICY "Trainers can view their assignments"
ON public.trainer_assignments FOR SELECT
USING (trainer_user_id = auth.uid());

-- Trainers can create their own lead assignments
CREATE POLICY "Trainers can add their own leads"
ON public.trainer_assignments FOR INSERT
WITH CHECK (
  public.is_trainer(auth.uid()) 
  AND trainer_user_id = auth.uid() 
  AND assignment_type = 'lead'
);

-- RLS Policies for member_notes
-- Users can view notes on members they can see
CREATE POLICY "Users can view notes on accessible members"
ON public.member_notes FOR SELECT
USING (
  public.is_manager_or_admin(auth.uid())
  OR (public.is_trainer(auth.uid()) AND member_id = ANY(public.get_trainer_member_ids(auth.uid())))
);

-- Users can create notes on accessible members
CREATE POLICY "Users can create notes on accessible members"
ON public.member_notes FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND (
    public.is_manager_or_admin(auth.uid())
    OR (public.is_trainer(auth.uid()) AND member_id = ANY(public.get_trainer_member_ids(auth.uid())))
  )
);

-- Users can update their own notes
CREATE POLICY "Users can update their own notes"
ON public.member_notes FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own notes
CREATE POLICY "Users can delete their own notes"
ON public.member_notes FOR DELETE
USING (user_id = auth.uid());

-- RLS for sync log - only admins/managers can view
CREATE POLICY "Admins and managers can view sync logs"
ON public.member_sync_log FOR SELECT
USING (public.is_manager_or_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_members_email ON public.members(email);
CREATE INDEX idx_members_full_name ON public.members(full_name);
CREATE INDEX idx_members_membership_tier ON public.members(membership_tier);
CREATE INDEX idx_trainer_assignments_trainer ON public.trainer_assignments(trainer_user_id);
CREATE INDEX idx_trainer_assignments_member ON public.trainer_assignments(member_id);
CREATE INDEX idx_member_notes_member ON public.member_notes(member_id);

-- Add trigger for updated_at
CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_member_notes_updated_at
BEFORE UPDATE ON public.member_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();