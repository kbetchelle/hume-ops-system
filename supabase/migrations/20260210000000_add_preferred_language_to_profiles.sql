-- Add preferred_language to profiles for EN/ES default (onboarding + in-app toggle)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en'
  CHECK (preferred_language IN ('en', 'es'));

COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred UI language: en (English) or es (Spanish).';
