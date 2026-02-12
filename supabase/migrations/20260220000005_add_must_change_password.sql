-- Add must_change_password flag to profiles table
-- When an admin/manager resets a user's password, this flag is set to true.
-- On next login, the user is forced to create a new password before proceeding.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
