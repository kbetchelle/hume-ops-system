-- Add username to profiles for login by username (unique, lowercase)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text NULL;

-- Unique constraint: lowercase for case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (lower(trim(username)))
  WHERE username IS NOT NULL AND trim(username) <> '';

-- Allow anonymous to resolve username -> email for login (returns only email)
CREATE OR REPLACE FUNCTION public.get_email_by_username(_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
BEGIN
  IF _username IS NULL OR trim(_username) = '' THEN
    RETURN NULL;
  END IF;
  SELECT email INTO _email
  FROM public.profiles
  WHERE lower(trim(username)) = lower(trim(_username))
  LIMIT 1;
  RETURN _email;
END;
$$;

COMMENT ON FUNCTION public.get_email_by_username(text) IS
  'Resolve login identifier to email for sign-in. Used when user enters username instead of email. Returns NULL if not found.';

GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO authenticated;
