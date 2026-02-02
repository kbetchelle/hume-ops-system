-- ============================================================================
-- Migration: Update Role Templates to Department/Position Structure
-- Version: 20260203000001
-- Description: Map existing role values to new department/position structure
-- ============================================================================

-- Concierge (department stays as "Concierge", no specific position)
UPDATE checklist_templates 
SET 
  department = 'Concierge', 
  position = NULL
WHERE role = 'concierge'
  AND (department IS NULL OR department != 'Concierge');

-- Floater (FOH department, Floater position)
UPDATE checklist_templates 
SET 
  department = 'FOH', 
  position = 'Floater'
WHERE role = 'floater'
  AND (department IS NULL OR department != 'FOH' OR position != 'Floater');

-- Male Spa Attendant (BOH department, specific position)
UPDATE checklist_templates 
SET 
  department = 'BOH', 
  position = 'Male Spa Attendant'
WHERE role = 'male_spa_attendant'
  AND (department IS NULL OR department != 'BOH' OR position != 'Male Spa Attendant');

-- Female Spa Attendant (BOH department, specific position)
UPDATE checklist_templates 
SET 
  department = 'BOH', 
  position = 'Female Spa Attendant'
WHERE role = 'female_spa_attendant'
  AND (department IS NULL OR department != 'BOH' OR position != 'Female Spa Attendant');

-- ============================================================================
-- Verify Migration
-- ============================================================================

-- Log summary of template mapping
DO $$
DECLARE
  concierge_count INTEGER;
  floater_count INTEGER;
  male_spa_count INTEGER;
  female_spa_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO concierge_count FROM checklist_templates WHERE department = 'Concierge';
  SELECT COUNT(*) INTO floater_count FROM checklist_templates WHERE department = 'FOH' AND position = 'Floater';
  SELECT COUNT(*) INTO male_spa_count FROM checklist_templates WHERE department = 'BOH' AND position = 'Male Spa Attendant';
  SELECT COUNT(*) INTO female_spa_count FROM checklist_templates WHERE department = 'BOH' AND position = 'Female Spa Attendant';
  
  RAISE NOTICE 'Template Migration Summary:';
  RAISE NOTICE '  Concierge templates: %', concierge_count;
  RAISE NOTICE '  Floater templates: %', floater_count;
  RAISE NOTICE '  Male Spa Attendant templates: %', male_spa_count;
  RAISE NOTICE '  Female Spa Attendant templates: %', female_spa_count;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
