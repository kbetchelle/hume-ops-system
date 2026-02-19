-- Add primary_role to profiles (nullable; when null, app uses highest-privilege role)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS primary_role app_role NULL;

-- Extend admin_get_all_users to return primary_role (must DROP first when changing return type)
DROP FUNCTION IF EXISTS public.admin_get_all_users();
CREATE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  onboarding_completed boolean,
  deactivated boolean,
  created_at timestamptz,
  roles app_role[],
  primary_role app_role
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
    COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::app_role[]) AS roles,
    p.primary_role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  GROUP BY p.user_id, p.email, p.full_name, p.onboarding_completed, p.deactivated, p.created_at, p.primary_role
  ORDER BY p.created_at DESC
$$;

-- Allow admin or manager to set a user's primary role (must be one of their assigned roles)
CREATE OR REPLACE FUNCTION public.admin_set_primary_role(_target_user_id uuid, _primary_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')) THEN
    RAISE EXCEPTION 'Access denied. Admin or Manager role required.';
  END IF;

  IF _primary_role IS NULL THEN
    UPDATE public.profiles SET primary_role = NULL WHERE user_id = _target_user_id;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _target_user_id AND role = _primary_role
  ) THEN
    RAISE EXCEPTION 'Primary role must be one of the user''s assigned roles.';
  END IF;

  UPDATE public.profiles SET primary_role = _primary_role WHERE user_id = _target_user_id;
END;
$$;

-- When roles are updated, clear primary_role if it is no longer in the new set
CREATE OR REPLACE FUNCTION public.admin_update_user_roles(_target_user_id uuid, _roles app_role[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _target_user_id;

  INSERT INTO public.user_roles (user_id, role)
  SELECT _target_user_id, unnest(_roles);

  UPDATE public.profiles
  SET primary_role = NULL
  WHERE user_id = _target_user_id
    AND primary_role IS NOT NULL
    AND NOT (primary_role = ANY(_roles));
END;
$$;
