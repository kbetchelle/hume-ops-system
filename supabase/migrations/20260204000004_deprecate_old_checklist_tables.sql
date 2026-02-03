-- ============================================================================
-- Migration: Remove Old Checklist Tables
-- Version: 20260204000004
-- Description: Drops old unified checklist tables completely
-- WARNING: This will delete all historical data from the old system
-- ============================================================================

-- Drop old checklist tables (CASCADE will drop dependent objects like foreign keys)
DROP TABLE IF EXISTS checklist_completions CASCADE;
DROP TABLE IF EXISTS checklist_items CASCADE;
DROP TABLE IF EXISTS checklists CASCADE;

-- Drop related tables if they exist
DROP TABLE IF EXISTS checklist_comments CASCADE;
DROP TABLE IF EXISTS checklist_shift_submissions CASCADE;

-- Log removal notice
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Old checklist tables REMOVED';
  RAISE NOTICE 'Deleted tables:';
  RAISE NOTICE '  - checklists';
  RAISE NOTICE '  - checklist_items';
  RAISE NOTICE '  - checklist_completions';
  RAISE NOTICE '  - checklist_comments';
  RAISE NOTICE '  - checklist_shift_submissions';
  RAISE NOTICE '';
  RAISE NOTICE 'Active role-specific tables:';
  RAISE NOTICE '  - concierge_checklists, concierge_checklist_items, concierge_completions';
  RAISE NOTICE '  - boh_checklists, boh_checklist_items, boh_completions';
  RAISE NOTICE '  - cafe_checklists, cafe_checklist_items, cafe_completions';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
