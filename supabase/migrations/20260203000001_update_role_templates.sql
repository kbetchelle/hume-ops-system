-- ============================================================================
-- Migration: Update Role Checklists to Department/Position Structure
-- Version: 20260203000001
-- Description: Map existing role values to new department/position structure
-- Skip if checklists table does not exist (e.g. dropped by deprecate_old_checklist_tables).
-- ============================================================================

DO $$
DECLARE
  concierge_count INTEGER;
  floater_count INTEGER;
  male_spa_count INTEGER;
  female_spa_count INTEGER;
  cafe_count INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checklists') THEN
    RAISE NOTICE 'Skipping update_role_templates - checklists table does not exist';
    RETURN;
  END IF;

  -- Concierge (department stays as "Concierge", no specific position)
  UPDATE checklists 
  SET 
    department = 'Concierge', 
    position = NULL
  WHERE role = 'concierge'
    AND (department IS NULL OR department != 'Concierge');

  -- Floater (BOH department, Floater position)
  UPDATE checklists 
  SET 
    department = 'BOH', 
    position = 'Floater'
  WHERE role = 'floater'
    AND (department IS NULL OR department != 'BOH' OR position != 'Floater');

  -- Male Spa Attendant (BOH department, specific position)
  UPDATE checklists 
  SET 
    department = 'BOH', 
    position = 'Male Spa Attendant'
  WHERE role = 'male_spa_attendant'
    AND (department IS NULL OR department != 'BOH' OR position != 'Male Spa Attendant');

  -- Female Spa Attendant (BOH department, specific position)
  UPDATE checklists 
  SET 
    department = 'BOH', 
    position = 'Female Spa Attendant'
  WHERE role = 'female_spa_attendant'
    AND (department IS NULL OR department != 'BOH' OR position != 'Female Spa Attendant');

  -- Cafe (Cafe department, no specific position)
  -- Use role::text so this runs even when 'cafe' is not yet in app_role (20260203000002 adds it after this migration).
  UPDATE checklists 
  SET 
    department = 'Cafe', 
    position = NULL
  WHERE role::text = 'cafe'
    AND (department IS NULL OR department != 'Cafe');

  -- Log summary of checklist mapping
  SELECT COUNT(*) INTO concierge_count FROM checklists WHERE department = 'Concierge';
  SELECT COUNT(*) INTO floater_count FROM checklists WHERE department = 'BOH' AND position = 'Floater';
  SELECT COUNT(*) INTO male_spa_count FROM checklists WHERE department = 'BOH' AND position = 'Male Spa Attendant';
  SELECT COUNT(*) INTO female_spa_count FROM checklists WHERE department = 'BOH' AND position = 'Female Spa Attendant';
  SELECT COUNT(*) INTO cafe_count FROM checklists WHERE department = 'Cafe';

  RAISE NOTICE 'Checklist Migration Summary:';
  RAISE NOTICE '  Concierge checklists: %', concierge_count;
  RAISE NOTICE '  Floater checklists (BOH): %', floater_count;
  RAISE NOTICE '  Male Spa Attendant checklists (BOH): %', male_spa_count;
  RAISE NOTICE '  Female Spa Attendant checklists (BOH): %', female_spa_count;
  RAISE NOTICE '  Cafe checklists: %', cafe_count;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
