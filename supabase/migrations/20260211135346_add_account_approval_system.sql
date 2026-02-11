-- Account Approval System Migration
-- Adds approval workflow for new user accounts with auto-approval for Sling-matched emails

-- 1. Add approval status columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' 
    CHECK (approval_status IN ('pending', 'auto_approved', 'manager_approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_notes text;

-- Create index for approval status queries
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);

-- 2. Create account approval requests table
CREATE TABLE IF NOT EXISTS public.account_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  full_name text,
  requested_roles app_role[],
  justification text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on account_approval_requests
ALTER TABLE public.account_approval_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for account_approval_requests
CREATE POLICY "Users can view their own approval requests"
  ON public.account_approval_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all approval requests"
  ON public.account_approval_requests FOR SELECT
  TO authenticated
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Managers can update approval requests"
  ON public.account_approval_requests FOR UPDATE
  TO authenticated
  USING (is_manager_or_admin(auth.uid()));

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_account_approval_requests_status 
  ON public.account_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_approval_requests_user_id 
  ON public.account_approval_requests(user_id);

-- 3. Update auto_match_sling_user function to set approval status
CREATE OR REPLACE FUNCTION public.auto_match_sling_user()
RETURNS TRIGGER AS $$
DECLARE
  matched_sling_id uuid;
BEGIN
  -- Try to find a matching sling_user by email
  SELECT id INTO matched_sling_id
  FROM public.sling_users
  WHERE LOWER(email) = LOWER(NEW.email)
    AND is_active = true
  LIMIT 1;
  
  -- If found, auto-approve and link to sling
  IF matched_sling_id IS NOT NULL THEN
    NEW.sling_id := matched_sling_id;
    NEW.approval_status := 'auto_approved';
    NEW.approved_at := now();
  ELSE
    -- No Sling match, keep as pending
    NEW.approval_status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Function to map Sling positions to app_role enum
CREATE OR REPLACE FUNCTION public.get_sling_roles_for_user(_sling_id uuid)
RETURNS app_role[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sling_positions text[];
  mapped_roles app_role[];
  pos text;
BEGIN
  -- Get positions array from sling_users
  SELECT positions INTO sling_positions
  FROM public.sling_users
  WHERE id = _sling_id;
  
  IF sling_positions IS NULL THEN
    RETURN ARRAY[]::app_role[];
  END IF;
  
  -- Initialize empty array
  mapped_roles := ARRAY[]::app_role[];
  
  -- Map each position to app_role
  FOREACH pos IN ARRAY sling_positions
  LOOP
    CASE LOWER(pos)
      -- Admin mapping
      WHEN 'admin', 'administrator' THEN
        IF NOT ('admin'::app_role = ANY(mapped_roles)) THEN
          mapped_roles := array_append(mapped_roles, 'admin'::app_role);
        END IF;
      
      -- Manager mapping
      WHEN 'manager', 'general manager', 'operations manager' THEN
        IF NOT ('manager'::app_role = ANY(mapped_roles)) THEN
          mapped_roles := array_append(mapped_roles, 'manager'::app_role);
        END IF;
      
      -- Concierge mapping
      WHEN 'concierge', 'front desk', 'receptionist' THEN
        IF NOT ('concierge'::app_role = ANY(mapped_roles)) THEN
          mapped_roles := array_append(mapped_roles, 'concierge'::app_role);
        END IF;
      
      -- Trainer mapping
      WHEN 'trainer', 'personal trainer', 'fitness trainer', 'instructor' THEN
        IF NOT ('trainer'::app_role = ANY(mapped_roles)) THEN
          mapped_roles := array_append(mapped_roles, 'trainer'::app_role);
        END IF;
      
      -- Female spa attendant mapping
      WHEN 'spa attendant - female', 'female spa attendant', 'spa attendant (female)' THEN
        IF NOT ('female_spa_attendant'::app_role = ANY(mapped_roles)) THEN
          mapped_roles := array_append(mapped_roles, 'female_spa_attendant'::app_role);
        END IF;
      
      -- Male spa attendant mapping
      WHEN 'spa attendant - male', 'male spa attendant', 'spa attendant (male)' THEN
        IF NOT ('male_spa_attendant'::app_role = ANY(mapped_roles)) THEN
          mapped_roles := array_append(mapped_roles, 'male_spa_attendant'::app_role);
        END IF;
      
      -- Floater mapping
      WHEN 'floater', 'float' THEN
        IF NOT ('floater'::app_role = ANY(mapped_roles)) THEN
          mapped_roles := array_append(mapped_roles, 'floater'::app_role);
        END IF;
      
      -- Cafe mapping
      WHEN 'cafe', 'barista', 'cafe attendant' THEN
        IF NOT ('cafe'::app_role = ANY(mapped_roles)) THEN
          mapped_roles := array_append(mapped_roles, 'cafe'::app_role);
        END IF;
      
      ELSE
        -- Unknown position, skip
        NULL;
    END CASE;
  END LOOP;
  
  RETURN mapped_roles;
END;
$$;

-- 5. Function for managers to approve accounts
CREATE OR REPLACE FUNCTION public.manager_approve_account(
  _user_id uuid,
  _approved_roles app_role[],
  _notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_to_insert app_role;
BEGIN
  -- Verify caller is admin or manager
  IF NOT is_manager_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and managers can approve accounts';
  END IF;

  -- Update profile approval status
  UPDATE public.profiles
  SET 
    approval_status = 'manager_approved',
    approved_by = auth.uid(),
    approved_at = now(),
    approval_notes = _notes
  WHERE user_id = _user_id;
  
  -- Insert approved roles (clear existing first)
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  
  FOREACH role_to_insert IN ARRAY _approved_roles
  LOOP
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, role_to_insert)
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
  
  -- Update approval request status if exists
  UPDATE public.account_approval_requests
  SET 
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_notes = _notes
  WHERE user_id = _user_id AND status = 'pending';
END;
$$;

-- 6. Function for managers to reject accounts
CREATE OR REPLACE FUNCTION public.manager_reject_account(
  _user_id uuid,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin or manager
  IF NOT is_manager_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and managers can reject accounts';
  END IF;

  -- Update profile approval status
  -- Note: We reuse approved_by/approved_at fields for rejections to maintain
  -- a simple schema. These fields track "who reviewed" and "when" regardless of outcome.
  UPDATE public.profiles
  SET 
    approval_status = 'rejected',
    approved_by = auth.uid(),
    approved_at = now(),
    approval_notes = _reason
  WHERE user_id = _user_id;
  
  -- Update approval request status if exists
  UPDATE public.account_approval_requests
  SET 
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_notes = _reason
  WHERE user_id = _user_id AND status = 'pending';
END;
$$;

-- 7. Function to get pending approvals (managers only)
CREATE OR REPLACE FUNCTION public.get_pending_approvals()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  requested_roles app_role[],
  sling_id uuid,
  sling_matched boolean,
  suggested_roles app_role[],
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin or manager
  IF NOT is_manager_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and managers can view pending approvals';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.full_name,
    COALESCE(
      (SELECT array_agg(ur.role) FROM public.user_roles ur WHERE ur.user_id = p.user_id),
      ARRAY[]::app_role[]
    ) as requested_roles,
    p.sling_id,
    (p.sling_id IS NOT NULL) as sling_matched,
    CASE 
      WHEN p.sling_id IS NOT NULL THEN public.get_sling_roles_for_user(p.sling_id)
      ELSE ARRAY[]::app_role[]
    END as suggested_roles,
    p.created_at
  FROM public.profiles p
  WHERE p.approval_status = 'pending'
    AND p.onboarding_completed = true
  ORDER BY p.created_at DESC;
END;
$$;

-- 8. Update trigger for account_approval_requests
CREATE TRIGGER update_account_approval_requests_updated_at
BEFORE UPDATE ON public.account_approval_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Add comment for documentation
COMMENT ON COLUMN public.profiles.approval_status IS 
  'Account approval status: pending (awaiting manager), auto_approved (Sling match), manager_approved (manually approved), rejected';
COMMENT ON TABLE public.account_approval_requests IS 
  'Tracks account approval requests and manager reviews';

-- 10. Notification triggers for account approval workflow

-- Function to notify managers when new user signs up (pending approval)
CREATE OR REPLACE FUNCTION public.notify_managers_new_signup()
RETURNS TRIGGER AS $$
DECLARE
  manager_id uuid;
BEGIN
  -- Only notify if status is pending
  IF NEW.approval_status = 'pending' AND NEW.onboarding_completed = true THEN
    -- Create notification for all managers and admins
    FOR manager_id IN 
      SELECT DISTINCT ur.user_id
      FROM public.user_roles ur
      WHERE ur.role IN ('admin', 'manager')
    LOOP
      INSERT INTO public.staff_notifications (
        user_id,
        type,
        title,
        body,
        data
      ) VALUES (
        manager_id,
        'account_approval_pending',
        'New Account Pending Approval',
        NEW.full_name || ' (' || NEW.email || ') has signed up and needs account approval.',
        jsonb_build_object(
          'user_id', NEW.user_id,
          'email', NEW.email,
          'full_name', NEW.full_name
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new signup notifications
CREATE TRIGGER trigger_notify_managers_new_signup
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (OLD.onboarding_completed = false AND NEW.onboarding_completed = true)
EXECUTE FUNCTION public.notify_managers_new_signup();

-- Function to notify user when account is approved
CREATE OR REPLACE FUNCTION public.notify_user_account_approved()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify on status change to approved
  IF OLD.approval_status = 'pending' AND 
     (NEW.approval_status = 'auto_approved' OR NEW.approval_status = 'manager_approved') THEN
    
    INSERT INTO public.staff_notifications (
      user_id,
      type,
      title,
      body,
      data
    ) VALUES (
      NEW.user_id,
      'account_approved',
      'Account Approved',
      'Your account has been approved! You now have access to the system.',
      jsonb_build_object(
        'approval_status', NEW.approval_status,
        'approved_at', NEW.approved_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for approval notifications
CREATE TRIGGER trigger_notify_user_account_approved
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (NEW.approval_status IN ('auto_approved', 'manager_approved'))
EXECUTE FUNCTION public.notify_user_account_approved();

-- Function to notify user when account is rejected
CREATE OR REPLACE FUNCTION public.notify_user_account_rejected()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify on status change to rejected
  IF OLD.approval_status != 'rejected' AND NEW.approval_status = 'rejected' THEN
    
    INSERT INTO public.staff_notifications (
      user_id,
      type,
      title,
      body,
      data
    ) VALUES (
      NEW.user_id,
      'account_rejected',
      'Account Not Approved',
      COALESCE(
        'Your account request was not approved. Reason: ' || NEW.approval_notes,
        'Your account request was not approved. Please contact an administrator for more information.'
      ),
      jsonb_build_object(
        'approval_status', NEW.approval_status,
        'approval_notes', NEW.approval_notes,
        'rejected_at', NEW.approved_at,
        'rejected_by', NEW.approved_by
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for rejection notifications
CREATE TRIGGER trigger_notify_user_account_rejected
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (NEW.approval_status = 'rejected')
EXECUTE FUNCTION public.notify_user_account_rejected();
