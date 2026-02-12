-- Standardize event_drinks.created_by from text to uuid to match
-- other tables (quick_link_groups, resource_pages, etc.) that use
-- uuid REFERENCES auth.users(id).
--
-- Existing text values that are valid UUIDs are preserved via a cast.
-- Non-UUID text values are set to NULL to avoid breaking the FK constraint.

-- 1. Convert existing text values to uuid where possible
ALTER TABLE public.event_drinks
  ALTER COLUMN created_by TYPE uuid
  USING CASE
    WHEN created_by ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN created_by::uuid
    ELSE NULL
  END;

-- 2. Add foreign key constraint
ALTER TABLE public.event_drinks
  ADD CONSTRAINT event_drinks_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- 3. Add index for the foreign key
CREATE INDEX IF NOT EXISTS idx_event_drinks_created_by
  ON public.event_drinks(created_by);
