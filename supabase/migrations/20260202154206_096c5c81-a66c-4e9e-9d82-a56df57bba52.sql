-- Add sling_id column to profiles table to link users to sling_users
-- We add it to profiles since user_roles is for role assignments (many rows per user)
-- and sling_id is a 1:1 relationship with the user
ALTER TABLE public.profiles 
ADD COLUMN sling_id uuid REFERENCES public.sling_users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_profiles_sling_id ON public.profiles(sling_id);

-- Create a function to auto-match users to sling_users by email on profile creation
CREATE OR REPLACE FUNCTION public.auto_match_sling_user()
RETURNS TRIGGER AS $$
DECLARE
  matched_sling_id uuid;
BEGIN
  -- Try to find a matching sling_user by email
  SELECT id INTO matched_sling_id
  FROM public.sling_users
  WHERE LOWER(email) = LOWER(NEW.email)
  LIMIT 1;
  
  -- If found, update the profile with the sling_id
  IF matched_sling_id IS NOT NULL THEN
    NEW.sling_id := matched_sling_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-match on profile insert
CREATE TRIGGER trigger_auto_match_sling_user
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_match_sling_user();

-- Create a function for admins/managers to manually link users to sling
CREATE OR REPLACE FUNCTION public.admin_link_user_to_sling(
  _user_id uuid,
  _sling_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin or manager
  IF NOT (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and managers can link users to Sling';
  END IF;

  -- Update the profile with the sling_id
  UPDATE public.profiles
  SET sling_id = _sling_id, updated_at = now()
  WHERE user_id = _user_id;
END;
$$;

-- Create a function to get all users with their sling matching info
CREATE OR REPLACE FUNCTION public.admin_get_users_with_sling_info()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  sling_id uuid,
  sling_user_name text,
  sling_email text,
  is_auto_matched boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin or manager
  IF NOT (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and managers can view this data';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.full_name,
    p.sling_id,
    CONCAT(su.first_name, ' ', su.last_name)::text as sling_user_name,
    su.email as sling_email,
    (p.sling_id IS NOT NULL AND LOWER(p.email) = LOWER(su.email)) as is_auto_matched
  FROM public.profiles p
  LEFT JOIN public.sling_users su ON p.sling_id = su.id
  ORDER BY p.full_name, p.email;
END;
$$;

-- Create a function to search sling users for linking
CREATE OR REPLACE FUNCTION public.search_sling_users(_search text)
RETURNS TABLE (
  id uuid,
  sling_user_id integer,
  full_name text,
  email text,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin or manager
  IF NOT (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    su.id,
    su.sling_user_id,
    CONCAT(su.first_name, ' ', su.last_name)::text as full_name,
    su.email,
    su.is_active
  FROM public.sling_users su
  WHERE 
    _search = '' OR
    LOWER(su.email) LIKE '%' || LOWER(_search) || '%' OR
    LOWER(CONCAT(su.first_name, ' ', su.last_name)) LIKE '%' || LOWER(_search) || '%'
  ORDER BY su.last_name, su.first_name
  LIMIT 50;
END;
$$;