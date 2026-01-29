-- Add deactivated column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deactivated boolean NOT NULL DEFAULT false;

-- Create admin function to get all users with their roles (bypasses RLS)
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  onboarding_completed boolean,
  deactivated boolean,
  created_at timestamptz,
  roles app_role[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.email,
    p.full_name,
    p.onboarding_completed,
    p.deactivated,
    p.created_at,
    COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::app_role[]) as roles
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  GROUP BY p.user_id, p.email, p.full_name, p.onboarding_completed, p.deactivated, p.created_at
  ORDER BY p.created_at DESC
$$;

-- Create admin function to update user roles
CREATE OR REPLACE FUNCTION public.admin_update_user_roles(_target_user_id uuid, _roles app_role[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First verify caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Delete existing roles for user
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  
  -- Insert new roles
  INSERT INTO public.user_roles (user_id, role)
  SELECT _target_user_id, unnest(_roles);
END;
$$;

-- Create admin function to toggle user deactivation
CREATE OR REPLACE FUNCTION public.admin_toggle_user_deactivation(_target_user_id uuid, _deactivated boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First verify caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Prevent self-deactivation
  IF _target_user_id = auth.uid() AND _deactivated = true THEN
    RAISE EXCEPTION 'Cannot deactivate your own account.';
  END IF;
  
  -- Update deactivated status
  UPDATE public.profiles 
  SET deactivated = _deactivated 
  WHERE user_id = _target_user_id;
END;
$$;