-- Club policies table for policy documents
CREATE TABLE IF NOT EXISTS public.club_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  last_updated_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff Q&A with policy linking
CREATE TABLE IF NOT EXISTS public.staff_qa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  context text,
  answer text,
  answer_type text CHECK (answer_type IN ('policy_link', 'direct_answer')),
  linked_policy_id uuid REFERENCES public.club_policies(id) ON DELETE SET NULL,
  asked_by_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  asked_by_name text NOT NULL,
  answered_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  answered_by_name text,
  is_resolved boolean DEFAULT false,
  is_public boolean DEFAULT true,
  parent_id uuid REFERENCES public.staff_qa(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff notifications for notification bell
CREATE TABLE IF NOT EXISTS public.staff_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for fast notification lookup
CREATE INDEX IF NOT EXISTS idx_staff_notifications_user_unread
  ON public.staff_notifications(user_id, is_read)
  WHERE is_read = false;

-- Add is_draft to shift_reports if not exists
ALTER TABLE public.shift_reports 
  ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT true;

-- Enable RLS on new tables
ALTER TABLE public.club_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for club_policies
-- All authenticated users can read active policies
CREATE POLICY "Authenticated users can read active policies"
  ON public.club_policies
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Managers/admins can do everything on policies
CREATE POLICY "Managers can manage policies"
  ON public.club_policies
  FOR ALL
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()))
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

-- RLS Policies for staff_qa
-- Users can read their own questions and public resolved questions
CREATE POLICY "Users can read own questions and public resolved"
  ON public.staff_qa
  FOR SELECT
  TO authenticated
  USING (
    asked_by_id = auth.uid() 
    OR (is_public = true AND is_resolved = true)
    OR public.is_manager_or_admin(auth.uid())
  );

-- All authenticated users can insert questions
CREATE POLICY "Authenticated users can submit questions"
  ON public.staff_qa
  FOR INSERT
  TO authenticated
  WITH CHECK (asked_by_id = auth.uid());

-- Users can update their own unresolved questions
CREATE POLICY "Users can update own unresolved questions"
  ON public.staff_qa
  FOR UPDATE
  TO authenticated
  USING (
    (asked_by_id = auth.uid() AND is_resolved = false)
    OR public.is_manager_or_admin(auth.uid())
  );

-- Managers can delete questions
CREATE POLICY "Managers can delete questions"
  ON public.staff_qa
  FOR DELETE
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

-- RLS Policies for staff_notifications
-- Users can only see their own notifications
CREATE POLICY "Users can read own notifications"
  ON public.staff_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.staff_notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- System/managers can insert notifications
CREATE POLICY "Managers can insert notifications"
  ON public.staff_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_manager_or_admin(auth.uid()) OR user_id = auth.uid());

-- Trigger for updated_at on club_policies
CREATE TRIGGER update_club_policies_updated_at
  BEFORE UPDATE ON public.club_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on staff_qa
CREATE TRIGGER update_staff_qa_updated_at
  BEFORE UPDATE ON public.staff_qa
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();