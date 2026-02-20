-- Extend admin_get_all_users to return username
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
  primary_role app_role,
  username text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    p.user_id, p.email, p.full_name, p.onboarding_completed, p.deactivated, p.created_at,
    COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::app_role[]) AS roles,
    p.primary_role,
    p.username
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  GROUP BY p.user_id, p.email, p.full_name, p.onboarding_completed, p.deactivated, p.created_at, p.primary_role, p.username
  ORDER BY p.created_at DESC
$$;

-- Allow admin/manager to update a user's login username (unique, normalized)
CREATE OR REPLACE FUNCTION public.admin_update_user_username(_target_user_id uuid, _username text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _normalized text;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')) THEN
    RAISE EXCEPTION 'Access denied. Admin or Manager role required.';
  END IF;

  IF _username IS NULL OR trim(_username) = '' THEN
    UPDATE public.profiles SET username = NULL WHERE user_id = _target_user_id;
    RETURN;
  END IF;

  _normalized := lower(trim(regexp_replace(_username, '[^a-zA-Z0-9_]', '', 'g')));
  IF _normalized = '' THEN
    RAISE EXCEPTION 'Username must contain at least one letter or number.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(trim(username)) = _normalized
      AND user_id != _target_user_id
      AND username IS NOT NULL
      AND trim(username) <> ''
  ) THEN
    RAISE EXCEPTION 'Username already in use.';
  END IF;

  UPDATE public.profiles
  SET username = _normalized
  WHERE user_id = _target_user_id;
END;
$$;
