-- ============================================================================
-- Migration: Add 'cafe' to app_role enum
-- Version: 20260203000002
-- Description: Adds the cafe role to the app_role enum type
-- ============================================================================

-- Add 'cafe' to the app_role enum
-- Note: ALTER TYPE ADD VALUE cannot be run in a transaction block in some cases
-- If this fails, run it separately outside a transaction
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cafe';

-- Verify the enum now includes cafe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'cafe' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    RAISE NOTICE 'Successfully added cafe to app_role enum';
  ELSE
    RAISE EXCEPTION 'Failed to add cafe to app_role enum';
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
