
DROP FUNCTION public.admin_get_all_users();

CREATE OR REPLACE FUNCTION public.admin_get_all_users()
 RETURNS TABLE(user_id uuid, email text, full_name text, onboarding_completed boolean, deactivated boolean, created_at timestamp with time zone, roles app_role[], primary_role app_role, username text, must_change_password boolean, walkthrough_completed_at timestamptz, walkthrough_skipped_at timestamptz)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT
    p.user_id, p.email, p.full_name, p.onboarding_completed, p.deactivated, p.created_at,
    COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::app_role[]) AS roles,
    p.primary_role,
    p.username,
    p.must_change_password,
    ws.completed_at AS walkthrough_completed_at,
    ws.skipped_at AS walkthrough_skipped_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  LEFT JOIN public.user_walkthrough_state ws ON p.user_id = ws.user_id
  GROUP BY p.user_id, p.email, p.full_name, p.onboarding_completed, p.deactivated, p.created_at, p.primary_role, p.username, p.must_change_password, ws.completed_at, ws.skipped_at
  ORDER BY p.created_at DESC
$$;
