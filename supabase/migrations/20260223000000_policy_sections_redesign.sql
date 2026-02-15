-- Policy Sections Redesign Migration
-- Remove title field, add tags array, remove sort_order fields
-- This migration transforms policies into content sections within categories

-- 1. Add tags column to club_policies (default empty array)
ALTER TABLE public.club_policies 
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- 2. Create GIN index on tags for efficient array searching
CREATE INDEX IF NOT EXISTS idx_club_policies_tags 
  ON public.club_policies USING GIN (tags);

-- 3. Drop title column from club_policies
-- Note: This is a destructive operation. Existing titles will be lost.
-- If you need to preserve titles, migrate them to content or tags before running this.
ALTER TABLE public.club_policies 
  DROP COLUMN IF EXISTS title;

-- 4. Drop sort_order from club_policies
ALTER TABLE public.club_policies 
  DROP COLUMN IF EXISTS sort_order;

-- 5. Drop sort_order from policy_categories
ALTER TABLE public.policy_categories 
  DROP COLUMN IF EXISTS sort_order;

-- Add comments for documentation
COMMENT ON COLUMN public.club_policies.tags IS 'Free-form tags for policy search (not displayed in UI)';
COMMENT ON TABLE public.club_policies IS 'Policy sections organized by category. Policies have no title - content only.';
