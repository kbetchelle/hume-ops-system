

-- ========== Migration: 20260204000002_create_cafe_checklist_tables.sql ==========
-- ============================================================================
-- Migration: Create Cafe Checklist Tables
-- Version: 20260204000002
-- Description: Creates role-specific tables for Cafe checklists
-- ============================================================================

-- Cafe Checklists Table
CREATE TABLE IF NOT EXISTS cafe_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  shift_time TEXT NOT NULL CHECK (shift_time IN ('AM', 'PM')),
  is_weekend BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(title, shift_time, is_weekend)
);

-- Cafe Checklist Items Table
CREATE TABLE IF NOT EXISTS cafe_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID REFERENCES cafe_checklists(id) ON DELETE CASCADE,
  task_description TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN (
    'checkbox', 'photo', 'signature', 'free_response', 'short_entry',
    'multiple_choice', 'yes_no', 'header', 'employee'
  )),
  sort_order INTEGER NOT NULL,
  time_hint TEXT,
  category TEXT,
  color TEXT,
  is_high_priority BOOLEAN DEFAULT false,
  required BOOLEAN DEFAULT false,
  label_spanish TEXT,
  is_class_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cafe Completions Table
CREATE TABLE IF NOT EXISTS cafe_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES cafe_checklist_items(id) ON DELETE CASCADE,
  checklist_id UUID REFERENCES cafe_checklists(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  shift_time TEXT NOT NULL,
  completed_by_id UUID,
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  photo_url TEXT,
  note_text TEXT,
  signature_data TEXT,
  submitted_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(item_id, completion_date, shift_time)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cafe_checklists_active ON cafe_checklists(is_active, shift_time, is_weekend);
CREATE INDEX IF NOT EXISTS idx_cafe_items_checklist ON cafe_checklist_items(checklist_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_cafe_completions_date ON cafe_completions(completion_date, shift_time);
CREATE INDEX IF NOT EXISTS idx_cafe_completions_user ON cafe_completions(completed_by_id, completion_date);

-- RLS Policies
ALTER TABLE cafe_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_completions ENABLE ROW LEVEL SECURITY;

-- Managers can do everything
DROP POLICY IF EXISTS "Managers full access to cafe checklists" ON cafe_checklists;
CREATE POLICY "Managers full access to cafe checklists"
  ON cafe_checklists FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('manager', 'admin')));

DROP POLICY IF EXISTS "Managers full access to cafe items" ON cafe_checklist_items;
CREATE POLICY "Managers full access to cafe items"
  ON cafe_checklist_items FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('manager', 'admin')));

-- Cafe staff can view checklists and items
DROP POLICY IF EXISTS "Cafe can view checklists" ON cafe_checklists;
CREATE POLICY "Cafe can view checklists"
  ON cafe_checklists FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'cafe'));

DROP POLICY IF EXISTS "Cafe can view items" ON cafe_checklist_items;
CREATE POLICY "Cafe can view items"
  ON cafe_checklist_items FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'cafe'));

-- Cafe staff can manage their own completions
DROP POLICY IF EXISTS "Cafe can view completions" ON cafe_completions;
CREATE POLICY "Cafe can view completions"
  ON cafe_completions FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('cafe', 'manager', 'admin')));

DROP POLICY IF EXISTS "Cafe can insert completions" ON cafe_completions;
CREATE POLICY "Cafe can insert completions"
  ON cafe_completions FOR INSERT
  WITH CHECK (
    auth.uid() = completed_by_id AND
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'cafe')
  );

DROP POLICY IF EXISTS "Cafe can update own completions" ON cafe_completions;
CREATE POLICY "Cafe can update own completions"
  ON cafe_completions FOR UPDATE
  USING (
    auth.uid() = completed_by_id AND
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'cafe')
  );

-- ============================================================================
-- Migration Complete
-- ============================================================================


-- ========== Migration: 20260204000003_import_checklist_data_from_csv.sql ==========
-- ============================================================================
-- Migration: Import Checklist Data from CSV Files
-- Version: 20260204000003
-- Description: Imports all checklist data from CSV files into role-specific tables
-- Note: This is a large migration - it imports all concierge, BoH, and cafe checklists
-- ============================================================================

-- IMPORTANT: This migration uses the CSV data as a template.
-- Managers can still edit these through the UI after import.
-- IDs from CSV are preserved for reference but UUIDs will be regenerated.

-- ============================================================================
-- CONCIERGE CHECKLISTS IMPORT
-- ============================================================================

-- Note: Due to the large size of this migration (~400+ lines total),
-- this is a template structure. The actual data should be imported programmatically
-- or through a separate data import script after tables are created.

-- This migration creates placeholder entries that managers can then populate
-- through the UI, or you can use a bulk import tool.

-- Example structure for reference:
DO $$
DECLARE
  weekend_pm_id UUID;
  weekend_am_id UUID;
  weekday_am_id UUID;
  weekday_pm_id UUID;
  weekday_opening_id UUID;
  weekday_closing_id UUID;
  weekend_opening_id UUID;
  weekend_closing_id UUID;
BEGIN
  -- Concierge Weekend PM (idempotent: ON CONFLICT DO UPDATE so RETURNING id works when row exists)
  INSERT INTO concierge_checklists (title, shift_time, is_weekend, is_active, description)
  VALUES ('Concierge - Weekend PM', 'PM', true, true, 'Weekend PM shift checklist for concierge')
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active, description = EXCLUDED.description
  RETURNING id INTO weekend_pm_id;
  
  -- Concierge Weekend AM  
  INSERT INTO concierge_checklists (title, shift_time, is_weekend, is_active, description)
  VALUES ('Concierge - Weekend AM', 'AM', true, true, 'Weekend AM shift checklist for concierge')
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active, description = EXCLUDED.description
  RETURNING id INTO weekend_am_id;
  
  -- Concierge Weekday AM
  INSERT INTO concierge_checklists (title, shift_time, is_weekend, is_active, description)
  VALUES ('Concierge - Weekday AM', 'AM', false, true, 'Weekday AM shift checklist for concierge')
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active, description = EXCLUDED.description
  RETURNING id INTO weekday_am_id;
  
  -- Concierge Weekday PM
  INSERT INTO concierge_checklists (title, shift_time, is_weekend, is_active, description)
  VALUES ('Concierge - Weekday PM', 'PM', false, true, 'Weekday PM shift checklist for concierge')
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active, description = EXCLUDED.description
  RETURNING id INTO weekday_pm_id;
  
  -- Concierge Weekday Opening Checklist
  INSERT INTO concierge_checklists (title, shift_time, is_weekend, is_active, description)
  VALUES ('Concierge - Weekday Opening Checklist', 'AM', false, true, 'Opening procedures for weekday AM shift')
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active, description = EXCLUDED.description
  RETURNING id INTO weekday_opening_id;
  
  -- Concierge Weekday Closing Checklist
  INSERT INTO concierge_checklists (title, shift_time, is_weekend, is_active, description)
  VALUES ('Concierge - Weekday Closing Checklist', 'PM', false, true, 'Closing procedures for weekday PM shift')
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active, description = EXCLUDED.description
  RETURNING id INTO weekday_closing_id;
  
  -- Concierge Weekend Opening Checklist
  INSERT INTO concierge_checklists (title, shift_time, is_weekend, is_active, description)
  VALUES ('Concierge - Weekend Opening Checklist', 'AM', true, true, 'Opening procedures for weekend AM shift')
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active, description = EXCLUDED.description
  RETURNING id INTO weekend_opening_id;
  
  -- Concierge Weekend Closing Checklist
  INSERT INTO concierge_checklists (title, shift_time, is_weekend, is_active, description)
  VALUES ('Concierge - Weekend Closing Checklist', 'PM', true, true, 'Closing procedures for weekend PM shift')
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active, description = EXCLUDED.description
  RETURNING id INTO weekend_closing_id;

  RAISE NOTICE 'Created % concierge checklist templates', 8;
END $$;

-- ============================================================================
-- BOH CHECKLISTS IMPORT
-- ============================================================================

DO $$
DECLARE
  floater_weekday_am_id UUID;
  female_spa_weekend_pm_id UUID;
  male_spa_weekday_am_id UUID;
BEGIN
  -- Floater - Weekday AM (idempotent)
  INSERT INTO boh_checklists (title, role_type, shift_time, is_weekend, is_active, description)
  VALUES ('Floater - Weekday AM', 'floater', 'AM', false, true, 'Weekday AM checklist for floater role')
  ON CONFLICT (title, shift_time, is_weekend, role_type) DO UPDATE SET is_active = EXCLUDED.is_active, description = EXCLUDED.description
  RETURNING id INTO floater_weekday_am_id;
  
  -- Female Spa Attendant - Weekend PM (idempotent)
  INSERT INTO boh_checklists (title, role_type, shift_time, is_weekend, is_active, description)
  VALUES ('Female Spa Attendant - Weekend PM', 'female_spa_attendant', 'PM', true, true, 'Weekend PM checklist for female spa attendants')
  ON CONFLICT (title, shift_time, is_weekend, role_type) DO UPDATE SET is_active = EXCLUDED.is_active, description = EXCLUDED.description
  RETURNING id INTO female_spa_weekend_pm_id;
  
  -- Male Spa Attendant - Weekday AM (idempotent)
  INSERT INTO boh_checklists (title, role_type, shift_time, is_weekend, is_active, description)
  VALUES ('Male Spa Attendant - Weekday AM', 'male_spa_attendant', 'AM', false, true, 'Weekday AM checklist for male spa attendants')
  ON CONFLICT (title, shift_time, is_weekend, role_type) DO UPDATE SET is_active = EXCLUDED.is_active, description = EXCLUDED.description
  RETURNING id INTO male_spa_weekday_am_id;

  RAISE NOTICE 'Created % BoH checklist templates', 3;
END $$;

-- ============================================================================
-- CAFE CHECKLISTS IMPORT
-- ============================================================================

DO $$
DECLARE
  cafe_daily_id UUID;
BEGIN
  -- Cafe Daily Checklist (idempotent)
  INSERT INTO cafe_checklists (title, shift_time, is_weekend, is_active, description)
  VALUES ('Cafe Daily Checklist', 'AM', false, true, 'Daily checklist for cafe operations (opening, mid-shift, closing)')
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active, description = EXCLUDED.description
  RETURNING id INTO cafe_daily_id;

  RAISE NOTICE 'Created % cafe checklist template', 1;
END $$;

-- ============================================================================
-- NOTIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Checklist templates created successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Use the Checklist Manager UI to populate items';
  RAISE NOTICE '2. Or run a bulk import script with CSV data';
  RAISE NOTICE '3. CSV files are located in Downloads folder';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================


-- ========== Migration: 20260204000004_deprecate_old_checklist_tables.sql ==========
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


-- ========== Migration: 20260204000005_create_bug_reports_table.sql ==========
-- ============================================================================
-- Migration: Create Bug Reports Table
-- Version: 20260204000005
-- Description: Adds bug reporting functionality for all users
-- ============================================================================

-- Create bug_reports table
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('bug', 'feature', 'ui', 'performance', 'general')),
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  page_url TEXT,
  user_agent TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_user ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created ON bug_reports(created_at DESC);

-- Enable RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can insert their own bug reports
DROP POLICY IF EXISTS "Users can create bug reports" ON bug_reports;
CREATE POLICY "Users can create bug reports"
  ON bug_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can view their own bug reports
DROP POLICY IF EXISTS "Users can view own bug reports" ON bug_reports;
CREATE POLICY "Users can view own bug reports"
  ON bug_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Admins and managers can view all bug reports
DROP POLICY IF EXISTS "Admins can view all bug reports" ON bug_reports;
CREATE POLICY "Admins can view all bug reports"
  ON bug_reports FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('admin', 'manager')
    )
  );

-- RLS Policy: Admins and managers can update bug reports
DROP POLICY IF EXISTS "Admins can update bug reports" ON bug_reports;
CREATE POLICY "Admins can update bug reports"
  ON bug_reports FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles 
      WHERE role IN ('admin', 'manager')
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_bug_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS bug_reports_updated_at ON bug_reports;
CREATE TRIGGER bug_reports_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_reports_updated_at();

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Bug Reports table created successfully';
  RAISE NOTICE 'Users can now report bugs through the app';
  RAISE NOTICE 'Admins/Managers can view and manage reports';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================


-- ========== Migration: 20260204000006_import_csv_checklist_data.sql ==========
-- ============================================================================
-- Migration: Import Checklist Data from CSVs
-- Version: 20260204000006
-- Description: Imports complete checklist data with all items from CSV files
-- Note: Handles duplicate checklist keys by adding suffixes
-- ============================================================================

-- Clear any existing template data (from previous migrations)
TRUNCATE TABLE concierge_completions CASCADE;
TRUNCATE TABLE concierge_checklist_items CASCADE;
DO $$
DECLARE
  conc_cl_1 UUID;
  conc_cl_2 UUID;
  conc_cl_3 UUID;
  conc_cl_4 UUID;
  conc_cl_5 UUID;
  conc_cl_6 UUID;
  conc_cl_7 UUID;
  conc_cl_8 UUID;
  boh_cl_1 UUID;
  boh_cl_2 UUID;
  boh_cl_3 UUID;
  boh_cl_4 UUID;
  boh_cl_5 UUID;
  boh_cl_6 UUID;
  boh_cl_7 UUID;
  boh_cl_8 UUID;
  boh_cl_9 UUID;
  boh_cl_10 UUID;
  boh_cl_11 UUID;
  boh_cl_12 UUID;
  cafe_cl_1 UUID;
BEGIN

  -- CONCIERGE CHECKLISTS (idempotent: ON CONFLICT DO UPDATE so RETURNING id works when row exists)
  INSERT INTO concierge_checklists (title, shift_time, is_weekend, is_active) VALUES ('Concierge - Weekend PM', 'PM', true, true)
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO conc_cl_1;
  INSERT INTO concierge_checklists (title, shift_time, is_weekend, is_active) VALUES ('Concierge - Weekend AM', 'AM', true, true)
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO conc_cl_2;
  INSERT INTO concierge_checklists (title, shift_time, is_weekend, is_active) VALUES ('Concierge - Weekday AM', 'AM', false, true)
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO conc_cl_3;
  INSERT INTO concierge_checklists (title, shift_time, is_weekend, is_active) VALUES ('Concierge - Weekday Opening Checklist', 'AM', false, true)
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO conc_cl_4;
  INSERT INTO concierge_checklists (title, shift_time, is_weekend, is_active) VALUES ('Concierge - Weekday Closing Checklist', 'PM', false, true)
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO conc_cl_5;
  INSERT INTO concierge_checklists (title, shift_time, is_weekend, is_active) VALUES ('Concierge - Weekend Opening Checklist', 'AM', true, true)
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO conc_cl_6;
  INSERT INTO concierge_checklists (title, shift_time, is_weekend, is_active) VALUES ('Concierge - Weekend Closing Checklist', 'PM', true, true)
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO conc_cl_7;
  INSERT INTO concierge_checklists (title, shift_time, is_weekend, is_active) VALUES ('Concierge - Weekday PM', 'PM', false, true)
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO conc_cl_8;

  -- CONCIERGE ITEMS
  INSERT INTO concierge_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('03837217-b16f-42cb-97e0-f253c15cacdd', conc_cl_1, 'Review Weekly Updates & Daily Notes', 'checkbox', 0, '1:00 PM - 2:00 PM', 'gray', false, false, false),
    ('6aaec6b4-53cc-4943-848c-94d556ac3a6c', conc_cl_1, 'Review Upcoming Appointments, Classes, and Timed Tasks', 'checkbox', 1, '1:00 PM - 2:00 PM', 'gray', false, false, false),
    ('a39c6023-02d9-4229-a4e0-13d1e22b5765', conc_cl_1, 'Check Men''s spa: showers, amenities, towels (restock when needed), paper towels, and toilet paper', 'checkbox', 5, '1:00 PM - 2:00 PM', 'gray', false, false, false),
    ('5cd57eec-7a71-441f-9858-d816094a7a9c', conc_cl_1, 'Reset Sauna timer in men''s spa', 'photo', 6, '1:00 PM - 2:00 PM', 'red', false, false, false),
    ('889c6899-f7be-4acb-a7b6-f071b2202058', conc_cl_1, 'Walkthrough', 'checkbox', 7, '1:00 PM - 2:00 PM', 'gray', false, false, false),
    ('6a5aeb14-e386-4a2c-b179-563ef90e8470', conc_cl_1, 'Restock towels on 2nd floor', 'checkbox', 8, '1:00 PM - 2:00 PM', 'gray', false, false, false),
    ('580ae792-e318-4d4c-9d86-4693a671bbd8', conc_cl_1, 'Check Women''s spa: showers, amenities, towels (restock when needed), paper towels, and toilet paper', 'checkbox', 9, '1:00 PM - 2:00 PM', 'gray', false, false, false),
    ('8305ae84-7781-4835-837f-3d90a18868b6', conc_cl_1, 'Reset Sauna timer in women''s spa', 'photo', 10, '1:00 PM - 2:00 PM', 'red', false, false, false),
    ('ddad80dd-0411-4be2-abb2-14967338ced5', conc_cl_1, 'Walkthrough 2: Cardio room towels, tidy stretch areas, 2nd floor towels', 'checkbox', 11, '2:00 PM - 3:00 PM', 'orange', false, false, false),
    ('0a9c6dcd-3358-49a9-a7f6-9fb9cc091b29', conc_cl_1, 'Saturday Only: Check pilates room that all supplies are correct (each basket should have: 1 ball, 2 ankle weights, 2 bala hand weights, and light, medium, and heavy bands) (check N/A if Sunday)', 'photo', 12, '2:00 PM - 3:00 PM', 'orange', false, false, false),
    ('ff03d061-51ae-442c-ba1f-4087f8697ade', conc_cl_1, 'Check rooftop & tidy as needed: kettlebells are tidy, weights put away, mats & class equipment are put away', 'photo', 13, '2:00 PM - 3:00 PM', 'orange', false, false, false),
    ('f3ce3002-49c1-4cf9-8791-170ec46ce20a', conc_cl_1, 'Check women''s spa - all', 'checkbox', 14, '2:00 PM - 3:00 PM', 'orange', false, false, false),
    ('e072054f-222f-41b1-bc61-35f44c6b81d4', conc_cl_1, 'Check men''s spa - all', 'checkbox', 15, '2:00 PM - 3:00 PM', 'orange', false, false, false),
    ('b6576384-6871-484b-9bd1-5427ea595c9d', conc_cl_1, 'Walkthrough 3: 2nd floor towels, tidy main gym floor', 'checkbox', 17, '3:00 PM - 4:00 PM', 'green', false, false, false),
    ('92a78806-e4b2-4873-9790-c6d67f49676e', conc_cl_1, 'Check Men & Women''s spas', 'checkbox', 18, '3:00 PM - 4:00 PM', 'green', false, false, false),
    ('d41d5e5a-ea9c-471c-b72c-43963c5690cb', conc_cl_1, 'Walkthrough', 'checkbox', 19, '4:00 PM - 5:00 PM', 'blue', false, false, false),
    ('a1dbd080-49e1-4cbd-98e9-098444f33e99', conc_cl_1, 'Check recovery room - ensure boots are tidy', 'photo', 20, '4:00 PM - 5:00 PM', 'blue', false, false, false),
    ('86c76e55-ce61-43da-bfc2-a895d7d30e0b', conc_cl_1, 'Ensure all items in recovery room in need of charging are charging', 'photo', 21, '4:00 PM - 5:00 PM', 'blue', false, false, false),
    ('483710f0-ae59-4791-bdef-5ad96c5baa83', conc_cl_1, 'Check mezzanine paper towels & toilet paper & restock if needed', 'photo', 22, '4:00 PM - 5:00 PM', 'blue', false, false, false),
    ('8ea3b5bb-13bd-4c27-a3a4-972e2ef600d9', conc_cl_1, 'Quick check of spas', 'checkbox', 23, '4:00 PM - 5:00 PM', 'blue', false, false, false),
    ('a90ca62a-e888-4f24-99e8-0d759848b6c6', conc_cl_1, 'Breaks MUST be started BY 5:50 PM at the latest OR you MUST clock out for your shift at 7 PM exactly. Please sign if understood. Signature 1', 'signature', 2, '1:00 PM - 2:00 PM', 'gray', false, true, false),
    ('78bd4990-3493-4baa-ba98-cbce7c2b7216', conc_cl_1, 'Breaks MUST be started BY 5:50 PM at the latest OR you MUST clock out for your shift at 7 PM exactly. Please sign if understood. Signature 2', 'signature', 3, '1:00 PM - 2:00 PM', 'gray', false, true, false),
    ('5fc3c4b5-de6b-4782-9fad-d8ce22d22f79', conc_cl_1, 'Men''s Spa', 'short_entry', 26, '5:00 PM - 6:00 PM', 'gray', false, false, false),
    ('af602e97-c311-4767-9026-66d470921ba0', conc_cl_1, 'Women''s Spa', 'short_entry', 27, '5:00 PM - 6:00 PM', 'gray', false, false, false),
    ('9e08f994-032a-40eb-97db-3b7bae3efcc9', conc_cl_1, '6 PM: Begin Closing Checklist', 'photo', 28, '5:00 PM - 6:00 PM', 'gray', false, true, false),
    ('82722b17-061c-47eb-96c9-de9e1c121b92', conc_cl_1, '3:00 - 3:30 PM: Break 1 (unless you are clocking out at 7 PM SHARP)', 'signature', 16, '3:00 PM - 4:00 PM', 'red', false, false, false),
    ('9b2b5a6d-4766-4d71-9d41-564bf43d9326', conc_cl_1, '4:45 PM - 5:15 Break 2 (Unless you are clocking out at 7 PM SHARP)', 'signature', 24, '4:00 PM - 5:00 PM', 'red', false, false, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO concierge_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('269a3a1b-1086-418f-9369-ab7e5d7bfa26', conc_cl_2, '7:00 AM: submit opener checklist & review daily notes', 'checkbox', 0, '7:00 AM - 8:00 AM', 'gray', false, false, false),
    ('6cb3bbbc-23e8-46f7-95e9-930af1d4f125', conc_cl_2, 'Put out IV sign', 'checkbox', 3, '7:00 AM - 8:00 AM', 'gray', false, false, false),
    ('2cf17c7c-f043-44f7-a4dd-614d3775ff39', conc_cl_2, 'Review appointments, classes, and events for the day', 'checkbox', 4, '7:00 AM - 8:00 AM', 'gray', false, false, false),
    ('01a36526-0b4c-46e6-aa99-c6229063ba47', conc_cl_2, 'Walkthrough', 'checkbox', 6, '8:00 AM - 9:00 AM', 'blue', false, false, false),
    ('6f5e1014-c1ac-4bf2-b135-ef59e62fc1e1', conc_cl_2, 'Tidy Stretch Areas & surrounding equipment', 'checkbox', 7, '8:00 AM - 9:00 AM', 'blue', false, false, false),
    ('74724580-07e3-4dca-8895-3c88f0e66b6a', conc_cl_2, 'Restock towels on 2nd floor', 'checkbox', 8, '8:00 AM - 9:00 AM', 'blue', false, false, false),
    ('42c40abb-7d44-4cb9-a3d9-8c6ff79d9c9e', conc_cl_2, 'Check Men''s Spa - water, towels, squeegee floors if needed', 'checkbox', 9, '8:00 AM - 9:00 AM', 'blue', false, false, false),
    ('e69ef06d-412f-42f6-8149-f673745acb91', conc_cl_2, '8:30 AM - turn on Cafe Music', 'checkbox', 10, '8:00 AM - 9:00 AM', 'red', false, true, false),
    ('46fcb5ac-bbd9-4888-a6b0-67f554079336', conc_cl_2, 'Check Women''s Spa - spa water, towels, amenities, open shower doors, check toilet paper, check paper towels', 'checkbox', 13, '9:00 AM - 10:00 AM', 'gray', false, false, false),
    ('12d79ec8-20aa-4d7f-885f-ebc9ebf27ba2', conc_cl_2, 'Walkthrough', 'checkbox', 16, '10:00 AM - 11:00 AM', 'orange', false, false, false),
    ('ead8de0b-fbd5-4a04-aed9-e4182c2aad8e', conc_cl_2, 'Check recovery room for tidiness', 'photo', 17, '10:00 AM - 11:00 AM', 'orange', false, false, false),
    ('968b8d20-4aa2-4de9-a902-231df04ca429', conc_cl_2, 'Check rooftop for tidiness', 'photo', 18, '10:00 AM - 11:00 AM', 'orange', false, false, false),
    ('0641d4fd-a417-4d04-8e8a-7d22ac647887', conc_cl_2, 'Check Men''s Spa - water, towels, paper towels and toilet paper, amenities, squeegee floors if needed', 'checkbox', 19, '10:00 AM - 11:00 AM', 'orange', false, false, false),
    ('949518f8-cbd8-4fe3-bb60-606efd7ec728', conc_cl_2, 'Breaks MUST be started BY 11:20 AM at the latest. Avoid break time from 9:45-10:15. Please sign if understood. Signature 1', 'signature', 1, '7:00 AM - 8:00 AM', 'gray', false, true, false),
    ('93bba249-cb05-46ae-9ce9-755c9a6d2f71', conc_cl_2, 'Breaks MUST be started BY 11:20 AM at the latest. Avoid break time from 9:45-10:15. Please sign if understood. Signature 2', 'signature', 2, '7:00 AM - 8:00 AM', 'gray', false, true, false),
    ('7f3da03e-8b74-48c7-b713-07d7f8926235', conc_cl_2, '8:40-9:10 AM: Break 1', 'signature', 11, '8:00 AM - 9:00 AM', 'red', false, false, false),
    ('986ba1cc-3ee8-4beb-bf36-c01da97429c8', conc_cl_2, '9:30-10 AM: Break 2', 'signature', 14, '9:00 AM - 10:00 AM', 'red', false, false, false),
    ('4089b0bd-8ffb-4893-83a0-c4d0c1bc58ef', conc_cl_2, 'Check Women''s Spa - water, floors, towels, amenities', 'checkbox', 20, '10:00 AM - 11:00 AM', 'orange', false, false, false),
    ('a786ed36-b462-48bd-b65b-9aea2ba42b7d', conc_cl_2, '10:55 AM: Reset high roof music to Gym Nu', 'checkbox', 21, '10:00 AM - 11:00 AM', 'red', false, false, false),
    ('e27fd1ef-9151-4801-bd15-747da41b20a5', conc_cl_2, 'Check in everyone signed up for any workshop or saturday social (check events)', 'checkbox', 23, '11:00 AM - 12:00 PM', 'green', false, false, false),
    ('657b7f4f-6173-49b5-9f48-828c547e3688', conc_cl_2, 'Walkthrough', 'checkbox', 24, '11:00 AM - 12:00 PM', 'green', false, false, false),
    ('bc7d4278-7f21-4a89-899f-d62c4f42af9e', conc_cl_2, 'Check Men''s Spa - water, towels', 'checkbox', 25, '11:00 AM - 12:00 PM', 'green', false, false, false),
    ('9bfa3e45-8ef1-4aa7-a131-fe9166cc2890', conc_cl_2, 'Check Women''s Spa - water, towels', 'checkbox', 26, '11:00 AM - 12:00 PM', 'green', false, false, false),
    ('63b91f37-cc53-4647-b1a6-b9aa74ee014c', conc_cl_2, 'Walkthrough', 'checkbox', 28, '12:00 PM - 1:00 PM', 'gray', false, false, false),
    ('8d0cb30d-4977-4ab3-9a0d-9f1cc5501cd3', conc_cl_2, 'Cardio Room Towels', 'checkbox', 29, '12:00 PM - 1:00 PM', 'gray', false, false, false),
    ('06fe7687-8639-4725-aca7-467235aa7e43', conc_cl_2, 'Check & Tidy Rooftop', 'checkbox', 30, '12:00 PM - 1:00 PM', 'gray', false, false, false),
    ('8da196ed-172b-4ad0-9c18-ddf9a64e1fca', conc_cl_2, 'Check women''s spa - towels, amenities, general tidying, open closed shower doors', 'checkbox', 31, '12:00 PM - 1:00 PM', 'gray', false, false, false),
    ('a81df517-864f-46a6-ae73-6b2ac450e370', conc_cl_2, 'Check men''s spa - towels, amenities, general tidying, open closed shower doors', 'checkbox', 33, '12:00 PM - 1:00 PM', 'gray', false, false, false),
    ('bdafcf06-b45e-4c17-bf0f-fa9248847be1', conc_cl_2, 'Label ALL unlabeled water bottles or other lost and found items and place them in the appropriate lost and found bins', 'checkbox', 35, '12:00 PM - 1:00 PM', 'gray', false, false, false),
    ('dff1ffdc-70de-4c3a-8898-7ccfd47da037', conc_cl_2, 'Ensure all items are answered on Daily Notes', 'employee', 36, '12:00 PM - 1:00 PM', 'gray', false, true, false),
    ('6b84680d-1b3f-4e57-9884-6bb918b1ef22', conc_cl_2, 'Refill Women''s spa water & restock cups', 'checkbox', 32, '12:00 PM - 1:00 PM', 'gray', false, false, false),
    ('c9d7f2b5-ad19-4ca4-af39-d8d4aadb09bf', conc_cl_2, 'Refill Men''s spa water & restock cups', 'checkbox', 34, '12:00 PM - 1:00 PM', 'gray', false, false, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO concierge_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('efc66f4f-008c-41d5-acbe-31e0731e12b6', conc_cl_3, '6 AM – 7 AM', 'checkbox', 0, '5:30 AM - 6:00 AM', 'gray', false, false, false),
    ('15369d33-849a-4e5c-a280-83757ad3e8fe', conc_cl_3, 'Submit opener checklist & review daily notes', 'checkbox', 4, '6:00 AM - 7:00 AM', 'gray', false, false, false),
    ('e17a4c7a-4713-40c6-9fea-a928e3693521', conc_cl_3, 'Open Cardio Room Curtains', 'photo', 8, '7:00 AM - 8:00 AM', 'blue', false, false, false),
    ('3370f102-9246-46a6-841f-8b5ebe720824', conc_cl_3, 'Walkthrough', 'checkbox', 9, '7:00 AM - 8:00 AM', 'blue', false, false, false),
    ('56ec305a-99be-4e7c-87fe-38777d5a4850', conc_cl_3, 'Tidy Stretch Area 2 & surrounding equipment', 'checkbox', 10, '7:00 AM - 8:00 AM', 'blue', false, false, false),
    ('39082cd1-1102-4a9d-b501-1560b22be05a', conc_cl_3, 'Restock towels on 2nd floor & in cardio room', 'checkbox', 11, '7:00 AM - 8:00 AM', 'blue', false, false, false),
    ('f7d6d772-4ed9-4870-b67a-908def2b2abe', conc_cl_3, 'Check women''s spa – water, towels, open closed shower doors, restock vanity as needed', 'checkbox', 12, '7:00 AM - 8:00 AM', 'blue', false, false, false),
    ('fef266eb-7032-4455-9061-6735cefdcc95', conc_cl_3, 'Check Men''s Spa – water, towels, open closed shower doors, restock vanity as needed', 'checkbox', 13, '7:00 AM - 8:00 AM', 'blue', false, false, false),
    ('3cfdc157-aa51-4147-8b39-a70753e957ac', conc_cl_3, '7:30 AM – turn on Cafe Music', 'checkbox', 14, '7:00 AM - 8:00 AM', 'red', false, true, false),
    ('62c2b49f-e3c5-48b0-8c02-3b0519660da3', conc_cl_3, 'Walkthrough: cardio room towels, stretch areas, left side of gym, 2nd floor towels', 'checkbox', 17, '8:00 AM - 9:00 AM', 'orange', false, false, false),
    ('4c3bca76-182d-4617-be0a-01af62ed4b44', conc_cl_3, 'Refill Men''s Spa Water & restock cups', 'checkbox', 18, '8:00 AM - 9:00 AM', 'orange', false, false, false),
    ('4b1a3b51-b943-4568-b04c-f2ccd6e4eb9f', conc_cl_3, 'Refill Women''s Spa Water & restock cups', 'checkbox', 19, '8:00 AM - 9:00 AM', 'orange', false, false, false),
    ('250ff00c-562c-4c43-9e2d-f7528c3724d2', conc_cl_3, 'Ask Carlos if he wants coffee', 'checkbox', 24, '9:00 AM - 10:00 AM', 'green', false, false, false),
    ('1862cb30-7b58-4e95-8f1c-4057e00191ce', conc_cl_3, 'Walkthrough: 2nd floor towels, recovery room (batteries, boots), roof', 'checkbox', 25, '9:00 AM - 10:00 AM', 'green', false, false, false),
    ('a02ef6c8-a2e2-40f0-9ccb-702c582bd8bc', conc_cl_3, 'Check that compression boots are tidy & batteries are fully charged or charging', 'photo', 26, '9:00 AM - 10:00 AM', 'green', false, false, false),
    ('a6f9951c-9b7a-465c-96b9-2cafd60b029a', conc_cl_3, 'Check linen baskets in private recovery room. If full, bring to front desk and inform BOH', 'checkbox', 27, '9:00 AM - 10:00 AM', 'green', false, false, false),
    ('91fa221b-28f3-44d9-a32b-7f3858035e92', conc_cl_3, 'Rooftop: Check for dirty towels & overall tidiness', 'checkbox', 28, '9:00 AM - 10:00 AM', 'green', false, false, false),
    ('8aa4b0f7-b087-4913-8764-8bafab8dd881', conc_cl_3, 'Check Men''s Spa – water, towels, showers, amenities', 'checkbox', 29, '9:00 AM - 10:00 AM', 'green', false, false, false),
    ('0c4c8f1f-3d7a-4cdb-ab7a-af5a079f4517', conc_cl_3, 'Check Women''s Spa – water, towels, showers, amenities', 'checkbox', 30, '9:00 AM - 10:00 AM', 'green', false, false, false),
    ('59c6f294-64c1-46c7-ba91-5e14de6288fe', conc_cl_3, 'Walkthrough - all', 'checkbox', 34, '10:00 AM - 11:00 AM', 'blue', false, false, false),
    ('5229c3e3-fe21-416d-9cd8-b535bed18398', conc_cl_3, 'Check Men''s Spa – water, towels, floors, amenities', 'checkbox', 35, '10:00 AM - 11:00 AM', 'blue', false, false, false),
    ('f002df7d-84fa-4a4b-9a5b-afe3f0019161', conc_cl_3, 'Check Women''s Spa – water, towels, floors, amenities', 'checkbox', 36, '10:00 AM - 11:00 AM', 'blue', false, false, false),
    ('788918a7-5133-41f3-91c9-beba21d846d9', conc_cl_3, 'Walkthrough', 'checkbox', 39, '11:00 AM - 12:00 PM', 'gray', false, false, false),
    ('18d12e54-7f25-4788-9b4b-46fb056614d5', conc_cl_3, 'Check Women''s spa – towels, amenities, floors, refill spa water & restock cups', 'checkbox', 40, '11:00 AM - 12:00 PM', 'gray', false, false, false),
    ('c9f9a94c-ddad-4fcc-b89d-dd17680fb022', conc_cl_3, 'Check messages: emails & arketa', 'checkbox', 6, '6:00 AM - 7:00 AM', 'gray', false, false, false),
    ('9c7375ff-5c68-4300-ac6d-f444b7ee0c80', conc_cl_3, '7:50 Reset Rooftop Music to Gym Nu (Spotify) - Tuesday, Thursday, Friday', 'checkbox', 15, '7:00 AM - 8:00 AM', 'red', false, false, false),
    ('cc2a9e88-83f5-4998-9180-6b4e2f63616b', conc_cl_3, 'Breaks MUST be started BY 10:20 AM at the latest. Avoid break time from 9:45-10:15. Please sign if understood. Signature 1', 'signature', 1, '6:00 AM - 7:00 AM', 'gray', false, true, false),
    ('1679a85b-809a-4d66-b148-db37455d384c', conc_cl_3, 'Breaks MUST be started BY 10:20 AM at the latest. Avoid break time from 9:45-10:15. Please sign if understood. Signature 2', 'signature', 2, '6:00 AM - 7:00 AM', 'gray', false, true, false),
    ('52d3426c-53ff-444c-9948-392ad601e1a6', conc_cl_3, '8:20 - 8:50: Break 1. Signature of who took break', 'signature', 20, '8:00 AM - 9:00 AM', 'red', false, false, false),
    ('34fbe44a-ac99-451f-a960-c05bf32a9136', conc_cl_3, 'Restock all towel pyramids in women''s spa (1 pyramid on each vanity of small towels with a base of 5; 1 medium towel pyramid on cabinets with base of 5)', 'checkbox', 41, '11:00 AM - 12:00 PM', 'gray', false, false, false),
    ('d93fe53a-dcbd-4223-ba31-00967fe61fa6', conc_cl_3, 'Check Men''s Spa – water, towels, floors, amenities, refill spa water & restock cups', 'checkbox', 42, '11:00 AM - 12:00 PM', 'gray', false, false, false),
    ('94702ffa-db14-49bd-876e-e7550b087150', conc_cl_3, 'Restock all towel pyramids in men''s spa (medium towels, base of 4)', 'checkbox', 43, '11:00 AM - 12:00 PM', 'gray', false, false, false),
    ('8abef57f-0592-48a6-b880-cbe5f07dd7df', conc_cl_3, 'Restock towel pyramids on 2nd floor', 'photo', 44, '11:00 AM - 12:00 PM', 'gray', false, false, false),
    ('0e2d58a3-bfa8-427b-a48f-91916f9dc4ec', conc_cl_3, 'Restock towel pyramids in cardio room', 'photo', 45, '11:00 AM - 12:00 PM', 'gray', false, false, false),
    ('0d7d7e8d-9540-4a76-bca2-dac3eccba55d', conc_cl_3, 'Walkthrough', 'checkbox', 47, '12:00 PM - 1:00 PM', 'blue', false, false, false),
    ('5cc94338-f59f-4110-889a-0161c8040571', conc_cl_3, 'Check paper towels & toilet paper in Men''s Spa & refill spa water', 'checkbox', 48, '12:00 PM - 1:00 PM', 'blue', false, false, false),
    ('49aad5fd-aa00-479f-bd0a-48e76f09962f', conc_cl_3, 'Check temperature of both cold plunges in men''s spa & record here. Let BOH know to add ice if needed', 'short_entry', 49, '12:00 PM - 1:00 PM', 'blue', false, false, false),
    ('ad932d41-6aa8-431e-9d46-49fe4ba2355d', conc_cl_3, 'Check paper towels & toilet paper in Women''s Spa & refill spa water', 'checkbox', 50, '12:00 PM - 1:00 PM', 'blue', false, false, false),
    ('bf0d8f4a-e163-4a4e-9ffc-9875b11fd6f5', conc_cl_3, 'Check temperature of both cold plunges in women''s spa & record here. Let BOH know to add ice if needed', 'short_entry', 51, '12:00 PM - 1:00 PM', 'blue', false, false, false),
    ('61561e61-fa28-481b-9816-0cba141ddb3c', conc_cl_3, 'Restock towel pyramids on 2nd floor & in cardio room', 'checkbox', 52, '12:00 PM - 1:00 PM', 'blue', false, false, false),
    ('791dc574-9576-41e6-8c03-9f294f9adf38', conc_cl_3, 'WEEKLY TASK: Mon-check lmnt & cymbiotika | Tue-lost clothes | Wed-water bottles dates | Thu-guest/member policy cards | Fri-oxygen masks/disposable sheets', 'multiple_choice', 53, '12:00 PM - 1:00 PM', 'blue', false, false, false),
    ('18d315f4-4daa-412f-9830-8e018d4d4e1a', conc_cl_3, 'Complete final walkthrough', 'checkbox', 55, '1:00 PM - 2:00 PM', 'green', false, false, false),
    ('22e9858a-c542-4dbc-a416-384a2b86f920', conc_cl_3, 'Ensure all items are answered on Daily Notes', 'checkbox', 57, '1:00 PM - 2:00 PM', 'green', false, true, false),
    ('b6fc0841-cc67-4290-ad1b-f7cacacd8951', conc_cl_3, 'Review upcoming appointments, tours, and tasks for the day', 'checkbox', 5, '6:00 AM - 7:00 AM', 'gray', false, false, false),
    ('4975d379-a496-46b4-b8a6-f909fe9b9368', conc_cl_3, '8:50 Reset Rooftop Music to Gym Nu (Spotify) - Friday', 'checkbox', 21, '8:00 AM - 9:00 AM', 'red', false, false, false),
    ('5cb1a36f-5235-485c-90f5-b31f08ccb549', conc_cl_3, '9:00 AM – Reset Rooftop Music to HUME Gym Nu -Monday, Wednesday', 'checkbox', 23, '9:00 AM - 10:00 AM', 'red', false, false, false),
    ('a280741b-d42d-4b7b-a449-19c7ec5f1c94', conc_cl_3, '10:25: Reset Rooftop Music to HUME Gym Nu -Tuesday, Thursday', 'checkbox', 33, '10:00 AM - 11:00 AM', 'red', false, false, false),
    ('e2015fa2-301a-4e7e-bc88-620cd491fa6c', conc_cl_3, '10:20-10:50 AM: Break 2. Signature of who took break', 'signature', 37, '10:00 AM - 11:00 AM', 'red', false, false, false),
    ('c3ba48fc-a81b-40ba-95c4-59daa7b549fa', conc_cl_3, 'TUESDAY ONLY: If not already collected by BOH, take the DIRTY clothes from lost and found to the office to be washed. Move CLEAN clothes to the "to be donated" shelf', 'checkbox', 31, '9:00 AM - 10:00 AM', 'green', false, false, false),
    ('3533db16-abd2-42ed-9108-6e4ce45b6838', conc_cl_3, 'Label ALL unlabeled water bottles or other lost and found items and place them in the appropriate lost and found bins', 'checkbox', 56, '1:00 PM - 2:00 PM', 'green', false, false, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO concierge_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('49f95afd-d5c1-4e23-9d49-5e6d46496365', conc_cl_4, 'Unlock & Open Patio Doors', 'checkbox', 1, NULL, 'blue', false, false, false),
    ('2314b921-a6a9-443c-bcc8-1e44e315ff50', conc_cl_4, 'Walk Through All Floors to Ensure Tidiness', 'checkbox', 2, NULL, 'blue', false, false, false),
    ('72112685-86f5-415a-b42d-d2254d511474', conc_cl_4, '5:40 AM: Turn on Ground Floor Studio Heat & set both Thermostats to Max', 'checkbox', 3, NULL, 'red', false, false, false),
    ('58f01e33-6198-4848-984b-b9a22c7c7af9', conc_cl_4, '5:45 AM - Check Men''s Sauna is On', 'checkbox', 4, NULL, 'red', false, false, false),
    ('cde01e28-3d27-46b8-bfe9-80d27707fc45', conc_cl_4, '5:45 AM - Check Women''s Sauna is On', 'checkbox', 5, NULL, 'red', false, false, false),
    ('bfb8866c-1c06-4699-af08-f1e786657875', conc_cl_4, 'Take a photo of temperature & cleanliness of both women''s cold plunges', 'photo', 6, NULL, 'blue', false, false, false),
    ('2b2ff514-f120-4cbb-9145-bb463bd95de4', conc_cl_4, 'Take a photo of temperature & cleanliness of both men''s cold plunges', 'photo', 7, NULL, 'blue', false, false, false),
    ('f416c405-9f50-4fe7-bd69-1c21954801ee', conc_cl_4, 'Display Theraguns on Cabinets & Move Charged Compression Boot Batteries', 'photo', 9, NULL, 'blue', false, false, false),
    ('df07f6fc-3abf-4b50-a472-578ecf4db4ec', conc_cl_4, 'Check that HBOT has clean sheets & is set for first appointment', 'checkbox', 10, NULL, 'blue', false, false, false),
    ('0d729822-e9c1-48dd-8b3b-17a12217e750', conc_cl_4, 'Uncover rooftop equipment and place tarps behind wall', 'photo', 11, NULL, 'blue', false, false, false),
    ('a9465b12-dbda-45cf-9ab5-47a9ec33b26b', conc_cl_4, 'Set Out Ipads & Bring Iphone to Desk', 'checkbox', 12, NULL, 'blue', false, false, false),
    ('d6db14ca-4599-48ab-9775-244a30f9724e', conc_cl_4, '5:55 AM - Turn on Music in Spa, Main Gym Floor, Lockers', 'checkbox', 13, NULL, 'red', false, false, false),
    ('3d40b546-aec8-4747-b8b7-b5fc3dac53fc', conc_cl_4, 'Was anything missed during Close?', 'short_entry', 14, NULL, 'blue', false, false, false),
    ('eb39bb4c-9eab-46fd-bb41-36c2647ed1e8', conc_cl_4, 'Set Up Spa Water in Men & Women''s', 'checkbox', 8, NULL, 'blue', false, false, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO concierge_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('f61b613c-ace0-4147-a8a7-9d3b06cc7334', conc_cl_5, 'Check that stretch area boxes are tidy', 'photo', 12, NULL, 'orange', false, false, false),
    ('16e84ca3-684f-4697-a2cc-19dd5e6dc6fc', conc_cl_5, 'Cardio Room & Men''s Spa: close curtains', 'checkbox', 1, NULL, 'blue', false, false, false),
    ('a7de450a-9962-42af-9097-d38362c1919a', conc_cl_5, 'Dump men''s spa water and rinse out jug', 'checkbox', 2, NULL, 'blue', false, false, false),
    ('d252635e-10ea-4e3d-afba-a0a2c18b1e34', conc_cl_5, 'Full stock of towels in cardio room', 'photo', 3, NULL, 'blue', false, false, false),
    ('5dee17c9-22bf-4ade-a188-bd7d556fbbde', conc_cl_5, 'Check that all towels (rolled and folded) are fully stocked in Men''s spa', 'photo', 4, NULL, 'blue', false, false, false),
    ('340893e1-67aa-4170-b44d-f0662d844192', conc_cl_5, 'Check that men''s vanity is fully stocked-- note if otherwise', 'checkbox', 5, NULL, 'blue', false, false, false),
    ('ba0ad04c-cc1f-444a-9ec5-918d2300cb03', conc_cl_5, 'Turn off men''s sauna at 8:30 PM and ask any lingering members to exit', 'checkbox', 6, NULL, 'blue', false, false, false),
    ('dbe917ea-6773-4432-b4e4-ad57035f2fbb', conc_cl_5, 'Check all men''s lockers for forgotten items & reset locked lockers', 'checkbox', 7, NULL, 'blue', false, false, false),
    ('3bdd55f3-8263-44b5-a607-77f2739ed305', conc_cl_5, 'Main Gym Floor Tasks:', 'checkbox', 8, NULL, 'orange', false, false, false),
    ('6e14eb00-094e-4d57-b3d9-502feefb6fb9', conc_cl_5, 'Full stock of towels on second floor shelf', 'photo', 9, NULL, 'orange', false, false, false),
    ('3c3cc811-8cd5-4b8c-9e87-bc5c0452f408', conc_cl_5, 'Check theraguns & other equipment in stretch area 1 are charging', 'photo', 10, NULL, 'orange', false, false, false),
    ('b870ab70-b676-47e2-94d5-72fa55faebe8', conc_cl_5, 'Check theraguns & other equipment in stretch area 2 are charging', 'photo', 11, NULL, 'orange', false, false, false),
    ('57e2b4ee-8635-4294-8aa4-a1334d14786b', conc_cl_5, 'Women''s Spa Tasks:', 'checkbox', 13, NULL, 'gray', false, false, false),
    ('e680cf2f-efd1-4891-8221-1aafa2dde4f1', conc_cl_5, 'Dump women''s spa water and rinse out jug', 'checkbox', 14, NULL, 'gray', false, false, false),
    ('4aace15c-a9df-422e-8f8d-c780d08df744', conc_cl_5, 'Check that all towels are fully stocked in Women''s spa', 'photo', 15, NULL, 'gray', false, false, false),
    ('bfc578c5-b77e-497a-b250-c019c2490604', conc_cl_5, 'Check all women''s lockers for forgotten items & reset locked lockers', 'checkbox', 17, NULL, 'gray', false, false, false),
    ('7dbd7946-51df-46f0-aa79-dc27b886fbd7', conc_cl_5, 'Check that both vanities in women''s spa are fully stocked', 'checkbox', 18, NULL, 'gray', false, false, false),
    ('e7b0939e-457e-42fe-8f93-d4ecc7e2b58e', conc_cl_5, 'Ensure BOTH thermostats are turned off in the heated room (including AC)', 'checkbox', 19, NULL, 'gray', false, false, false),
    ('db531c1d-dbdd-4e30-b527-7c5d9a59495c', conc_cl_5, 'Recovery Room Tasks:', 'checkbox', 20, NULL, 'green', false, false, false),
    ('360a5d18-9dcf-4a47-b9c6-9824dd542051', conc_cl_5, 'Set batteries, theraguns, and black massage wraps on chargers', 'photo', 21, NULL, 'green', false, false, false),
    ('b06dc77d-080f-4548-bd01-60307e7657f3', conc_cl_5, 'Ensure compression boots are tidy', 'checkbox', 22, NULL, 'green', false, false, false),
    ('a5d41bac-25bc-4059-b4c3-c5164ef127fc', conc_cl_5, 'Final 10 Minutes:', 'checkbox', 23, NULL, 'blue', false, false, false),
    ('c42da3be-bb38-4215-b473-f860b1f9767c', conc_cl_5, 'Close & lock all patio doors', 'checkbox', 24, NULL, 'blue', false, false, false),
    ('0aebd813-f648-4f84-95b2-5f5c4938dbc0', conc_cl_5, 'Ensure ALL members have left', 'checkbox', 25, NULL, 'blue', false, false, false),
    ('fc5c6a0f-b738-4970-a90d-ba75910792da', conc_cl_5, 'Turn off Music at 8:50', 'checkbox', 26, NULL, 'blue', false, false, false),
    ('7e2add6a-e4b8-493c-9749-f395b0a72d91', conc_cl_5, 'Place Ipads & phone on chargers', 'checkbox', 27, NULL, 'blue', false, false, false),
    ('7b660a46-e599-4d80-9f0b-19179cd2b4f4', conc_cl_5, 'Lock the front door gate upon exit - important!!', 'checkbox', 28, NULL, 'blue', false, false, false),
    ('d51e2449-e09f-4257-b63c-a796d238b5b2', conc_cl_5, 'Turn off women''s sauna at 8:45 PM and ask any lingering members to exit', 'checkbox', 16, NULL, 'gray', false, false, false),
    ('f48c6a33-fa95-46e8-866f-8aa353bea14d', conc_cl_5, 'Impact room sliding doors must be locked', 'checkbox', 29, NULL, 'red', true, true, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO concierge_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('eea418fc-c723-4275-92ff-de85c256a89d', conc_cl_6, 'Walk Through All Floors to Ensure Tidiness', 'checkbox', 1, NULL, 'blue', false, false, false),
    ('c99f460b-6cba-4225-8869-5efd2a266f7c', conc_cl_6, 'Unlock & Open Patio Doors', 'checkbox', 2, NULL, 'blue', false, false, false),
    ('a2716817-6caa-4f9d-b03c-cb8e20919886', conc_cl_6, '6:40 AM - Turn on Ground Floor Studio Heat & set both Thermostats to Max', 'checkbox', 3, NULL, 'red', false, false, false),
    ('3115d65d-0df0-4564-aba3-871b19db556b', conc_cl_6, '6:45 AM - Check Men''s Sauna is On', 'checkbox', 4, NULL, 'red', false, false, false),
    ('374f3d7a-aff4-4ba9-ba60-4002c0b5e712', conc_cl_6, '6:45 AM - Check Women''s Sauna is On', 'checkbox', 5, NULL, 'red', false, false, false),
    ('d7dc756d-b478-4143-93eb-33389969d59e', conc_cl_6, 'Display Theraguns on Cabinets & Move Charged Compression Boot Batteries', 'photo', 9, NULL, 'blue', false, false, false),
    ('ec898016-4d94-4de1-8a47-ab15b6211b4b', conc_cl_6, 'Check that HBOT has clean sheets & is set for first appointment', 'checkbox', 10, NULL, 'blue', false, false, false),
    ('f26e05a6-a225-446c-b85a-ba8548dcf810', conc_cl_6, '6:55 AM - Set Out Ipads & Bring Iphone to Desk. Check volume is on', 'checkbox', 12, NULL, 'blue', false, false, false),
    ('52993cd3-940c-4565-8e8d-e4e5ff18d785', conc_cl_6, '6:55 AM - Turn on Music in Spa, Main Gym Floor, Lockers', 'checkbox', 13, NULL, 'red', false, false, false),
    ('4a713aab-8484-4a8f-a228-82544c995e9f', conc_cl_6, 'Was anything missed during Close?', 'short_entry', 14, NULL, 'blue', false, false, false),
    ('9fdc650c-40c0-46d6-b61f-e561a71d8fbc', conc_cl_6, 'Check temperature & cleanliness of men''s cold tubs', 'short_entry', 7, NULL, 'blue', false, false, false),
    ('2cf13887-3257-4222-8334-ac9ebd423b7d', conc_cl_6, 'Set Up Spa Water in Men & Women''s', 'checkbox', 8, NULL, 'blue', false, false, false),
    ('ef7e256f-20cc-4e4a-8389-0ff4d885eedd', conc_cl_6, 'Uncover rooftop equipment and place tarps behind wall', 'checkbox', 11, NULL, 'blue', false, false, false),
    ('13a6b01e-e39a-4b2d-9224-836f0ee728c3', conc_cl_6, 'Check temperature & cleanliness of women''s cold tubs', 'short_entry', 6, NULL, 'blue', false, false, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO concierge_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('458c8373-8297-4116-9076-34ea641ff235', conc_cl_7, 'Cardio Room & Men''s Spa: close curtains', 'checkbox', 1, NULL, 'blue', false, false, false),
    ('2bad2f92-db8b-4149-a68a-cc2a6bbf0dca', conc_cl_7, 'Dump men''s spa water and rinse out jug', 'checkbox', 2, NULL, 'blue', false, false, false),
    ('f355c350-84fc-4084-8ea9-d8752cad8793', conc_cl_7, 'Full stock of towels in cardio room', 'photo', 3, NULL, 'blue', false, false, false),
    ('816a6707-c309-4e48-8b2b-612b29f2ee62', conc_cl_7, 'Check that all towels (rolled and folded) are fully stocked in Men''s spa', 'photo', 4, NULL, 'blue', false, false, false),
    ('9f07ef83-b80a-475c-bdfb-1a955d3a9c7c', conc_cl_7, 'Check that men''s vanity is fully stocked-- note if otherwise', 'checkbox', 5, NULL, 'blue', false, false, false),
    ('e01d18e0-c029-4503-8599-f7949987d08e', conc_cl_7, 'Turn off men''s sauna at 6:30 PM and ask any lingering members to exit', 'checkbox', 6, NULL, 'blue', false, false, false),
    ('57e30343-729b-4521-862d-416f2a20bf7a', conc_cl_7, 'Check all men''s lockers for forgotten items & reset locked lockers', 'checkbox', 7, NULL, 'blue', false, false, false),
    ('5f5a9b9e-94a3-4a44-98e8-aab6bc87e66f', conc_cl_7, 'Main Gym Floor Tasks:', 'checkbox', 8, NULL, 'orange', false, false, false),
    ('bdb546d9-1a4e-479a-b8e2-7e05e1373725', conc_cl_7, 'Full stock of towels on second floor shelf', 'photo', 9, NULL, 'orange', false, false, false),
    ('42725de7-ec7f-47c0-bdca-3ed2f40a475e', conc_cl_7, 'Check theraguns & other equipment in stretch area 1 are charging', 'photo', 10, NULL, 'orange', false, false, false),
    ('cc90c644-e793-4051-984a-003236bea723', conc_cl_7, 'Check theraguns & other equipment in stretch area 2 are charging', 'photo', 11, NULL, 'orange', false, false, false),
    ('4e54b4b6-05ac-47fd-965c-720a0d2d5f02', conc_cl_7, 'Check that stretch area boxes are tidy', 'checkbox', 12, NULL, 'orange', false, false, false),
    ('741da869-4052-41cb-b301-a49da3c9d8d8', conc_cl_7, 'Women''s Spa Tasks:', 'checkbox', 13, NULL, 'gray', false, false, false),
    ('83a40e04-3e20-4909-a579-bca4b47e504d', conc_cl_7, 'Dump women''s spa water and rinse out jug', 'checkbox', 14, NULL, 'gray', false, false, false),
    ('ee7ee6bc-3281-4367-84df-e46f01cf18cc', conc_cl_7, 'Check that all towels are fully stocked in Women''s spa', 'photo', 15, NULL, 'gray', false, false, false),
    ('ee140d76-7bb7-408e-a71a-14aac52747bc', conc_cl_7, 'Turn off women''s sauna at 6:30 PM and ask any lingering members to exit', 'checkbox', 16, NULL, 'gray', false, false, false),
    ('1835adaa-10e2-4417-a832-7be6fa74e529', conc_cl_7, 'Check all women''s lockers for forgotten items & reset locked lockers', 'checkbox', 17, NULL, 'gray', false, false, false),
    ('ec0d4bba-f9c3-424e-83bd-06657af53f30', conc_cl_7, 'Check that both vanities in women''s spa are fully stocked', 'checkbox', 18, NULL, 'gray', false, false, false),
    ('f4527e6f-0ffa-4a2b-ba46-1c4f0b0236c7', conc_cl_7, 'Ensure BOTH thermostats are turned off in the heated room (including AC)', 'checkbox', 19, NULL, 'gray', false, false, false),
    ('e9e210ee-b98a-4463-8584-f3aa920de972', conc_cl_7, 'Recovery Room Tasks:', 'checkbox', 20, NULL, 'green', false, false, false),
    ('098d589e-6ad4-4229-9769-6fc8e0792065', conc_cl_7, 'Set batteries, theraguns, and black massage wraps on chargers', 'photo', 21, NULL, 'green', false, false, false),
    ('77621d4d-ef93-41c9-8be0-7fa061e2de19', conc_cl_7, 'Ensure compression boots are tidy', 'checkbox', 22, NULL, 'green', false, false, false),
    ('d4e85b84-5ed0-4809-8589-df3391e19c3e', conc_cl_7, 'Final 10 Minutes:', 'checkbox', 23, NULL, 'blue', false, false, false),
    ('cbb257b0-86a0-468d-9033-7e37cec60eec', conc_cl_7, 'Close & lock all patio doors', 'checkbox', 24, NULL, 'blue', false, false, false),
    ('0b3d299d-2600-444a-ba07-32fed925c4a9', conc_cl_7, 'Ensure ALL members have left', 'checkbox', 25, NULL, 'blue', false, false, false),
    ('459a5592-80cf-4f73-897b-df72f2d7f1cf', conc_cl_7, 'Turn off Music at 6:50', 'checkbox', 26, NULL, 'blue', false, false, false),
    ('c3f86d6a-3173-4887-b90d-a5605ab59cce', conc_cl_7, 'Place Ipads & phone on chargers', 'checkbox', 27, NULL, 'blue', false, false, false),
    ('5cdb0183-0edf-44f6-96f3-b8eaf447a3a8', conc_cl_7, 'Lock the front door gate upon exit - important!!', 'checkbox', 28, NULL, 'blue', false, false, false),
    ('a66b6306-f916-4f4a-9d93-b3be8b5ffd70', conc_cl_7, 'Impact room sliding doors must be locked', 'checkbox', 29, NULL, 'red', true, true, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO concierge_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('3f864a5d-f16b-4359-8d2a-e25849ef8ac7', conc_cl_8, 'Check Men''s Spa Water & restock cups, roll towels, check for tidiness, and open all unoccupied shower doors to aerate', 'checkbox', 5, '2:00 PM - 3:00 PM', 'purple', false, false, false),
    ('83faba7b-bb5d-4275-b5f4-c3b90ba6faed', conc_cl_8, 'Reset Sauna timer in men''s spa', 'photo', 6, '2:00 PM - 3:00 PM', 'purple', false, false, false),
    ('6871b3a3-e1ea-45f7-9ec0-4c1b11dbb001', conc_cl_8, 'Check Women''s Spa Water & restock cups, roll towels, check for tidiness, and open all unoccupied shower doors to aerate', 'checkbox', 7, '2:00 PM - 3:00 PM', 'purple', false, false, false),
    ('1f870d24-7c46-4a60-8f9b-62a7662f51d9', conc_cl_8, 'Reset Sauna timer in women''s spa', 'photo', 8, '2:00 PM - 3:00 PM', 'purple', false, false, false),
    ('fa37a022-b218-4a92-a27d-1b91ca8add33', conc_cl_8, 'Walkthrough - Tidy Stretch Area 2 & surrounding equipment', 'yes_no', 9, '2:00 PM - 3:00 PM', 'purple', false, false, false),
    ('287004e9-a9c0-48f3-948a-a7e18c4e46c5', conc_cl_8, 'Restock towel pyramids on 2nd floor & cardio room', 'checkbox', 10, '2:00 PM - 3:00 PM', 'purple', false, false, false),
    ('cc192ff3-7cef-4c5e-968f-d266c0a2733d', conc_cl_8, 'WEEKLY TASK: Mon-dust retail shelves | Tue-lost clothes from BOH | Wed-pillow cases behind HBOT | Thu-dust retail shelves | Fri-restock office supplies', 'multiple_choice', 11, '2:00 PM - 3:00 PM', 'purple', false, false, false),
    ('8086f4d1-422e-4294-8cda-3b6311dc7768', conc_cl_8, 'Check Men''s Spa', 'checkbox', 14, '3:00 PM - 4:00 PM', 'yellow', false, false, false),
    ('1b8b1186-6eae-4ac0-b5e0-73bc9ddc4af9', conc_cl_8, 'Check temperature of men''s cold tubs. If not cold enough, top off ice.', 'short_entry', 15, '3:00 PM - 4:00 PM', 'yellow', false, false, false),
    ('393fe6f7-e4f9-49eb-80f4-feef05709577', conc_cl_8, 'Check Women''s Spa', 'checkbox', 16, '3:00 PM - 4:00 PM', 'yellow', false, false, false),
    ('3f221524-89ef-48df-a0ae-4f62701fbcbd', conc_cl_8, 'Check temperature of women''s cold plunges', 'short_entry', 17, '3:00 PM - 4:00 PM', 'yellow', false, false, false),
    ('4df58bd2-646f-405c-9452-325aabb7108c', conc_cl_8, 'Check recovery room – boots are tidy & deflated, all recovery tools are charged or charging', 'checkbox', 18, '3:00 PM - 4:00 PM', 'yellow', false, false, false),
    ('4d19a684-fdfe-494b-83ee-4533ee5fe9c6', conc_cl_8, '4 - 4:30: Break 1', 'signature', 20, '4:00 PM - 5:00 PM', 'red', false, false, false),
    ('aa486618-c827-4f87-b4aa-b6a7b02a1ff7', conc_cl_8, 'Walkthrough: Cardio room towels, stretch area 1, tidy left side of gym, 2nd floor towels', 'checkbox', 13, '3:00 PM - 4:00 PM', 'yellow', false, false, false),
    ('c41e7478-91f6-4f77-ae47-65087a373867', conc_cl_8, 'Walkthrough: 2nd floor towels, tidy main gym floor', 'yes_no', 21, '4:00 PM - 5:00 PM', 'blue', false, false, false),
    ('4a5941ca-a32c-4d5d-b28d-f318e396f33d', conc_cl_8, 'Top off men''s spa water & check spa', 'checkbox', 23, '4:00 PM - 5:00 PM', 'blue', false, false, false),
    ('eb077bed-9a02-48e0-8509-9c9093608836', conc_cl_8, '5 PM Reset Rooftop Music to Gym Nu (Spotify) - Thursday', 'checkbox', 25, '5:00 PM - 6:00 PM', 'red', false, false, false),
    ('d3fd22d5-e68d-4631-8f8c-7d08120ffeb6', conc_cl_8, 'Walkthrough: tidy gym floor as needed. Restock towels on 2nd floor & cardio room.', 'checkbox', 27, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('706bc2ad-e18a-48bb-87e3-8b3f1f2af55d', conc_cl_8, 'Check rooftop for tidiness', 'checkbox', 28, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('3921ac55-4b3a-4ed9-ad79-58b9199e490b', conc_cl_8, 'Check Men''s spa after 5:30 rush (restock, spa water refresh, help dry floor as needed, close lockers, put away dirty towels)', 'checkbox', 29, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('05a28c8c-4345-4e48-aa7e-78b31d32bc6a', conc_cl_8, 'Check Women''s spa after 5:30 rush (restock, spa water refresh, close lockers, put away dirty towels)', 'checkbox', 30, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('919346d4-3321-4cad-84d9-120ab405c451', conc_cl_8, '5:50 close cardio room curtains', 'photo', 31, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('cd616ff0-88b8-47cc-9cec-31e01a1f1f95', conc_cl_8, 'Walkthrough: recovery room (batteries, boots, check bathroom supplies), main gym floor (both sides), stretch area 2', 'checkbox', 33, '6:00 PM - 7:00 PM', 'blue', false, false, false),
    ('947d704d-8b76-4110-ab26-3fbdb5435370', conc_cl_8, 'Check Men''s Spa – water, towels, floors, showers', 'checkbox', 34, '6:00 PM - 7:00 PM', 'blue', false, false, false),
    ('4b9b46e8-474b-4ec1-920b-5921ab1f02f8', conc_cl_8, 'Check Women''s Spa – water, floors, towels, showers, close lockers', 'checkbox', 35, '6:00 PM - 7:00 PM', 'blue', false, false, false),
    ('b97aa4c1-bb38-46be-95c1-81b526c29fab', conc_cl_8, 'Restock 2nd floor towels & cardio room', 'checkbox', 36, '6:00 PM - 7:00 PM', 'blue', false, false, false),
    ('4eb12e2b-3e2e-48b3-89ac-260da4eae5c4', conc_cl_8, '6 PM Reset Rooftop Music to Gym Nu (Spotify) - Tuesday', 'checkbox', 37, '6:00 PM - 7:00 PM', 'red', false, false, false),
    ('a52b1113-9862-4ef9-b274-a474d5eb5f30', conc_cl_8, 'Walkthrough', 'checkbox', 39, '7:00 PM - 8:00 PM', 'yellow', false, false, false),
    ('097d2685-ad2e-4818-89ad-0c87e04b7c92', conc_cl_8, 'Check Men''s Spa', 'checkbox', 40, '7:00 PM - 8:00 PM', 'yellow', false, false, false),
    ('e1b133c8-f58a-45a4-be65-10737d7fbeee', conc_cl_8, 'Check Women''s Spa', 'checkbox', 41, '7:00 PM - 8:00 PM', 'yellow', false, false, false),
    ('4e8e90f7-792e-4349-b700-9d79de95a751', conc_cl_8, 'Finish Weekly task if not completed', 'checkbox', 42, '7:00 PM - 8:00 PM', 'yellow', false, false, false),
    ('b84a69db-d622-4838-839a-a836c00c9338', conc_cl_8, '8 PM: Begin Closing Checklist', 'checkbox', 43, '8:00 PM - 9:00 PM', 'blue', false, true, false),
    ('749ce1f2-9c79-48ca-a0ca-0b9533a3ef44', conc_cl_8, '4:45 PM – 5:15 Break 2', 'signature', 24, '4:00 PM - 5:00 PM', 'red', false, false, false),
    ('35db4a86-a372-444a-9dce-81a65721abc5', conc_cl_8, 'Top off women''s spa water & check spa', 'checkbox', 22, '4:00 PM - 5:00 PM', 'blue', false, false, false),
    ('2c306496-920d-443c-82da-31242a841ae1', conc_cl_8, 'Review Weekly Updates & Daily Notes. Check emails & arketa inbox', 'checkbox', 3, '1:30 PM - 2:00 PM', 'orange', false, false, false),
    ('ebf5f29c-c895-4281-88c8-b2b491b466e6', conc_cl_8, 'Breaks MUST be started BY 6:20 PM at the latest. Do not break while spa attendants are breaking (10 min overlap okay). Please sign if understood. Signature 1', 'signature', 0, '1:30 PM - 2:00 PM', 'orange', false, true, false),
    ('0ce3fc1c-bf2f-4cd2-a573-7d385c77a8ca', conc_cl_8, 'Breaks MUST be started BY 6:20 PM at the latest. Do not break while spa attendants are breaking (10 min overlap okay). Please sign if understood. Signature 2', 'signature', 1, '1:30 PM - 2:00 PM', 'orange', false, true, false) ON CONFLICT (id) DO NOTHING;

  -- BOH CHECKLISTS (idempotent)
  INSERT INTO boh_checklists (title, role_type, shift_time, is_weekend, is_active) VALUES ('Floater - Weekday AM', 'floater', 'AM', false, true)
  ON CONFLICT (title, shift_time, is_weekend, role_type) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO boh_cl_1;
  INSERT INTO boh_checklists (title, role_type, shift_time, is_weekend, is_active) VALUES ('Female Spa Attendant - Weekend PM', 'female_spa_attendant', 'PM', true, true)
  ON CONFLICT (title, shift_time, is_weekend, role_type) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO boh_cl_2;
  INSERT INTO boh_checklists (title, role_type, shift_time, is_weekend, is_active) VALUES ('Male Spa Attendant - Weekend PM', 'male_spa_attendant', 'PM', true, true)
  ON CONFLICT (title, shift_time, is_weekend, role_type) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO boh_cl_3;
  INSERT INTO boh_checklists (title, role_type, shift_time, is_weekend, is_active) VALUES ('Male Spa Attendant - Weekday PM', 'male_spa_attendant', 'PM', false, true)
  ON CONFLICT (title, shift_time, is_weekend, role_type) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO boh_cl_4;
  INSERT INTO boh_checklists (title, role_type, shift_time, is_weekend, is_active) VALUES ('Male Spa Attendant - Weekend AM', 'male_spa_attendant', 'AM', true, true)
  ON CONFLICT (title, shift_time, is_weekend, role_type) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO boh_cl_5;
  INSERT INTO boh_checklists (title, role_type, shift_time, is_weekend, is_active) VALUES ('Floater - Weekday PM', 'floater', 'PM', false, true)
  ON CONFLICT (title, shift_time, is_weekend, role_type) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO boh_cl_6;
  INSERT INTO boh_checklists (title, role_type, shift_time, is_weekend, is_active) VALUES ('Female Spa Attendant - Weekday PM', 'female_spa_attendant', 'PM', false, true)
  ON CONFLICT (title, shift_time, is_weekend, role_type) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO boh_cl_7;
  INSERT INTO boh_checklists (title, role_type, shift_time, is_weekend, is_active) VALUES ('Female Spa Attendant - Weekday AM', 'female_spa_attendant', 'AM', false, true)
  ON CONFLICT (title, shift_time, is_weekend, role_type) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO boh_cl_8;
  INSERT INTO boh_checklists (title, role_type, shift_time, is_weekend, is_active) VALUES ('Floater - Weekend AM', 'floater', 'AM', true, true)
  ON CONFLICT (title, shift_time, is_weekend, role_type) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO boh_cl_9;
  INSERT INTO boh_checklists (title, role_type, shift_time, is_weekend, is_active) VALUES ('Male Spa Attendant - Weekday AM', 'male_spa_attendant', 'AM', false, true)
  ON CONFLICT (title, shift_time, is_weekend, role_type) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO boh_cl_10;
  INSERT INTO boh_checklists (title, role_type, shift_time, is_weekend, is_active) VALUES ('Male Spa Attendant - Weekend AM (2)', 'male_spa_attendant', 'AM', true, true)
  ON CONFLICT (title, shift_time, is_weekend, role_type) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO boh_cl_11;
  INSERT INTO boh_checklists (title, role_type, shift_time, is_weekend, is_active) VALUES ('Floater - Weekdend PM (sun only)', 'floater', 'PM', false, true)
  ON CONFLICT (title, shift_time, is_weekend, role_type) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO boh_cl_12;

  -- BOH ITEMS
  INSERT INTO boh_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('a633eb69-d67c-4bc6-b7b2-d345feb5cbfc', boh_cl_1, 'Break MUST be taken BEFORE 11 AM. No exceptions. Please sign if understood', 'signature', 0, '6:30 AM - 7:00 AM', 'red', true, true, false),
    ('a9daf563-30dc-4334-8f6d-4168f7e1f142', boh_cl_1, 'Pick up Walkie-Talkie', 'checkbox', 1, '6:30 AM - 7:00 AM', 'blue', false, false, false),
    ('30c3e7c1-cb79-4118-8582-fd6452d1d6cc', boh_cl_1, 'Review Class Schedule to Determine Turnover Times', 'checkbox', 2, '6:30 AM - 7:00 AM', 'red', true, true, false),
    ('941b3e29-119c-4e73-b985-a52c83810428', boh_cl_1, 'Take dirty towels from the garage down to the basement & restock garage bins', 'checkbox', 3, '6:30 AM - 7:00 AM', 'blue', false, false, false),
    ('e368ceb9-0631-4820-b272-494a7773a852', boh_cl_1, 'Start Laundry', 'checkbox', 4, '6:30 AM - 7:00 AM', 'blue', false, false, false),
    ('9d94ccaa-91ec-4776-8e91-8b45dee7b007', boh_cl_1, 'Check mezzanine bathrooms for cleanliness & restock as needed', 'checkbox', 5, '7:00 AM - 8:00 AM', 'orange', false, false, false),
    ('fcd0f7b6-7549-4e32-ac56-24a572436f89', boh_cl_1, 'Vacuum mezzanine & wet mop private recovery room', 'checkbox', 6, '7:00 AM - 8:00 AM', 'orange', false, false, false),
    ('7b6e0275-c3e2-4751-a386-c1ff3a65e340', boh_cl_1, 'FULLY COMPLETE BEFORE 7:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 7:50', 'checkbox', 7, '7:00 AM - 8:00 AM', 'red', true, true, false),
    ('d3eb273a-ee3e-44bb-b377-616503ae0b96', boh_cl_1, 'Ensure towels are stocked in main gym floor & cardio room', 'checkbox', 8, '8:00 AM - 9:00 AM', 'purple', false, false, false),
    ('25dc5034-c6dc-4d11-999f-1ad45d19c8e7', boh_cl_1, 'Rotate Laundry', 'checkbox', 9, '8:00 AM - 9:00 AM', 'purple', false, false, false),
    ('d0eb7dd5-c896-46e7-be71-e3cfa4fde5e2', boh_cl_1, 'FULLY COMPLETE BEFORE 8:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 8:50', 'checkbox', 10, '8:00 AM - 9:00 AM', 'red', true, true, false),
    ('af648dbd-578f-4106-8c15-ad8a02a149c6', boh_cl_1, 'Class Turnover, if applicable', 'checkbox', 11, '9:00 AM - 10:00 AM', 'red', true, true, false),
    ('a0c0ce4f-b008-4df8-a8fb-9d51f7f3f7a5', boh_cl_1, 'Wipe down all countertop surfaces on both sides of main gym floor', 'checkbox', 12, '9:00 AM - 10:00 AM', 'green', false, false, false),
    ('1b66bb65-9937-474c-9360-36bd6251ecc5', boh_cl_1, 'FULLY COMPLETE BEFORE 9:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 9:50', 'checkbox', 13, '9:00 AM - 10:00 AM', 'red', true, true, false),
    ('850e986d-f758-4e63-a21f-b56586affe1c', boh_cl_1, 'BREAK 10-10:30. Must be before 11 AM.', 'signature', 14, '10:00 AM - 11:00 AM', 'red', true, true, false),
    ('e201dcb8-6f72-4558-b1c5-91110595185d', boh_cl_1, 'Class Turnover, if applicable', 'checkbox', 15, '10:00 AM - 11:00 AM', 'red', true, true, false),
    ('d9205281-642e-48a8-8320-97a734396028', boh_cl_1, 'Rotate Laundry & fold', 'checkbox', 16, '10:00 AM - 11:00 AM', 'blue', false, false, false),
    ('52c1d724-bd2a-4ad5-8cc2-fe0c08aaf2f5', boh_cl_1, 'FULLY COMPLETE BEFORE 10:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 10:50', 'checkbox', 17, '10:00 AM - 11:00 AM', 'red', true, true, false),
    ('836b185e-3a20-4478-b642-a2100b57fe9d', boh_cl_1, 'Class Turnover, if applicable', 'checkbox', 18, '11:00 AM - 12:00 PM', 'red', true, true, false),
    ('5260ffc4-4c18-40eb-bc5c-e316e9ddeb00', boh_cl_1, 'Sweep & mop pilates room', 'checkbox', 19, '11:00 AM - 12:00 PM', 'yellow', false, false, false),
    ('a99c36f2-139e-4cc3-a4c0-414e8c725919', boh_cl_1, 'FULLY COMPLETE BEFORE 11:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 11:50', 'checkbox', 20, '11:00 AM - 12:00 PM', 'red', true, true, false),
    ('062441a1-8352-46f7-9f35-8c90b9288e01', boh_cl_1, 'Class Turnover, if applicable', 'checkbox', 21, '12:00 PM - 1:00 PM', 'red', true, true, false),
    ('f033526d-9a50-48a6-974e-9eb28d1df2a6', boh_cl_1, 'Wipe down mirrors in main gym floor', 'checkbox', 22, '12:00 PM - 1:00 PM', 'orange', false, false, false),
    ('d9dc0865-f054-4332-a914-85be9146d904', boh_cl_1, 'Check mezzanine bathrooms for cleanliness & restock as needed', 'checkbox', 23, '12:00 PM - 1:00 PM', 'orange', false, false, false),
    ('b5e29cc9-1397-41b3-94c8-0577e29c1531', boh_cl_1, 'Spot sweep / dry mop as needed in main gym floor', 'checkbox', 24, '12:00 PM - 1:00 PM', 'orange', false, false, false),
    ('ba76262b-63b2-42e3-9b4e-aea74e139c2d', boh_cl_1, 'FULLY COMPLETE BEFORE 12:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 12:50', 'checkbox', 25, '12:00 PM - 1:00 PM', 'red', true, true, false),
    ('81559efd-1954-4133-84a4-201c12ce55f2', boh_cl_1, 'Class Turnover, if applicable', 'checkbox', 26, '1:00 PM - 2:00 PM', 'red', true, true, false),
    ('a15698d9-7031-4e4c-9f15-cb75c8d4ee08', boh_cl_1, 'Check towel stock in all gym areas', 'checkbox', 27, '1:00 PM - 2:00 PM', 'purple', false, false, false),
    ('6f45aa3b-2d77-417f-9bb5-54ea6243f7a6', boh_cl_1, 'Return Walkie Talkie to charger', 'checkbox', 28, '1:00 PM - 2:00 PM', 'purple', false, false, false),
    ('2e10ae90-fe1c-4454-884d-697e1a6da4f5', boh_cl_1, 'Were there any obstacles today?', 'free_response', 29, 'End of Shift', 'gray', false, false, false),
    ('94d135ba-fb53-4b5d-862d-48ea45089f97', boh_cl_1, 'Did you receive or overhear any member feedback?', 'free_response', 30, 'End of Shift', 'gray', false, false, false),
    ('eaf626f4-7d13-47a8-970e-8f17079692ec', boh_cl_1, 'Do you have any additional notes for management?', 'free_response', 31, 'End of Shift', 'gray', false, false, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO boh_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('42453af2-2667-4af7-bccf-6daa2a2116f8', boh_cl_2, 'Break MUST be taken BEFORE 6 PM. No exceptions. Please sign if understood', 'signature', 0, '1:00 PM - 2:00 PM', 'red', true, true, false),
    ('b9fb3c4d-eef5-4fef-8f2e-2075a6652186', boh_cl_2, 'Pick up Walkie-Talkie & locker key', 'checkbox', 1, '1:00 PM - 2:00 PM', 'blue', false, false, false),
    ('c33d45ca-1906-446e-8477-7bc1f3717d95', boh_cl_2, 'Begin laundry - wash 1 load of new yoga towels', 'checkbox', 2, '1:00 PM - 2:00 PM', 'blue', false, false, false),
    ('c931a3e8-2ca1-44ad-bfb1-2508a51e66fd', boh_cl_2, 'Restock medium towels in main gym floor.', 'checkbox', 3, '1:00 PM - 2:00 PM', 'blue', false, false, false),
    ('005554eb-4569-4ff3-9ae9-3fb3131530cb', boh_cl_2, 'Restock towels as needed in spa.', 'checkbox', 4, '1:00 PM - 2:00 PM', 'blue', false, false, false),
    ('23b94162-9753-4e86-9042-dc48dd16923d', boh_cl_2, 'Cold plunge: clean debris, ensure water is clear, cold, jets working. 45° left / 55° right', 'checkbox', 5, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('5c946043-12b5-4aea-8e85-dddb0a8bc891', boh_cl_2, 'Refill toilet paper, napkins, and water cups.', 'checkbox', 6, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('c09834e5-26db-4412-9a73-858cddcac6e1', boh_cl_2, 'Refill Shampoo & Conditioner.', 'checkbox', 7, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('993f5592-c2d7-4ba2-b39d-cde216d5e2ba', boh_cl_2, 'At 4 PM, place dirty towel bin in elevator; retrieve clean bin; restock as needed', 'checkbox', 8, '3:00 PM - 4:30 PM', 'red', true, true, false),
    ('81b484e3-b93b-422c-a5ec-20330afa70c0', boh_cl_2, 'Sweep and vacuum in pilates room.', 'checkbox', 9, '3:00 PM - 4:30 PM', 'purple', false, false, false),
    ('b4d056b6-e44f-4009-8fb4-e2a34e5aca60', boh_cl_2, 'Swap laundry as needed.', 'checkbox', 10, '3:00 PM - 4:30 PM', 'purple', false, false, false),
    ('c402f66d-0340-4a27-bbe2-90004b7b605b', boh_cl_2, 'BREAK: 4:20–4:50. Must be taken before 6 PM.', 'signature', 11, '4:20 PM - 5:00 PM', 'red', true, true, false),
    ('0d235a47-f10c-4344-9a7f-1dfc83573d26', boh_cl_2, 'At 5 PM, place dirty towel bin in elevator; retrieve clean bin; restock as needed', 'checkbox', 12, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('b07c3c0c-33ca-4a49-9e8c-ebb454324aee', boh_cl_2, 'Wipe down all countertop surfaces on both sides of main gym floor.', 'checkbox', 13, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('aa62b82d-ab32-438e-991c-c9f57340de49', boh_cl_2, 'Reoccurring Tasks: dry floors, restock towels & products, check showers, collect dirty towels, close lockers, restock products, tidy vanities, top off spa water.', 'checkbox', 14, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('b8f03119-cc3a-4cd6-99a0-525bef43055c', boh_cl_2, 'Clean cold tub filter & use the skimmer for debris.', 'photo', 15, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('21321465-281f-43cb-a095-c141c2296c40', boh_cl_2, 'At 6 PM, place dirty towel bin in elevator; retrieve clean bin; restock as needed', 'checkbox', 16, '6:00 PM - 8:00 PM', 'orange', false, false, false),
    ('b1b1e79b-5257-4f13-ad89-4320a80b9179', boh_cl_2, '6:30: Close down one tub, drain, circulate 20 min, wipe walls; repeat on second tub', 'checkbox', 17, '6:00 PM - 8:00 PM', 'orange', false, false, false),
    ('4ea512e3-c840-4e83-9cc2-5158c1054349', boh_cl_2, 'Wipe mirrors.', 'checkbox', 18, '6:00 PM - 8:00 PM', 'orange', false, false, false),
    ('ff16bf3a-a330-4075-be55-2d4e8a64c0a9', boh_cl_2, 'Scrub steam room with Marble Plus & hose down (remove hair; leave door open).', 'checkbox', 19, '6:00 PM - 8:00 PM', 'orange', false, false, false),
    ('43171c09-871b-4fc1-afa1-409f1cfbc682', boh_cl_2, 'Spray water down steam room and sauna floor drains 1–2 minutes.', 'photo', 20, '6:00 PM - 8:00 PM', 'orange', false, false, false),
    ('34d730b4-0ced-49b4-abf2-1d07cf1f1538', boh_cl_2, 'Clean sauna as outlined in attached document.', 'photo', 21, '6:00 PM - 8:00 PM', 'orange', false, false, false),
    ('f72adeaa-1e6c-4d1f-9f54-fd48dbd5dde5', boh_cl_2, 'Check cold tubs for cleanliness & scrub wooden platform; rinse thoroughly.', 'checkbox', 22, '6:00 PM - 8:00 PM', 'orange', false, false, false),
    ('631d9493-c031-458b-8063-0984fea0e2ac', boh_cl_2, 'Check & clean cold tub filter behind cold tubs.', 'photo', 23, '6:00 PM - 8:00 PM', 'orange', false, false, false),
    ('39e25e1a-a76d-40b8-b229-44c2c88ab978', boh_cl_2, 'Showers: scrub all surfaces w/ brush + diluted bleach; clear drains; rinse; leave grate off.', 'photo', 24, '6:00 PM - 8:00 PM', 'orange', false, false, false),
    ('5c2aaa00-72fc-4cf3-b5ad-cb6bedf458ef', boh_cl_2, 'Scrub floors around cold tubs & clean cold tub shower walls/floor.', 'checkbox', 25, '6:00 PM - 8:00 PM', 'orange', false, false, false),
    ('4e269fd2-323d-4550-82d1-e3bb3837faed', boh_cl_2, 'Clean toilets thoroughly.', 'checkbox', 26, '6:00 PM - 8:00 PM', 'orange', false, false, false),
    ('5d9bb53d-881e-4a54-b421-87b5492e717a', boh_cl_2, 'Mop locker rooms.', 'checkbox', 27, '6:00 PM - 8:00 PM', 'orange', false, false, false),
    ('d7191581-5442-4625-b85b-bcdef368adb0', boh_cl_2, 'Return walkie talkie to charger & locker key to desk', 'checkbox', 28, '6:00 PM - 8:00 PM', 'orange', false, false, false),
    ('c81eab73-0780-482f-9253-4f190eb21a81', boh_cl_2, 'Take out spa trash.', 'checkbox', 29, '6:00 PM - 8:00 PM', 'orange', false, false, false),
    ('ca092401-4afd-425b-acd2-9631ddd5a584', boh_cl_2, 'Were there any obstacles today?', 'free_response', 30, 'End of Shift', 'gray', false, false, false),
    ('98037050-c110-4cd7-94b7-8751ec5146a9', boh_cl_2, 'Did you receive or overhear any member feedback?', 'free_response', 31, 'End of Shift', 'gray', false, false, false),
    ('aa416538-b757-4767-9cc0-35a502456a0e', boh_cl_2, 'Do you have any additional notes for management?', 'free_response', 32, 'End of Shift', 'gray', false, false, false),
    ('774bef18-1c20-4ab5-b960-42188acaf94b', boh_cl_2, 'Did you experience any issues with the cold tubs?', 'free_response', 33, 'End of Shift', 'gray', false, false, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO boh_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('7cf04a87-e279-4f42-b85f-f733d695e856', boh_cl_3, 'Break MUST be taken BEFORE 6 PM. No exceptions. Please sign if understood', 'signature', 0, '1:00 PM - 2:00 PM', 'red', true, true, false),
    ('6bd56537-eac5-44ea-9a19-a945154fd316', boh_cl_3, 'Pick up Walkie-Talkie', 'photo', 1, '1:00 PM - 2:00 PM', 'blue', false, false, false),
    ('4728f105-721f-4eac-8d28-bd393d84174a', boh_cl_3, 'Cold plunge: clean debris, ensure water is clear/cold, jets working. 45° left / 55° right', 'checkbox', 2, '1:00 PM - 2:00 PM', 'blue', false, false, false),
    ('842c9597-2dcb-4178-aea0-18e4dc24bad3', boh_cl_3, 'Restock towels in cardio room.', 'checkbox', 3, '1:00 PM - 2:00 PM', 'blue', false, false, false),
    ('9a7ff601-357e-4b46-bf11-ac75be066ed1', boh_cl_3, 'Restock towels as needed in spa.', 'checkbox', 4, '1:00 PM - 2:00 PM', 'blue', false, false, false),
    ('a5a7f686-a4b4-4c29-89c8-9aada6dbc2d4', boh_cl_3, 'Wipe down vanity counters & restock as needed.', 'checkbox', 5, '1:00 PM - 2:00 PM', 'blue', false, false, false),
    ('69d778b9-9ad0-46f2-a93e-5232e819fbb2', boh_cl_3, 'Refill toilet paper, napkins, and water cups.', 'checkbox', 6, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('d1f6d0b3-e504-4e4c-bcc8-0061b6028a63', boh_cl_3, 'Check cleanliness of toilets — clean as needed.', 'checkbox', 7, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('4a5b07ff-944e-4e5a-a640-84d2c385a89f', boh_cl_3, 'Refill Shampoo & Conditioner.', 'checkbox', 8, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('f098b54e-c854-4192-b0c3-b7d2c0340afc', boh_cl_3, 'Dry floors as needed.', 'checkbox', 9, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('74192dd6-f126-4ef1-8369-ff8e03a2f133', boh_cl_3, 'Wipe down cardio machines if not in use.', 'checkbox', 10, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('f1516f30-f57f-4891-9044-d3d27a3ab12e', boh_cl_3, 'Scrub showers not in use.', 'checkbox', 11, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('42861a4a-f511-4b1f-8909-f273c9923ef2', boh_cl_3, 'BREAK: 4 PM - 4:30 PM. Must be before 6 PM.', 'signature', 12, '4:00 PM - 5:00 PM', 'red', true, true, false),
    ('d573e9ee-6017-465e-aa1c-20d3d07b00cd', boh_cl_3, 'Mop locker room floors as needed.', 'checkbox', 13, '4:00 PM - 5:00 PM', 'purple', false, false, false),
    ('a28d4c1f-326f-4e2c-b000-ca7de8276a33', boh_cl_3, 'Recurring tasks: dry floors, restock towels/products, check showers, collect dirty towels, close lockers, restock paper products, tidy counters, top off spa water.', 'checkbox', 14, '4:00 PM - 5:00 PM', 'purple', false, false, false),
    ('7bed848e-a676-4da4-8c35-70e2a7bf0205', boh_cl_3, 'Stock all amenities as needed.', 'checkbox', 15, '4:00 PM - 5:00 PM', 'purple', false, false, false),
    ('39649627-4f1e-4d95-90cf-60e8ca316aee', boh_cl_3, 'Clean cold tub filter & use skimmer.', 'checkbox', 16, '4:00 PM - 5:00 PM', 'purple', false, false, false),
    ('a2620b18-c5fc-48ae-a50d-f6b61bb3989d', boh_cl_3, 'Wipe sauna & steam room doors for fingerprints.', 'checkbox', 17, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('13eeec8e-fe7b-44a8-998c-0c0de229dcaa', boh_cl_3, 'Wipe mirrors.', 'checkbox', 18, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('0c77b43e-b7b4-4323-8dc5-6a60fae54d6a', boh_cl_3, 'Mop locker room floors as needed.', 'checkbox', 19, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('a6bfd1ee-dff0-42b4-a6a8-1bbcd2217a4d', boh_cl_3, 'Recurring tasks as needed.', 'checkbox', 20, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('b1ac2018-761c-4494-b8df-6839972f3941', boh_cl_3, 'Restock towels in cardio room & wipe down counters; wipe down machines if not in use.', 'checkbox', 21, '6:00 PM - 7:00 PM', 'blue', false, false, false),
    ('de2d64a7-a7f8-4708-a327-525557f300cb', boh_cl_3, '6:30: Close down one tub; drain, run hose 20 min, wipe inside; repeat for other tub', 'photo', 22, '6:30 PM - 8:00 PM', 'orange', false, false, false),
    ('27081952-45c7-4a92-910b-59811554ee2f', boh_cl_3, 'Scrub steam room with Marble Plus & hose down (remove hair, leave door open).', 'checkbox', 23, '6:30 PM - 8:00 PM', 'orange', false, false, false),
    ('da4e1c7c-64cf-4110-a6f7-325dc1125e3d', boh_cl_3, 'Spray water down steam room & sauna drains 1-2 minutes.', 'checkbox', 24, '6:30 PM - 8:00 PM', 'orange', false, false, false),
    ('1aa40e09-58ed-4c2f-9100-07960b6640b8', boh_cl_3, 'Leave sauna door open for AM cleaning.', 'checkbox', 25, '6:30 PM - 8:00 PM', 'orange', false, false, false),
    ('14123629-655d-49d1-ad80-b1e84674fa93', boh_cl_3, 'Check cold tubs for cleanliness & scrub wooden platform; rinse thoroughly.', 'checkbox', 26, '6:30 PM - 8:00 PM', 'orange', false, false, false),
    ('a9b8135a-d52b-431b-949b-50fbd87307d9', boh_cl_3, 'Check & clean cold tub filter behind cold tubs.', 'photo', 27, '6:30 PM - 8:00 PM', 'orange', false, false, false),
    ('1d589a56-5fad-44e2-9067-9f9df66032d0', boh_cl_3, 'Showers: scrub all surfaces w/ brush + diluted bleach; clear drains; rinse; leave grate off.', 'photo', 28, '6:30 PM - 8:00 PM', 'orange', false, false, false),
    ('a821717e-7606-4263-a0b0-abbb07afb0b2', boh_cl_3, 'Scrub floors around cold tubs & clean cold tub shower walls/floor.', 'checkbox', 29, '6:30 PM - 8:00 PM', 'orange', false, false, false),
    ('0653e84a-e327-4d53-b88a-da9b0b1576ed', boh_cl_3, 'Clean toilets thoroughly.', 'checkbox', 30, '6:30 PM - 8:00 PM', 'orange', false, false, false),
    ('b420410b-b160-4c02-b363-45be80a360ae', boh_cl_3, 'Mop locker rooms, cardio room, and entrance.', 'checkbox', 31, '6:30 PM - 8:00 PM', 'orange', false, false, false),
    ('830b62b6-be0c-4b4f-bf9e-33784d0a85ef', boh_cl_3, 'Take out all trash (rooftop, main gym floor, cardio room). Replace liners.', 'checkbox', 32, '6:30 PM - 8:00 PM', 'orange', false, false, false),
    ('a588a39d-550e-45c2-a0ee-cdebb3490cdc', boh_cl_3, 'Return Walkie Talkie to charger & locker key to desk', 'checkbox', 33, '6:30 PM - 8:00 PM', 'orange', false, false, false),
    ('21f4b857-49f2-49bc-8327-382d72f602de', boh_cl_3, 'Were there any obstacles today?', 'free_response', 34, 'End of Shift', 'gray', false, false, false),
    ('07546556-ddd6-4e20-beaa-a01a0db8b287', boh_cl_3, 'Did you receive or overhear any member feedback?', 'free_response', 35, 'End of Shift', 'gray', false, false, false),
    ('c46f7430-2b1b-4c77-8e85-ea857ce805a6', boh_cl_3, 'Do you have any additional notes for management?', 'free_response', 36, 'End of Shift', 'gray', false, false, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO boh_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('f36f457b-1b66-43bd-a28c-73d13a778029', boh_cl_4, 'Break MUST be taken BEFORE 5 PM. No exceptions. Please sign if understood', 'signature', 0, '2:00 PM - 3:00 PM', 'red', true, true, false),
    ('07248e34-666c-4726-ac77-a8f96aae3449', boh_cl_4, 'Pick up Walkie-Talkie & locker key', 'photo', 1, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('bb5fcc9f-9154-464e-950b-d791636cc411', boh_cl_4, 'Cold plunge: clean debris, ensure water is clear/cold, jets working, add ice if needed', 'checkbox', 2, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('7bf91e33-5864-4493-8ff5-60be517b6d1d', boh_cl_4, 'Restock towels in cardio room.', 'checkbox', 3, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('f974db16-a6e1-4cbf-868e-dd206b21b107', boh_cl_4, 'Restock towels as needed in spa.', 'checkbox', 4, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('fe5917c9-9ffe-4a1f-ab36-1b9946a03817', boh_cl_4, 'Wipe down vanity counters & restock as needed.', 'checkbox', 5, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('516b5a20-c5eb-40d4-9be5-24da3aa40904', boh_cl_4, 'Refill toilet paper, napkins, and water cups.', 'checkbox', 6, '3:00 PM - 4:00 PM', 'blue', false, false, false),
    ('94c39b1a-be10-4234-8e32-ca308a7a7c7c', boh_cl_4, 'Check cleanliness of toilets; clean as needed.', 'checkbox', 7, '3:00 PM - 4:00 PM', 'blue', false, false, false),
    ('4dd997a9-fede-48dd-9ae5-6d648ea37025', boh_cl_4, 'Dry floors as needed.', 'checkbox', 8, '3:00 PM - 4:00 PM', 'blue', false, false, false),
    ('6c628d5a-79d6-48d1-a0ce-8b167a9398c3', boh_cl_4, 'Refill Shampoo & Conditioner.', 'checkbox', 9, '3:00 PM - 4:00 PM', 'blue', false, false, false),
    ('d975476c-12be-4737-97f6-435c0e719a82', boh_cl_4, 'Wipe down cardio machines if not in use.', 'checkbox', 10, '3:00 PM - 4:00 PM', 'blue', false, false, false),
    ('604fb6cf-8fb6-48d9-9ab8-bbe7862b6a2e', boh_cl_4, 'Scrub showers not in use.', 'checkbox', 11, '3:00 PM - 4:00 PM', 'blue', false, false, false),
    ('4e993eba-6dab-4f85-a9f7-036ec4851b04', boh_cl_4, 'BREAK: 4 PM - 4:30 PM. Must be before 5 PM.', 'signature', 12, '4:00 PM - 5:00 PM', 'red', true, true, false),
    ('4237a500-6023-4b93-9719-571bbc3a9f15', boh_cl_4, 'Mop locker room floors as needed.', 'checkbox', 13, '4:00 PM - 5:00 PM', 'purple', false, false, false),
    ('bfc46a92-676f-4831-8313-cd1c4ac92f7e', boh_cl_4, 'Recurring tasks: dry floors, restock towels/products, check showers, collect dirty towels, close lockers, restock paper products, tidy counters, top off spa water.', 'checkbox', 14, '4:00 PM - 5:00 PM', 'purple', false, false, false),
    ('8d09ed7e-bd49-4ecb-b51a-21c32c31c708', boh_cl_4, 'Stock all amenities as needed.', 'checkbox', 15, '4:00 PM - 5:00 PM', 'purple', false, false, false),
    ('89911ce9-d69c-41b5-a7ee-cf0ef14f6fd7', boh_cl_4, 'Clean cold tub filter & use skimmer.', 'checkbox', 16, '4:00 PM - 5:00 PM', 'purple', false, false, false),
    ('811092dc-0a33-4b2e-8250-a842caf754d6', boh_cl_4, 'Wipe sauna & steam room doors for fingerprints.', 'checkbox', 17, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('3e73041e-def4-4498-a2b0-47983f61433a', boh_cl_4, 'Wipe mirrors.', 'checkbox', 18, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('322ebd28-4392-4e24-afa8-3d858287dae3', boh_cl_4, 'Mop locker room floors as needed.', 'checkbox', 19, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('298fbfdf-894f-423b-a21d-c0198182052f', boh_cl_4, 'Recurring tasks: dry floors, restock towels, check showers, collect dirty towels, close lockers, restock products/paper towels/TP, tidy counters.', 'checkbox', 20, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('1bd76203-3912-4a02-adcc-24d7f45ca9c9', boh_cl_4, 'Stock all amenities as needed.', 'checkbox', 21, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('d9d1c81a-c8ad-4d9f-902d-1175a5b93475', boh_cl_4, 'Clean cold tub filter & use skimmer.', 'checkbox', 22, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('71e02330-7353-4295-a830-1c9a1b15a41b', boh_cl_4, 'Restock towels in cardio room & wipe down counters; wipe down machines if not in use.', 'checkbox', 23, '6:00 PM - 7:00 PM', 'blue', false, false, false),
    ('f4c59245-b7ad-4c12-bc2d-2ec3da5642d9', boh_cl_4, '6:30: Close down one tub; drain, run hose 20 min, wipe inside; repeat for other tub', 'photo', 24, '6:30 PM - 8:00 PM', 'blue', false, false, false),
    ('5335fd5d-fb50-4e06-ac71-64b595d491fb', boh_cl_4, 'Scrub steam room with Marble Plus & hose down (remove hair, leave door open).', 'checkbox', 25, '6:30 PM - 8:00 PM', 'blue', false, false, false),
    ('1cf9364e-58bb-4395-bb2f-3c31d3844fc3', boh_cl_4, 'Spray water down steam room & sauna drains 1-2 minutes.', 'checkbox', 26, '6:30 PM - 8:00 PM', 'blue', false, false, false),
    ('9ddb31d9-a36b-44ed-8719-ddcf5216f1da', boh_cl_4, 'Leave sauna door open for AM cleaning.', 'checkbox', 27, '6:30 PM - 8:00 PM', 'blue', false, false, false),
    ('158e3d06-4fe7-4d7d-a0ed-71dc0576cccd', boh_cl_4, 'Check cold tubs for cleanliness & scrub wooden platform; rinse thoroughly.', 'checkbox', 28, '6:30 PM - 8:00 PM', 'blue', false, false, false),
    ('1c2037fb-0fb1-4fa6-aa71-bed17a6c35f1', boh_cl_4, 'Check & clean cold tub filter behind cold tubs.', 'photo', 29, '6:30 PM - 8:00 PM', 'blue', false, false, false),
    ('4e721c6f-260f-49a9-90d4-55ad7f4f1c4e', boh_cl_4, 'Showers: scrub all surfaces w/ brush + diluted bleach; clear drains; rinse; leave grate off.', 'photo', 30, '6:30 PM - 8:00 PM', 'blue', false, false, false),
    ('c6804eec-5353-4315-92d5-07fff36c16b2', boh_cl_4, 'Scrub floors around cold tubs & clean cold tub shower walls/floor.', 'checkbox', 31, '6:30 PM - 8:00 PM', 'blue', false, false, false),
    ('b996d977-7966-44be-b022-534f883b7c11', boh_cl_4, 'Clean toilets thoroughly.', 'checkbox', 32, '6:30 PM - 8:00 PM', 'blue', false, false, false),
    ('098340b6-cab4-48dd-87bf-446670020afe', boh_cl_4, 'Mop locker rooms, cardio room, and entrance.', 'checkbox', 33, '6:30 PM - 8:00 PM', 'blue', false, false, false),
    ('5db0c223-5752-42c5-a839-4a26459faf66', boh_cl_4, 'Take out all trash (rooftop, main gym floor, cardio room). Replace liners.', 'checkbox', 34, '6:30 PM - 8:00 PM', 'blue', false, false, false),
    ('e590d957-2dff-4768-914a-918c27bb3de4', boh_cl_4, 'Return Walkie Talkie to charger & locker key to desk', 'checkbox', 35, '6:30 PM - 8:00 PM', 'blue', false, false, false),
    ('4d4f9a9f-15b2-47ed-babf-2c8ef844532b', boh_cl_4, 'Were there any obstacles today?', 'free_response', 36, 'End of Shift', 'gray', false, false, false),
    ('ad5a7379-a1a3-4665-b134-4d9c1b5258a2', boh_cl_4, 'Did you receive or overhear any member feedback?', 'free_response', 37, 'End of Shift', 'gray', false, false, false),
    ('eba9dd4c-8cad-491e-ab97-c2995028c613', boh_cl_4, 'Do you have any additional notes for management?', 'free_response', 38, 'End of Shift', 'gray', false, false, false),
    ('cb6866c7-9893-4644-9d75-138b3d6f6d40', boh_cl_4, 'How accurate was the checklist to the needs & flow of the day?', 'free_response', 39, 'End of Shift', 'gray', false, false, false),
    ('607be1e0-6577-4e4c-873a-dc53cf8d6699', boh_cl_4, 'Did you experience any issues with the cold tubs?', 'free_response', 40, 'End of Shift', 'gray', false, false, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO boh_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('84347e00-6400-46a9-b63a-6de16363bd6b', boh_cl_5, 'Break MUST be taken BEFORE 11 AM. No exceptions. Please sign if understood', 'signature', 0, '6:30 AM - 7:00 AM', 'red', true, true, false),
    ('fd120643-2c7a-43a2-98d3-c5668738fc64', boh_cl_5, 'Pick up Walkie-Talkie', 'photo', 1, '6:30 AM - 7:00 AM', 'red', true, true, false),
    ('69c977bc-b050-4a34-a469-189642657289', boh_cl_5, '6:30: turn on sauna.', 'photo', 2, '6:30 AM - 7:00 AM', 'red', true, true, false),
    ('e9ba8b46-965c-4cd7-9233-ed5626a16eb6', boh_cl_5, 'Close steam room and sauna doors.', 'checkbox', 3, '6:30 AM - 7:00 AM', 'green', false, false, false),
    ('d0a331f1-4273-44db-a5ce-2a8c9438ca5d', boh_cl_5, 'Collect mop heads, black cleaning towels, all towel sizes from garage.', 'checkbox', 4, '6:30 AM - 7:00 AM', 'green', false, false, false),
    ('b16c8690-d753-4683-81e9-e84779307df3', boh_cl_5, 'Stock medium towels in Cardio Room & large/medium towels in spa.', 'checkbox', 5, '6:30 AM - 7:00 AM', 'green', false, false, false),
    ('4130c0bc-0215-465c-8ef1-a45c2bb74d96', boh_cl_5, 'Cold plunge: remove debris; ensure water is clear/cold; jets working; add ice if needed', 'checkbox', 6, '7:00 AM - 8:00 AM', 'gray', false, false, false),
    ('fc0288f9-1b9c-43fb-836b-9bc41daf0976', boh_cl_5, 'ROOFTOP: check for towels & mats for rooftop classes.', 'photo', 7, '7:00 AM - 8:00 AM', 'gray', false, false, false),
    ('d9f777d0-3080-41ce-a719-d4a359c5b70f', boh_cl_5, 'Clear leaves/debris from rooftop with leaf blower if needed', 'yes_no', 8, '7:00 AM - 8:00 AM', 'gray', false, false, false),
    ('d4e14f6c-dfb9-4521-85b4-a5ef7817603b', boh_cl_5, 'Start on café by 7:30 (take photo).', 'photo', 9, '7:00 AM - 8:00 AM', 'red', true, true, false),
    ('f1531a04-675d-40be-a6b8-15de667ce3d2', boh_cl_5, 'Café floors: dry as needed & sweep.', 'checkbox', 10, '7:00 AM - 8:00 AM', 'gray', false, false, false),
    ('ae02b169-6207-4806-bb19-dde0ea06e059', boh_cl_5, 'Café cushions: place cushions throughout the space.', 'checkbox', 11, '7:00 AM - 8:00 AM', 'gray', false, false, false),
    ('57bd2beb-e422-4e5a-b47b-94243e7d4aca', boh_cl_5, 'Towel drop: alert floater via walkie-talkie when ready.', 'checkbox', 12, '8:00 AM - 9:00 AM', 'orange', false, false, false),
    ('6b97686f-2d19-4b0c-b619-8406c9bf2749', boh_cl_5, 'Recurring tasks: dry floors, restock towels/products, check showers, collect dirty towels, close lockers, restock paper items, tidy counters, top off spa water.', 'checkbox', 13, '8:00 AM - 9:00 AM', 'orange', false, false, false),
    ('b317a3ab-1331-4818-a0b0-2c27242c9c50', boh_cl_5, 'Clean cold tub filter & use skimmer for debris.', 'checkbox', 14, '8:00 AM - 9:00 AM', 'orange', false, false, false),
    ('dc6932ea-5d34-4217-8681-fae214463ecc', boh_cl_5, 'Complete towel drop as needed.', 'checkbox', 15, '9:00 AM - 10:00 AM', 'purple', false, false, false),
    ('b87afda7-f88f-425f-aba1-f9933e96a6fd', boh_cl_5, 'Recurring tasks as needed.', 'checkbox', 16, '9:00 AM - 10:00 AM', 'purple', false, false, false),
    ('d0a6dfe3-11e4-44b7-9e37-b32a0fc32757', boh_cl_5, 'Break 10-10:30 AM. MUST be before 11 AM.', 'signature', 17, '10:00 AM - 11:00 AM', 'red', true, true, false),
    ('5883cc2b-78ba-482b-b0a8-2fe08ceaa5fa', boh_cl_5, 'Complete towel drop as needed.', 'checkbox', 18, '10:00 AM - 11:00 AM', 'blue', false, false, false),
    ('c2b4d26b-9d70-49d4-8a91-cf71807cb070', boh_cl_5, 'Recurring tasks as needed.', 'checkbox', 19, '10:00 AM - 11:00 AM', 'blue', false, false, false),
    ('d2169f80-45d0-4e2f-939f-e5e637d46b52', boh_cl_5, 'Clean showers not in use.', 'checkbox', 20, '11:00 AM - 12:00 PM', 'blue', false, false, false),
    ('733b24cb-1b75-4013-9539-e47c4bb50f63', boh_cl_5, 'Complete towel drop as needed.', 'checkbox', 21, '11:00 AM - 12:00 PM', 'blue', false, false, false),
    ('b940975d-f5d3-4664-85bd-db5e45273bbe', boh_cl_5, 'Complete recurring tasks as needed.', 'checkbox', 22, '12:00 PM - 1:00 PM', 'yellow', false, false, false),
    ('3151856f-986a-4c9e-aa21-ba38e2201108', boh_cl_5, 'Clean toilets.', 'checkbox', 23, '12:00 PM - 1:00 PM', 'yellow', false, false, false),
    ('a884ed25-ab01-4a86-9d5e-2e00f95d4b4a', boh_cl_5, 'Wipe sauna & steam room doors for fingerprints.', 'checkbox', 24, '12:00 PM - 1:00 PM', 'yellow', false, false, false),
    ('b2b89067-e160-48a2-8c7e-e156b1a36bb4', boh_cl_5, 'Return Walkie Talkie to charger & locker key to desk', 'checkbox', 25, '12:00 PM - 1:00 PM', 'yellow', false, false, false),
    ('8f9b63d8-c96e-4da5-b764-8e75cc1b0235', boh_cl_5, 'Take out trash.', 'checkbox', 26, '12:00 PM - 1:00 PM', 'yellow', false, false, false),
    ('c1de1cd2-dcb7-493f-a0cc-68661b54b443', boh_cl_5, 'Were there any obstacles today?', 'free_response', 27, 'End of Shift', 'gray', false, false, false),
    ('35f91db2-6c34-4c65-af27-0410fe70a53e', boh_cl_5, 'Did you receive or overhear any member feedback?', 'free_response', 28, 'End of Shift', 'gray', false, false, false),
    ('5103b0ab-95e3-459d-aaf6-5931730ba16e', boh_cl_5, 'Do you have any additional notes for management?', 'free_response', 29, 'End of Shift', 'gray', false, false, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO boh_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('6301c45c-3b94-46bb-8948-a83009db78ad', boh_cl_6, 'Pick up walkie talkie', 'checkbox', 0, '4:30 PM - 5:00 PM', 'blue', false, false, false),
    ('f983b7d4-283d-42e8-9d49-a9f6e86190bf', boh_cl_6, 'Review Class Schedule to Determine Turnover Times', 'checkbox', 1, '4:30 PM - 5:00 PM', 'red', true, true, false),
    ('680d1135-4056-4cc0-b9b7-7778d7344678', boh_cl_6, 'Begin laundry', 'checkbox', 2, '4:30 PM - 5:00 PM', 'blue', false, false, false),
    ('7bccacad-5b9e-406f-b99a-ceae75ade54e', boh_cl_6, 'If needed, fold laundry leftover from the morning', 'checkbox', 3, '4:30 PM - 5:00 PM', 'blue', false, false, false),
    ('a93b27df-2513-4160-805f-caca9085e1b3', boh_cl_6, 'Vacuum mezzanine & wet mop private recovery room', 'checkbox', 4, '4:30 PM - 5:00 PM', 'blue', false, false, false),
    ('97e50fcd-c959-4b15-951d-e4638cb2dda4', boh_cl_6, 'Class Turnover, if applicable', 'checkbox', 5, '5:00 PM - 6:00 PM', 'red', true, true, false),
    ('810219eb-d3b9-4370-84d5-e83f58db4ab6', boh_cl_6, 'FULLY COMPLETE BY 5:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 5:50', 'checkbox', 6, '5:00 PM - 6:00 PM', 'red', true, true, false),
    ('915e9224-2c74-4883-83b7-bc83599eccde', boh_cl_6, 'WEEKLY TASK', 'multiple_choice', 7, '5:00 PM - 6:00 PM', 'yellow', false, false, false),
    ('0b47f23e-7824-432d-9969-45c054e7ca8e', boh_cl_6, 'Class Turnover, if applicable', 'checkbox', 8, '6:00 PM - 7:00 PM', 'red', true, true, false),
    ('90b5a1c7-1c94-442d-9817-3d0f05c98e66', boh_cl_6, 'FULLY COMPLETE BY 6:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 6:50', 'checkbox', 9, '6:00 PM - 7:00 PM', 'red', true, true, false),
    ('4df2cc6c-5e79-4373-918a-77ac2db0793f', boh_cl_6, 'Wipe down mirrors in main gym floor', 'checkbox', 10, '6:00 PM - 7:00 PM', 'purple', false, false, false),
    ('91369f8f-959c-43a1-9829-55b14ba41b80', boh_cl_6, 'Check mezzanine bathrooms for cleanliness & restock as needed', 'checkbox', 11, '6:00 PM - 7:00 PM', 'purple', false, false, false),
    ('3eb4e49c-a3b0-464a-8b16-2cb7224d9aa7', boh_cl_6, 'Spot sweep/ dry mop as needed in main gym floor', 'checkbox', 12, '6:00 PM - 7:00 PM', 'purple', false, false, false),
    ('7c572d7d-6ae1-4a81-8af3-63cc91fe9980', boh_cl_6, 'Class Turnover, if applicable', 'checkbox', 13, '7:00 PM - 8:00 PM', 'red', true, true, false),
    ('f1c44f06-27ed-4cb5-b67f-b427219d1547', boh_cl_6, 'FULLY COMPLETE BY 7:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 7:50', 'checkbox', 14, '7:00 PM - 8:00 PM', 'red', true, true, false),
    ('2076c972-df9c-44d6-b4dc-57ec56997973', boh_cl_6, 'Fold laundry from shift', 'checkbox', 15, '7:00 PM - 8:00 PM', 'green', false, false, false),
    ('69e31aa5-2f90-44cc-83ad-9d424ac98cb4', boh_cl_6, 'Check all wipes containers in gym/ pilates and restock as needed', 'checkbox', 16, '7:00 PM - 8:00 PM', 'green', false, false, false),
    ('a414ecee-f66b-4223-a9f9-458cc8c8320e', boh_cl_6, 'Check towel stock in all gym areas', 'checkbox', 17, '7:00 PM - 8:00 PM', 'green', false, false, false),
    ('a0cf513b-dbcf-4160-b26a-35b88aec0728', boh_cl_6, 'Clean bathrooms in mezzanine, recovery room and lounge (vacuum / wipe sofas)', 'checkbox', 18, '7:00 PM - 8:00 PM', 'green', false, false, false),
    ('a81fdbb5-c4f6-438b-962e-0ce304d95eb0', boh_cl_6, 'Ensure mop bucket used for room turnovers is empty, clean, and returned to the correct spot', 'checkbox', 19, '8:00 PM - 9:30 PM', 'orange', false, false, false),
    ('685998c9-5d36-49c8-859b-afad8d14d621', boh_cl_6, 'Café: Close umbrellas, stack cushions on café tables, cover with black covers, turn off lights, close curtains, sweep & mop', 'checkbox', 20, '8:00 PM - 9:30 PM', 'orange', false, false, false),
    ('e836a211-a918-460b-8e89-545b047afd52', boh_cl_6, 'Rooftop: Close umbrellas, cover machines, collect towels & trash', 'checkbox', 21, '8:00 PM - 9:30 PM', 'orange', false, false, false),
    ('1fd722ed-b5ad-4151-a35a-c3ae98d8c365', boh_cl_6, 'AFTER 8:45 PM: Remove nozzles from spa jugs, scrub clean, run through dishwasher, clean inside jug', 'checkbox', 22, '8:00 PM - 9:30 PM', 'orange', false, false, false),
    ('5f0b0928-dc3d-40c6-bea4-b2b17e34f5c6', boh_cl_6, 'Mop all floors and wipe surfaces throughout the club (cardio, entrance, main gym floor, café)', 'checkbox', 23, '8:00 PM - 9:30 PM', 'orange', false, false, false),
    ('6976910a-a36f-4181-8216-5bf0fc9aaa75', boh_cl_6, 'Empty trash cans and replace liners on all gym floors', 'checkbox', 24, '8:00 PM - 9:30 PM', 'orange', false, false, false),
    ('e4cb9452-be25-43a3-a823-6f6d25dd4ea8', boh_cl_6, 'Were there any obstacles today?', 'free_response', 25, 'End of Shift', 'gray', false, false, false),
    ('aa72ea93-9dde-4ae1-b8d5-185698052b2b', boh_cl_6, 'Did you receive or overhear any member feedback?', 'free_response', 26, 'End of Shift', 'gray', false, false, false),
    ('c8458a4c-5ca2-402b-a0cc-c9df7f147950', boh_cl_6, 'Do you have any additional notes for management?', 'free_response', 27, 'End of Shift', 'gray', false, false, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO boh_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('50438eee-8725-4993-baf1-81bfbc43b61f', boh_cl_7, 'Restock medium towels on main gym floor.', 'checkbox', 3, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('4f92ee4f-cc51-41f5-80e8-1bb2261df61e', boh_cl_7, 'Restock towels as needed in spa.', 'checkbox', 4, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('1d265e80-94ea-40e8-b577-b36eefdd379a', boh_cl_7, 'Wipe down vanity counters & restock as needed.', 'checkbox', 5, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('c628b408-1bb3-4a8a-acff-c1d14355040f', boh_cl_7, 'Cold plunge: clean debris, ensure water is clear/cold/jets working. Add ice if needed. 45°F left / 55°F right.', 'checkbox', 6, '3:00 PM - 4:00 PM', 'blue', false, false, false),
    ('be990d4a-3d54-4ea7-8616-9127ffe7113e', boh_cl_7, 'Refill toilet paper, napkins, and water cups.', 'checkbox', 7, '3:00 PM - 4:00 PM', 'blue', false, false, false),
    ('c4b61e76-efee-47ab-97e4-fc8afeb4aed3', boh_cl_7, 'Check cleanliness of toilets — clean as needed.', 'checkbox', 8, '3:00 PM - 4:00 PM', 'blue', false, false, false),
    ('8a679c4e-94eb-4f6d-9ca9-8f88f3ef21c4', boh_cl_7, 'Dry floors as needed.', 'checkbox', 9, '3:00 PM - 4:00 PM', 'blue', false, false, false),
    ('67621590-1e2a-4b0b-90be-b7298c1fe795', boh_cl_7, 'Wipe down all countertop surfaces on both sides of main gym floor.', 'checkbox', 10, '3:00 PM - 4:00 PM', 'blue', false, false, false),
    ('1e4a79f4-c700-439b-aa74-0987d231f4a1', boh_cl_7, 'Complete Weekly Task according to the day.', 'multiple_choice', 11, '4:00 PM - 5:00 PM', 'orange', false, false, false),
    ('bf46425c-c99e-4337-b1ee-b8b28bea5404', boh_cl_7, 'Mop locker room floors as needed.', 'checkbox', 12, '4:00 PM - 5:00 PM', 'orange', false, false, false),
    ('9ff32f6e-8740-44e1-b685-a7a7ad0150df', boh_cl_7, 'Recurring tasks: dry floors, restock towels & products, check showers, collect dirty towels, close lockers, tidy vanities, top off spa water.', 'checkbox', 13, '4:00 PM - 5:00 PM', 'orange', false, false, false),
    ('92b4555c-2172-4313-a974-963646c7d24d', boh_cl_7, 'Stock all amenities: razors, underwear, q-tips, cotton pads, tampons, pads, hair ties.', 'checkbox', 14, '4:00 PM - 5:00 PM', 'orange', false, false, false),
    ('11279c9d-588c-4b73-984f-9e81fe18f2d6', boh_cl_7, '4 PM: Place dirty towel bin in elevator; retrieve clean towels and restock spa', 'checkbox', 15, '4:00 PM - 5:00 PM', 'red', true, true, false),
    ('da0b1ee9-186a-4a1f-88bf-3159631febf8', boh_cl_7, 'Take out trash if needed.', 'checkbox', 16, '4:00 PM - 5:00 PM', 'orange', false, false, false),
    ('d525ef3f-7376-41b4-9d97-8b0ef2b42e0c', boh_cl_7, 'Clean cold tub filter & use the skimmer for debris.', 'checkbox', 17, '4:00 PM - 5:00 PM', 'orange', false, false, false),
    ('cd3b594f-2194-4e0f-8864-9dc276965fc2', boh_cl_7, 'BREAK: 4:20–4:50 PM. Break MUST be taken before 5 PM, no exceptions.', 'signature', 18, '4:20 PM - 5:00 PM', 'red', true, true, false),
    ('89077036-c3e8-4623-bfb3-bd6aed996487', boh_cl_7, '5 PM: Place dirty towel bin in elevator; retrieve clean towels and restock spa', 'checkbox', 19, '5:00 PM - 6:00 PM', 'red', true, true, false),
    ('489df9d6-1f10-41c7-a8bd-388d40e817fa', boh_cl_7, 'Recurring tasks: dry floors, restock towels, check showers, collect dirty towels, close lockers, tidy vanities, top off spa water.', 'checkbox', 20, '5:00 PM - 6:00 PM', 'blue', false, false, false),
    ('96fb310c-6813-44c4-b5b6-097949fb1046', boh_cl_7, 'Clean cold tub filter & use the skimmer for debris.', 'checkbox', 21, '5:00 PM - 6:00 PM', 'blue', false, false, false),
    ('1ca81114-8f08-45aa-ae18-631bcf38a94e', boh_cl_7, 'Take out spa trash.', 'checkbox', 22, '5:00 PM - 6:00 PM', 'blue', false, false, false),
    ('417b3bb7-2040-4cd6-b2b2-c251b3003179', boh_cl_7, '6 PM: Place dirty towel bin in elevator; retrieve clean towels and restock spa', 'checkbox', 23, '6:00 PM - 7:00 PM', 'red', true, true, false),
    ('a169968f-dff9-4d91-a95f-e191ce7332bd', boh_cl_7, 'Complete recurring tasks as needed.', 'checkbox', 24, '6:00 PM - 7:00 PM', 'green', false, false, false),
    ('fbe2c4fe-1ec0-441b-bdc4-c71d3d704d6d', boh_cl_7, 'Wipe sauna & steam room doors for fingerprints.', 'checkbox', 25, '6:00 PM - 7:00 PM', 'green', false, false, false),
    ('9b48fc9b-6947-4fe7-843e-cbde75ea1557', boh_cl_7, 'Mop locker rooms.', 'checkbox', 39, '8:30 PM - 10:00 PM', 'orange', false, false, false),
    ('c1a34461-4ac2-4a72-acc6-561c852258ed', boh_cl_7, 'Clean cold tub filter & use the skimmer for debris.', 'checkbox', 26, '6:00 PM - 7:00 PM', 'green', false, false, false),
    ('5f6bfcbc-3ea5-4e97-b85b-40329ae3abb4', boh_cl_7, '7 PM: Place dirty towel bin in elevator; retrieve clean towels and restock spa', 'checkbox', 27, '7:00 PM - 8:30 PM', 'red', true, true, false),
    ('f15a7118-fb2b-4ade-83b7-5d20f49de202', boh_cl_7, 'Complete recurring tasks as needed.', 'checkbox', 28, '7:00 PM - 8:30 PM', 'purple', false, false, false),
    ('f13ccc6d-251a-4d8a-8c55-1bcdb2711624', boh_cl_7, 'Wipe mirrors.', 'checkbox', 29, '7:00 PM - 8:30 PM', 'purple', false, false, false),
    ('234a4c7c-ae05-4f19-b4a2-a1307f8ed135', boh_cl_7, '8:30: Close down one tub, drain, run hose 20 min, wipe inside; repeat on second tub', 'photo', 30, '8:30 PM - 10:00 PM', 'orange', false, false, false),
    ('b8a5d414-a839-48ec-9009-7b1492c92678', boh_cl_7, 'Scrub steam room with Marble Plus & hose down (remove hair, leave door open).', 'checkbox', 31, '8:30 PM - 10:00 PM', 'orange', false, false, false),
    ('9ff42fc5-6345-41c9-9962-24e1b185945a', boh_cl_7, 'Spray water down steam room & sauna floor drains 1-2 min.', 'checkbox', 32, '8:30 PM - 10:00 PM', 'orange', false, false, false),
    ('0a2217e9-4e0f-4196-bbe2-103212d32d16', boh_cl_7, 'Clean sauna as outlined in attached document.', 'photo', 33, '8:30 PM - 10:00 PM', 'orange', false, false, false),
    ('9ec84493-6a20-423c-9486-fabc659e995e', boh_cl_7, 'Check cold tubs for cleanliness & scrub wooden platform; rinse thoroughly.', 'checkbox', 34, '8:30 PM - 10:00 PM', 'orange', false, false, false),
    ('5c2b1f7c-5ec5-441a-bfdf-1f1cabbd32f7', boh_cl_7, 'Check & clean cold tub filter behind cold tubs.', 'photo', 35, '8:30 PM - 10:00 PM', 'orange', false, false, false),
    ('1d1ee2c7-e0a7-4e19-ad6e-64d365b812c6', boh_cl_7, 'Showers: scrub all surfaces w/ brush + diluted bleach; clear drains; rinse; leave grate off.', 'photo', 36, '8:30 PM - 10:00 PM', 'orange', false, false, false),
    ('2d2a68ff-81f3-4998-9769-7ae3598a6e46', boh_cl_7, 'Scrub floors around cold tubs & clean cold tub shower walls/floor.', 'checkbox', 37, '8:30 PM - 10:00 PM', 'orange', false, false, false),
    ('0d163641-81c7-4fd0-8b11-5ce29769a39e', boh_cl_7, 'Break MUST be taken BEFORE 5 PM. No exceptions. Please sign if understood', 'signature', 0, '2:00 PM - 3:00 PM', 'red', true, true, false),
    ('d7476a4d-85ab-4025-9923-1fa980b4cfb3', boh_cl_7, 'Pick up Walkie-Talkie & locker key', 'photo', 1, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('b73d24c9-d0a0-4863-8799-92f44ccc7c5b', boh_cl_7, 'Ensure enough towels in ground floor studio.', 'checkbox', 2, '2:00 PM - 3:00 PM', 'yellow', false, false, false),
    ('755ac78d-cbb7-4745-91c3-0d6d6ccd7932', boh_cl_7, 'Clean toilets thoroughly.', 'checkbox', 38, '8:30 PM - 10:00 PM', 'orange', false, false, false),
    ('62ee91d6-4f44-4ac3-8a8c-8dc95d471a6c', boh_cl_7, 'Return walkie talkie to charger & locker key to desk', 'checkbox', 40, '8:30 PM - 10:00 PM', 'orange', false, false, false),
    ('8a79b5b4-819e-4031-b631-8093881e1066', boh_cl_7, 'Take out spa trash.', 'checkbox', 41, '8:30 PM - 10:00 PM', 'orange', false, false, false),
    ('f3576f50-0417-4c6b-89bb-9bb9197f0ad6', boh_cl_7, 'Were there any obstacles today?', 'free_response', 42, 'End of Shift', 'gray', false, false, false),
    ('d1efab44-0d39-4e0a-8826-4e4398dc4315', boh_cl_7, 'Did you receive or overhear any member feedback?', 'free_response', 43, 'End of Shift', 'gray', false, false, false),
    ('7809ca80-6d4e-4d8e-abc9-0bc34676edfd', boh_cl_7, 'Do you have any additional notes for management?', 'free_response', 44, 'End of Shift', 'gray', false, false, false),
    ('32c1cb60-4208-4e2c-9578-c659e563674d', boh_cl_7, 'Did you experience any issues with the cold tubs?', 'free_response', 45, 'End of Shift', 'gray', false, false, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO boh_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('8eb8a6c7-106f-4fe4-b2bc-0941c5a22930', boh_cl_8, 'Break MUST be taken BEFORE 10:30 AM. No exceptions. Please sign if understood', 'signature', 0, '5:30 AM - 6:15 AM', 'red', true, true, false),
    ('b67ed7f4-6fc9-4d94-a9bf-f1e04e7b0cf9', boh_cl_8, 'Pick up Walkie-Talkie & locker key', 'checkbox', 1, '5:30 AM - 6:15 AM', 'orange', false, false, false),
    ('f79382c6-8def-45a6-b020-9bbb10b3377b', boh_cl_8, 'Close steam room and sauna doors. Turn on sauna.', 'checkbox', 2, '5:30 AM - 6:15 AM', 'orange', false, false, false),
    ('ae0b009c-c9d1-4539-8270-55086e1f0900', boh_cl_8, 'Collect mop heads, black towels, and all towel sizes; place empty white bin in elevator.', 'checkbox', 3, '5:30 AM - 6:15 AM', 'orange', false, false, false),
    ('6b4b26e2-9579-49cc-86a1-b90aef944877', boh_cl_8, 'Ensure enough yoga & small towels in ground floor studio.', 'checkbox', 4, '5:30 AM - 6:15 AM', 'orange', false, false, false),
    ('259920f6-bed6-4623-aed6-20366d1001aa', boh_cl_8, 'Restock medium towels on main gym floor.', 'checkbox', 5, '5:30 AM - 6:15 AM', 'orange', false, false, false),
    ('6a870cb6-5c6e-44e1-b189-54daf2b5fceb', boh_cl_8, 'Restock towels as needed in spas.', 'checkbox', 6, '5:30 AM - 6:15 AM', 'orange', false, false, false),
    ('cd1eb41c-5049-4d15-8031-95c51de7bfe9', boh_cl_8, 'Cold plunge: clean debris, ensure water is clear/cold/jets working.', 'checkbox', 7, '6:15 AM - 7:00 AM', 'purple', false, false, false),
    ('85e29138-cc99-41db-aadd-6409a56c913c', boh_cl_8, 'Refill toilet paper, napkins, water cups.', 'checkbox', 8, '6:15 AM - 7:00 AM', 'purple', false, false, false),
    ('e2c2f275-3f23-4e11-a206-cfdd3e955d61', boh_cl_8, 'Check cleanliness of toilets.', 'checkbox', 9, '6:15 AM - 7:00 AM', 'purple', false, false, false),
    ('3fb87859-a069-44d4-a039-6aa4007e7207', boh_cl_8, 'Check showers for mold/trash/dirt.', 'checkbox', 10, '6:15 AM - 7:00 AM', 'purple', false, false, false),
    ('7d34472c-9015-488a-ac90-e7c50e644ae0', boh_cl_8, '7 AM: Place dirty towel bin in elevator for floater to pick up. Retrieve empty bin.', 'checkbox', 11, '7:00 AM - 8:00 AM', 'red', true, true, false),
    ('9e40447e-5bd9-4cac-ba37-fd9d2f6d3c89', boh_cl_8, 'Recurring tasks: dry floors, restock towels, check showers, collect dirty towels, close lockers, tidy vanities, top off spa water.', 'checkbox', 12, '7:00 AM - 8:00 AM', 'yellow', false, false, false),
    ('27a122fe-fe47-4d93-84af-8855a4d86136', boh_cl_8, 'Clean cold tub filter & skim debris.', 'checkbox', 13, '7:00 AM - 8:00 AM', 'yellow', false, false, false),
    ('35860dff-c460-4c7d-947c-eb96a7952146', boh_cl_8, '8 AM: Place dirty towel bin in elevator; retrieve clean bin and restock spa.', 'checkbox', 14, '8:00 AM - 9:00 AM', 'red', true, true, false),
    ('b9e9c214-a3dd-4a72-90c8-3bdfa3f01bea', boh_cl_8, 'Recurring tasks: dry floors, restock towels, check showers, collect dirty towels, close lockers, tidy vanities.', 'checkbox', 15, '8:00 AM - 9:00 AM', 'blue', false, false, false),
    ('d7fa2ab1-7850-4c92-b7d7-44715dd2320a', boh_cl_8, 'Clean cold tub filter & skim debris.', 'checkbox', 16, '8:00 AM - 9:00 AM', 'blue', false, false, false),
    ('58e3537c-84da-4967-82be-1b22fc93d323', boh_cl_8, '9 AM: Place dirty towel bin in elevator; retrieve clean bin and restock spa.', 'checkbox', 17, '9:00 AM - 10:00 AM', 'red', true, true, false),
    ('f8482134-63c7-4d86-ae2d-07eeff03b840', boh_cl_8, 'Recurring tasks: dry floors, restock towels & products, check showers, collect dirty towels, close lockers.', 'checkbox', 18, '9:00 AM - 10:00 AM', 'green', false, false, false),
    ('2018f012-b347-421c-86de-a95cbb624f9c', boh_cl_8, 'BREAK 9:45-10:15 AM. Break MUST be taken before 10:30 AM, no exceptions.', 'signature', 19, '9:00 AM - 10:00 AM', 'red', true, true, false),
    ('eece2f0d-5cf3-482f-95fe-3fd0640f7b41', boh_cl_8, 'Take out spa trash', 'checkbox', 20, '10:00 AM - 11:00 AM', 'blue', false, false, false),
    ('c5de9776-ece8-41f3-9f6b-491d2be541c5', boh_cl_8, 'Wipe sauna & steam room doors for fingerprints.', 'checkbox', 21, '10:00 AM - 11:00 AM', 'blue', false, false, false),
    ('af30b571-fb5b-41ce-bfff-86ec7473d075', boh_cl_8, 'Check cabinets above lockers & under sink for amenities; restock from back office.', 'checkbox', 22, '10:00 AM - 11:00 AM', 'blue', false, false, false),
    ('141588be-cb1e-4faa-8d70-424e3ac8ab2f', boh_cl_8, 'Refill shampoo & conditioner.', 'checkbox', 23, '10:00 AM - 11:00 AM', 'blue', false, false, false),
    ('3ed759c2-98e9-4321-8dc8-018b729dea80', boh_cl_8, '11 AM: Place dirty towel bin in elevator; retrieve clean bin and restock spa.', 'checkbox', 24, '11:00 AM - 12:00 PM', 'red', true, true, false),
    ('2e75aadd-9900-4587-9d5a-3736b11994c0', boh_cl_8, 'Scrub showers as needed (1 photo).', 'photo', 25, '11:00 AM - 12:00 PM', 'orange', false, false, false),
    ('edc01b68-e73c-4326-8678-a51a22a2adfc', boh_cl_8, 'Complete recurring tasks as needed.', 'checkbox', 26, '11:00 AM - 12:00 PM', 'orange', false, false, false),
    ('7bb46c17-7bb5-4f00-addb-a3a914a422d9', boh_cl_8, 'Complete recurring tasks as needed.', 'checkbox', 27, '12:00 PM - 1:00 PM', 'purple', false, false, false),
    ('8925a745-324c-46dc-92dd-fd7609d1254d', boh_cl_8, 'Clean toilets.', 'checkbox', 28, '12:00 PM - 1:00 PM', 'purple', false, false, false),
    ('75b5c067-d5fb-4165-9c78-607210378cc6', boh_cl_8, 'Wipe mirrors.', 'checkbox', 29, '12:00 PM - 1:00 PM', 'purple', false, false, false),
    ('ac69261f-51c4-4918-8c7a-271ee2950674', boh_cl_8, 'Complete Weekly Task', 'multiple_choice', 30, '12:00 PM - 1:00 PM', 'purple', false, false, false),
    ('0ebd30ca-f0ff-4005-a47d-dac35ae6e6b3', boh_cl_8, '1 PM: Place dirty towel bin in elevator; retrieve clean bin and restock spa.', 'checkbox', 31, '1:00 PM - 2:00 PM', 'red', true, true, false),
    ('578195ec-c54a-4b32-955f-f0e25e84e7d1', boh_cl_8, 'Check & clean cold tub filter behind tubs.', 'checkbox', 32, '1:00 PM - 2:00 PM', 'blue', false, false, false),
    ('50e357ed-0c58-4209-9532-e57cadecfc79', boh_cl_8, 'Complete recurring tasks as needed.', 'checkbox', 33, '1:00 PM - 2:00 PM', 'blue', false, false, false),
    ('c91b24cf-2136-4b8c-9109-7bb169e111c1', boh_cl_8, 'Return walkie talkie to charger & locker key to desk', 'checkbox', 34, '1:00 PM - 2:00 PM', 'blue', false, false, false),
    ('d9094091-374a-4561-bda2-af2b9a3d4537', boh_cl_8, 'Take out trash.', 'checkbox', 35, '1:00 PM - 2:00 PM', 'blue', false, false, false),
    ('182f75dd-c9a9-477c-b99c-32271d14147f', boh_cl_8, 'Were there any obstacles today?', 'free_response', 36, 'End of Shift', 'gray', false, false, false),
    ('975551bc-7f43-47d1-adc0-7d498fcffac7', boh_cl_8, 'Did you receive or overhear any member feedback?', 'free_response', 37, 'End of Shift', 'gray', false, false, false),
    ('2290b80a-fed5-475a-a6e0-f0400f87d0b0', boh_cl_8, 'How accurate was the checklist to the needs & flow of the day?', 'free_response', 38, 'End of Shift', 'gray', false, false, false),
    ('e60d8cbf-477e-47ac-888a-0580a4889092', boh_cl_8, 'Any additional notes for management?', 'free_response', 39, 'End of Shift', 'gray', false, false, false),
    ('f89f4ae4-0611-412f-8c15-4e561da392b7', boh_cl_8, 'Did you experience any issues with the cold tubs?', 'free_response', 40, 'End of Shift', 'gray', false, false, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO boh_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('95aec103-b7a4-4b97-89d6-d2942f199139', boh_cl_9, 'Pick up walkie talkie', 'checkbox', 0, '8:30 AM - 9:00 AM', 'blue', false, false, false),
    ('9ac2511b-e2f8-45f2-a2c2-ab5e1b5b44db', boh_cl_9, 'Review Class Schedule to Determine Turnover Times', 'checkbox', 1, '8:30 AM - 9:00 AM', 'red', true, true, false),
    ('c1217a46-adc5-444c-b22d-3994fc4b29f3', boh_cl_9, 'Take dirty towels from the garage down to the basement', 'checkbox', 2, '8:30 AM - 9:00 AM', 'blue', false, false, false),
    ('53229321-042f-4806-b971-6b83d824ace7', boh_cl_9, 'Start Laundry', 'checkbox', 3, '8:30 AM - 9:00 AM', 'blue', false, false, false),
    ('f9891d67-c6e5-4485-96bc-b9fff6262e2c', boh_cl_9, 'Class Turnover, if applicable', 'checkbox', 4, '9:00 AM - 10:00 AM', 'red', true, true, false),
    ('40f9f44e-ce60-4033-b71a-3d5f19709550', boh_cl_9, 'Vacuum mezzanine & wet mop private recovery room', 'checkbox', 5, '9:00 AM - 10:00 AM', 'orange', false, false, false),
    ('a561ed4c-f49f-48b7-b27a-4c65cd356152', boh_cl_9, 'FULLY COMPLETE BEFORE 9:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 9:50', 'checkbox', 6, '9:00 AM - 10:00 AM', 'red', true, true, false),
    ('d5af8f72-1fa4-4ec3-89c7-7be025215b14', boh_cl_9, 'Class Turnover, if applicable', 'checkbox', 7, '10:00 AM - 11:00 AM', 'red', true, true, false),
    ('d624d897-02ea-4658-91f3-05c4c9cdab91', boh_cl_9, 'Rotate Laundry', 'checkbox', 8, '10:00 AM - 11:00 AM', 'purple', false, false, false),
    ('9094fd59-543d-46e0-8e81-dbb1cc7ad1ad', boh_cl_9, 'FULLY COMPLETE BEFORE 10:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 10:50', 'checkbox', 9, '10:00 AM - 11:00 AM', 'red', true, true, false),
    ('42408a6f-27ac-4a30-b6f6-8c422221a119', boh_cl_9, 'Class Turnover, if applicable', 'checkbox', 10, '11:00 AM - 12:00 PM', 'red', true, true, false),
    ('8d625030-176b-47a1-bf61-9ea8accbe4ed', boh_cl_9, 'Wipe down all countertop surfaces on both sides of main gym floor', 'checkbox', 11, '11:00 AM - 12:00 PM', 'green', false, false, false),
    ('58735235-ac52-4bc2-920c-3ca281bd7c4c', boh_cl_9, 'FULLY COMPLETE BEFORE 11:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 11:50', 'checkbox', 12, '11:00 AM - 12:00 PM', 'red', true, true, false),
    ('5a4fde06-9270-40e6-90eb-4c761dc2ae64', boh_cl_9, 'Class Turnover, if applicable', 'checkbox', 13, '12:00 PM - 1:00 PM', 'red', true, true, false),
    ('5afae25b-9536-4597-aa26-d1a9489dd0b8', boh_cl_9, 'Sweep & mop pilates room', 'checkbox', 14, '12:00 PM - 1:00 PM', 'yellow', false, false, false),
    ('f443f947-37b3-4741-966b-3c85dfce1733', boh_cl_9, 'FULLY COMPLETE BEFORE 12:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 12:50', 'checkbox', 15, '12:00 PM - 1:00 PM', 'red', true, true, false),
    ('e1947565-8ae7-40a2-9165-cd077640fd0f', boh_cl_9, 'Class Turnover, if applicable', 'checkbox', 16, '1:00 PM - 2:15 PM', 'red', true, true, false),
    ('e06abb37-9b23-487b-8c29-23b6485d0f1d', boh_cl_9, 'Wipe down mirrors in main gym floor', 'checkbox', 17, '1:00 PM - 2:15 PM', 'orange', false, false, false),
    ('05f9626e-679c-4787-8891-ea701b490704', boh_cl_9, 'Check mezzanine bathrooms for cleanliness & restock as needed', 'checkbox', 18, '1:00 PM - 2:15 PM', 'orange', false, false, false),
    ('1b7d9203-c3bc-47b7-87af-6dbb4aa2c950', boh_cl_9, 'Spot sweep / dry mop as needed in main gym floor', 'checkbox', 19, '1:00 PM - 2:15 PM', 'orange', false, false, false),
    ('be2bc88d-6572-4c84-8f6b-728f443af4ee', boh_cl_9, 'Check towel stock in all gym areas', 'checkbox', 20, '1:00 PM - 2:15 PM', 'purple', false, false, false),
    ('4a3cd894-15a4-4035-96b8-9c07c72fdfec', boh_cl_9, 'Return Walkie Talkie to charger', 'checkbox', 21, '1:00 PM - 2:15 PM', 'purple', false, false, false),
    ('e8318a1c-2db0-43eb-a036-175bded05e4c', boh_cl_9, 'Were there any obstacles today?', 'free_response', 22, 'End of Shift', 'gray', false, false, false),
    ('35468c8f-41d2-4c5a-ac1e-c74c5bd1eb0f', boh_cl_9, 'Did you receive or overhear any member feedback?', 'free_response', 23, 'End of Shift', 'gray', false, false, false),
    ('7c8e1c6c-bd05-4b20-903d-28a941311a83', boh_cl_9, 'Do you have any additional notes for management?', 'free_response', 24, 'End of Shift', 'gray', false, false, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO boh_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('2c98b90e-cf0b-45f9-be70-3eab2c346188', boh_cl_10, 'Break MUST be taken BEFORE 10:20 AM. No exceptions. Please sign if understood', 'signature', 0, '5:30 AM - 6:30 AM', 'red', true, true, false),
    ('d4b90ef4-1482-4427-89d0-ecf9a7cfca67', boh_cl_10, 'Pick up Walkie-Talkie', 'checkbox', 1, '5:30 AM - 6:30 AM', 'blue', false, false, false),
    ('c1631338-bf5c-45a2-a139-89823aba4f57', boh_cl_10, '5:30: turn on sauna.', 'photo', 2, '5:30 AM - 6:30 AM', 'red', true, true, false),
    ('f00840e9-4936-48d2-a559-738fe474bd3c', boh_cl_10, 'Close steam room and sauna doors.', 'checkbox', 3, '5:30 AM - 6:30 AM', 'green', false, false, false),
    ('2ca6410a-edcf-425e-aea7-2452e6873374', boh_cl_10, 'Collect mop heads, black cleaning towels, all towel sizes from garage.', 'checkbox', 4, '5:30 AM - 6:30 AM', 'green', false, false, false),
    ('2006d71b-b4c2-42e4-9ef5-cdf71325052c', boh_cl_10, 'Stock medium towels in Cardio Room & large/medium towels in spa.', 'checkbox', 5, '5:30 AM - 6:30 AM', 'green', false, false, false),
    ('65d534d7-360b-44eb-9c4d-3033d20ad4eb', boh_cl_10, 'Cold plunge: remove debris; ensure water is clear/cold; jets working.', 'checkbox', 6, '6:30 AM - 7:00 AM', 'gray', false, false, false),
    ('735dd7c5-f7ae-4ae1-8a62-7b05d07a790d', boh_cl_10, 'ROOFTOP: ensure there are towels & mats for rooftop classes.', 'photo', 7, '6:30 AM - 7:00 AM', 'gray', false, false, false),
    ('561f0b12-290c-4362-bce8-cac9dc60823f', boh_cl_10, 'Leaves on rooftop? Clear with leaf blower.', 'yes_no', 8, '6:30 AM - 7:00 AM', 'gray', false, false, false),
    ('95a26a0c-a9f6-4cd6-9fa4-0b3cce1e6810', boh_cl_10, 'Start on café by 6:50 (take photo).', 'photo', 9, '6:30 AM - 7:00 AM', 'red', true, true, false),
    ('ee7961d2-05e4-45b8-9e50-309c15676da7', boh_cl_10, 'Café floors: dry as needed & sweep.', 'checkbox', 10, '6:30 AM - 7:00 AM', 'gray', false, false, false),
    ('9cadda03-7bc6-4c4e-a10e-eb142e075c09', boh_cl_10, 'Café cushions: place cushions throughout the space.', 'checkbox', 11, '6:30 AM - 7:00 AM', 'gray', false, false, false),
    ('4bf05198-4628-45dd-aa9e-98e102137b89', boh_cl_10, 'Towel drop: alert floater via walkie-talkie when ready.', 'checkbox', 12, '8:00 AM - 9:00 AM', 'orange', false, false, false),
    ('08418b07-5d1b-4c7c-a56e-b35631e67ef2', boh_cl_10, 'Recurring tasks: dry floors, restock towels/products, check showers, collect dirty towels, close lockers, restock paper items, tidy counters, top off spa water.', 'checkbox', 13, '8:00 AM - 9:00 AM', 'orange', false, false, false),
    ('636ce9a2-cb60-41c6-b90d-e24661d0cc6b', boh_cl_10, 'Clean cold tub filter & use skimmer for debris.', 'checkbox', 14, '8:00 AM - 9:00 AM', 'orange', false, false, false),
    ('c0344da4-7d92-4d11-9aa7-e259f6382354', boh_cl_10, 'Complete towel drop as needed.', 'checkbox', 15, '9:00 AM - 10:00 AM', 'purple', false, false, false),
    ('7d9e32b1-0f31-4796-9002-d44d365f0c6c', boh_cl_10, 'Recurring tasks: dry floors (no white towels), restock towels & products, check showers, collect dirty towels, close lockers, restock paper towels/TP, tidy counters, top off spa water.', 'checkbox', 16, '9:00 AM - 10:00 AM', 'purple', false, false, false),
    ('e0bf3afd-e73e-4e32-a111-241a789a0e46', boh_cl_10, 'Clean cold tub filter & use skimmer for debris.', 'checkbox', 17, '9:00 AM - 10:00 AM', 'purple', false, false, false),
    ('07c412ec-42cf-4f29-9884-a9c6bc1fc548', boh_cl_10, 'Break 9:45–10:15 AM. If you cannot take your break at this time, please explain. MUST be before 10:20 AM.', 'checkbox', 18, '9:00 AM - 10:00 AM', 'red', true, true, false),
    ('6864ea1b-1c4b-4aa2-a655-1de907bbf3bb', boh_cl_10, 'Complete towel drop as needed.', 'checkbox', 19, '10:00 AM - 11:00 AM', 'blue', false, false, false),
    ('effcb71a-2217-4708-b115-5503543d5002', boh_cl_10, 'Recurring tasks: dry floors (no white), restock towels & products, check showers, collect dirty towels, close lockers, restock paper towels/TP, tidy counters.', 'checkbox', 20, '10:00 AM - 11:00 AM', 'blue', false, false, false),
    ('fb3d07d2-2ec3-4b4c-a4c4-f9dac06aff98', boh_cl_10, 'Clean cold tub filter & use skimmer.', 'checkbox', 21, '10:00 AM - 11:00 AM', 'blue', false, false, false),
    ('c215dc2e-1332-4368-a513-82f21bca350c', boh_cl_10, 'Complete recurring tasks as needed.', 'checkbox', 22, '11:00 AM - 12:00 PM', 'blue', false, false, false),
    ('f5be5fe8-d106-41cc-b9f6-fed99ea9513a', boh_cl_10, 'Clean showers not in use.', 'checkbox', 23, '11:00 AM - 12:00 PM', 'blue', false, false, false),
    ('eb2939f2-fb7e-419d-8b54-f07cf1515200', boh_cl_10, 'Complete towel drop as needed.', 'checkbox', 24, '11:00 AM - 12:00 PM', 'blue', false, false, false),
    ('3210fcca-0ebf-4cf0-ae00-2b5da3a57d7f', boh_cl_10, 'Complete recurring tasks as needed.', 'checkbox', 25, '12:00 PM - 2:00 PM', 'yellow', false, false, false),
    ('8a5920e0-4245-4722-b066-ed46f980ab4b', boh_cl_10, 'Clean toilets.', 'checkbox', 26, '12:00 PM - 2:00 PM', 'yellow', false, false, false),
    ('90bcdcf7-e67d-44a9-b269-c0e86124d6b3', boh_cl_10, 'Complete towel drop as needed.', 'checkbox', 27, '12:00 PM - 2:00 PM', 'yellow', false, false, false),
    ('d16617a9-a6c7-406a-a901-308bb4cc722f', boh_cl_10, 'Wipe sauna & steam room doors for fingerprints.', 'checkbox', 28, '12:00 PM - 2:00 PM', 'yellow', false, false, false),
    ('8b156eb2-ec7d-4dd6-9be7-fb8741d5d3b3', boh_cl_10, 'Return Walkie Talkie to charger & locker key to desk', 'checkbox', 29, '12:00 PM - 2:00 PM', 'yellow', false, false, false),
    ('0e5ac495-b4e8-45c5-b45c-d643df525d31', boh_cl_10, 'Take out trash.', 'checkbox', 30, '12:00 PM - 2:00 PM', 'yellow', false, false, false),
    ('32458a27-5a14-49a9-ab61-0da997693c23', boh_cl_10, 'Were there any obstacles today?', 'free_response', 31, 'End of Shift', 'gray', false, false, false),
    ('79e24f76-aad0-4798-b4c7-9068ae5f3387', boh_cl_10, 'Did you receive or overhear any member feedback?', 'free_response', 32, 'End of Shift', 'gray', false, false, false),
    ('5188d54f-9a41-4f90-859a-87176321119f', boh_cl_10, 'How accurate was the checklist to the needs & flow of the day?', 'free_response', 33, 'End of Shift', 'gray', false, false, false),
    ('1c4ac343-cf14-4a71-90cf-3a927932db43', boh_cl_10, 'Do you have any additional notes for management?', 'free_response', 34, 'End of Shift', 'gray', false, false, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO boh_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('b9c0b2df-f3d3-4467-bb8a-380328e5b48c', boh_cl_11, 'Break MUST be taken BEFORE 10:20 AM. No exceptions. Please sign if understood', 'signature', 0, '6:30 AM - 7:00 AM', 'red', true, true, false),
    ('676684c3-5d0b-4582-931e-655fb61dbd31', boh_cl_11, 'Pick up Walkie-Talkie & locker key', 'checkbox', 1, '6:30 AM - 7:00 AM', 'orange', false, false, false),
    ('bd14ebb3-7333-4ecb-9c79-6d22eb288f88', boh_cl_11, 'Close steam room and sauna doors. Turn on sauna.', 'checkbox', 2, '6:30 AM - 7:00 AM', 'red', true, true, false),
    ('138a1b65-e676-4552-b52f-cba28c479243', boh_cl_11, 'Collect mop heads, black cleaning towels, all towel sizes from garage.', 'checkbox', 3, '6:30 AM - 7:00 AM', 'orange', false, false, false),
    ('6c16e024-779f-497e-97da-54cbcf990c24', boh_cl_11, 'Ensure enough yoga & small towels in ground floor studio.', 'checkbox', 4, '6:30 AM - 7:00 AM', 'orange', false, false, false),
    ('562838a6-5758-4115-8fa4-f5769199ead6', boh_cl_11, 'Restock medium towels on main gym floor.', 'checkbox', 5, '6:30 AM - 7:00 AM', 'orange', false, false, false),
    ('f0dc8d27-29c5-4805-b979-ad0e96021e24', boh_cl_11, 'Restock towels as needed in spa.', 'checkbox', 6, '6:30 AM - 7:00 AM', 'orange', false, false, false),
    ('b4de1432-e008-4a47-a8a6-83a22c24839f', boh_cl_11, 'Cold plunge: clean debris, ensure water is clear/cold/jets working.', 'checkbox', 7, '7:00 AM - 8:00 AM', 'purple', false, false, false),
    ('274cc746-4390-47c3-8ad6-67408bc0d25f', boh_cl_11, 'Refill toilet paper, napkins, water cups.', 'checkbox', 8, '7:00 AM - 8:00 AM', 'purple', false, false, false),
    ('d715d082-e518-48f3-bc2b-0bc50be992e7', boh_cl_11, 'Check cleanliness of toilets.', 'checkbox', 9, '7:00 AM - 8:00 AM', 'purple', false, false, false),
    ('05e5deaf-d8fd-4a79-9f53-6c8fd0e85b0d', boh_cl_11, 'Check showers for mold/trash/dirt.', 'checkbox', 10, '7:00 AM - 8:00 AM', 'purple', false, false, false),
    ('457e9896-f743-447a-85eb-8abab51449db', boh_cl_11, 'Towel drop: alert floater via walkie-talkie when ready.', 'checkbox', 11, '8:00 AM - 9:00 AM', 'orange', false, false, false),
    ('fc475f4f-5088-4683-8321-22c1aa018af3', boh_cl_11, 'Recurring tasks: dry floors, restock towels/products, check showers, collect dirty towels, close lockers, restock paper items, tidy counters, top off spa water.', 'checkbox', 12, '8:00 AM - 9:00 AM', 'orange', false, false, false),
    ('3c020a6e-f617-4e89-a0f5-31961b99e84e', boh_cl_11, 'Clean cold tub filter & use skimmer for debris.', 'checkbox', 13, '8:00 AM - 9:00 AM', 'orange', false, false, false),
    ('23b37b40-e068-46e8-ab96-e3db36880362', boh_cl_11, 'Complete towel drop as needed.', 'checkbox', 14, '9:00 AM - 10:00 AM', 'purple', false, false, false),
    ('770f1703-ea70-4615-88b1-522beae3dc99', boh_cl_11, 'Recurring tasks: dry floors (no white towels), restock towels & products, check showers, collect dirty towels, close lockers, restock paper towels/TP, tidy counters, top off spa water.', 'checkbox', 15, '9:00 AM - 10:00 AM', 'purple', false, false, false),
    ('9d5f5faf-21eb-4ba1-9a44-2e9303edf333', boh_cl_11, 'Clean cold tub filter & use skimmer for debris.', 'checkbox', 16, '9:00 AM - 10:00 AM', 'purple', false, false, false),
    ('878b7168-55f7-42f2-a7c6-ddd882897f66', boh_cl_11, 'BREAK 10-10:30 AM. Break MUST be taken before 11 AM, no exceptions.', 'signature', 17, '10:00 AM - 11:00 AM', 'red', true, true, false),
    ('13347c0b-e5f7-47bd-b719-9b368ce72ef0', boh_cl_11, 'Take out spa trash', 'checkbox', 18, '10:00 AM - 11:00 AM', 'blue', false, false, false),
    ('be6c020d-9364-4332-a558-aa0f1d8a7a33', boh_cl_11, 'Wipe sauna & steam room doors for fingerprints.', 'checkbox', 19, '10:00 AM - 11:00 AM', 'blue', false, false, false),
    ('2094d6d7-eed5-4f60-9051-0c296c6e0fb4', boh_cl_11, 'Place dirty towel bin in elevator; retrieve clean bin and restock spa.', 'checkbox', 20, '11:00 AM - 12:00 PM', 'red', true, true, false),
    ('706ea14f-2bd3-438d-be83-7a82ad376e5e', boh_cl_11, 'Scrub showers as needed (1 photo).', 'photo', 21, '11:00 AM - 12:00 PM', 'orange', false, false, false),
    ('7804de1d-ecb5-4280-80ee-4b8f7f6600cc', boh_cl_11, 'Complete recurring tasks as needed.', 'checkbox', 22, '11:00 AM - 12:00 PM', 'orange', false, false, false),
    ('310ddac7-1129-4a96-a4a6-3e0f0f7cb1ae', boh_cl_11, 'Place dirty towel bin in elevator; retrieve clean bin and restock spa.', 'checkbox', 23, '12:00 PM - 1:00 PM', 'red', true, true, false),
    ('395a5c7f-f945-4f8a-b11d-caee5310104b', boh_cl_11, 'Return walkie talkie to charger & locker key to desk', 'checkbox', 24, '12:00 PM - 1:00 PM', 'blue', false, false, false),
    ('d942873f-4500-4823-8efb-664d0d08ad84', boh_cl_11, 'Take out trash.', 'checkbox', 25, '12:00 PM - 1:00 PM', 'blue', false, false, false),
    ('b26641ea-f2f0-43fa-b9f9-2e28a71be8a7', boh_cl_11, 'Were there any obstacles today?', 'free_response', 26, 'End of Shift', 'gray', false, false, false),
    ('f6d8599b-1915-4c8d-8c15-3334580c9ebb', boh_cl_11, 'Did you receive or overhear any member feedback?', 'free_response', 27, 'End of Shift', 'gray', false, false, false),
    ('495fa9ee-e3d6-4233-8ef9-a25f918d9e79', boh_cl_11, 'Any additional notes for management?', 'free_response', 28, 'End of Shift', 'gray', false, false, false),
    ('c68c3699-7293-4243-856e-90c42e835e16', boh_cl_11, 'Did you experience any issues with the cold tubs?', 'free_response', 29, 'End of Shift', 'gray', false, false, false) ON CONFLICT (id) DO NOTHING;

  INSERT INTO boh_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, color, is_high_priority, required, is_class_triggered) VALUES
    ('71cd1e5d-3742-4567-b839-e100b4f5c94f', boh_cl_12, 'Pick up walkie talkie', 'checkbox', 0, '2:00 PM - 3:00 PM', 'blue', false, false, false),
    ('2eb3e9c9-72bb-4829-a6fb-e4166b4fdb87', boh_cl_12, 'Review Class Schedule to Determine Turnover Times', 'checkbox', 1, '2:00 PM - 3:00 PM', 'red', true, true, false),
    ('dbf3af4c-816a-4a8c-a607-79e752b60a35', boh_cl_12, 'Begin laundry', 'checkbox', 2, '2:00 PM - 3:00 PM', 'blue', false, false, false),
    ('550c10cf-6cda-4f6e-a3de-68d620a913a3', boh_cl_12, 'If needed, fold laundry leftover from the morning', 'checkbox', 3, '2:00 PM - 3:00 PM', 'blue', false, false, false),
    ('1a271e4f-ac17-4d91-98fc-b68320ee81d4', boh_cl_12, 'Vacuum mezzanine & wet mop private recovery room', 'checkbox', 4, '2:00 PM - 3:00 PM', 'blue', false, false, false),
    ('17036919-b750-4373-a639-2fc260d494cb', boh_cl_12, 'Class Turnover, if applicable', 'checkbox', 5, '3:00 PM - 4:00 PM', 'red', true, true, false),
    ('0e15d0da-523e-404d-8997-7e629dd5fa28', boh_cl_12, 'FULLY COMPLETE BY 3:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 3:50', 'checkbox', 6, '3:00 PM - 4:00 PM', 'red', true, true, false),
    ('635081fa-049b-44c7-97f1-36d9c28e041f', boh_cl_12, 'BI-MONTHLY TASK', 'multiple_choice', 7, '3:00 PM - 4:00 PM', 'yellow', false, false, false),
    ('5f19102f-a379-42b0-b4e8-a42004d71a31', boh_cl_12, 'Class Turnover, if applicable', 'checkbox', 8, '4:00 PM - 5:00 PM', 'red', true, true, false),
    ('bf6fd0d1-4a7b-400b-aa0d-63ab62e17ca8', boh_cl_12, 'FULLY COMPLETE BY 4:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 4:50', 'checkbox', 9, '4:00 PM - 5:00 PM', 'red', true, true, false),
    ('e76c94be-87a5-4fef-bb1c-1e7d6c20acf2', boh_cl_12, 'Wipe down mirrors in main gym floor', 'checkbox', 10, '4:00 PM - 5:00 PM', 'purple', false, false, false),
    ('2483b3a7-898e-45fc-b66d-c1e30a1deb9f', boh_cl_12, 'Check mezzanine bathrooms for cleanliness & restock as needed', 'checkbox', 11, '4:00 PM - 5:00 PM', 'purple', false, false, false),
    ('874709bc-d703-4d0d-88e4-3ed0866020ed', boh_cl_12, 'Spot sweep/ dry mop as needed in main gym floor', 'checkbox', 12, '4:00 PM - 5:00 PM', 'purple', false, false, false),
    ('6dcb4c68-c527-4165-a2ba-303a4e7ec642', boh_cl_12, 'Class Turnover, if applicable', 'checkbox', 13, '5:00 PM - 6:00 PM', 'red', true, true, false),
    ('7218c225-aaa4-477e-b12c-0ccb1355aed4', boh_cl_12, 'FULLY COMPLETE BY 5:50 PM: Retrieve dirty towel bin; complete towel drop; restock; place back before 5:50', 'checkbox', 14, '5:00 PM - 6:00 PM', 'red', true, true, false),
    ('07c58442-19c3-47cd-9c2d-41b8f982aaf9', boh_cl_12, 'Fold laundry from shift', 'checkbox', 15, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('478971c6-62c8-4cd7-96e5-6323ebffd545', boh_cl_12, 'Check all wipes containers in gym/ pilates and restock as needed', 'checkbox', 16, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('b6e111c2-8744-4575-a24b-e9f3ade7f038', boh_cl_12, 'Check towel stock in all gym areas', 'checkbox', 17, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('dfd94185-0e93-40d5-abef-595958babffb', boh_cl_12, 'Clean bathrooms in mezzanine, recovery room and lounge (vacuum / wipe sofas)', 'checkbox', 18, '5:00 PM - 6:00 PM', 'green', false, false, false),
    ('e9aa4390-2b68-4ce9-b2dd-e5ee05d47482', boh_cl_12, 'Class Turnover, if applicable', 'checkbox', 19, '6:00 PM - 7:30 PM', 'red', true, true, false),
    ('8a191b1c-6cd3-4512-9800-3394b3aaad25', boh_cl_12, 'Ensure mop bucket used for room turnovers is empty, clean, and returned to the correct spot', 'checkbox', 20, '6:00 PM - 7:30 PM', 'orange', false, false, false),
    ('5454e9ad-be64-4e5f-ac08-f728db72c7bd', boh_cl_12, 'Café: Close umbrellas, stack cushions on café tables, cover with black covers, turn off lights, close curtains, sweep & mop', 'checkbox', 21, '6:00 PM - 7:30 PM', 'orange', false, false, false),
    ('1dfbb202-e5ab-48a7-bda0-0541c3ecf076', boh_cl_12, 'Rooftop: Close umbrellas, cover machines, collect towels & trash', 'checkbox', 22, '6:00 PM - 7:30 PM', 'orange', false, false, false),
    ('e034ee9f-ac3d-4fdc-b9c7-75b11b61082a', boh_cl_12, 'AFTER 6:30: Remove nozzles from spa jugs, scrub clean, run through dishwasher, clean inside jug', 'checkbox', 23, '6:00 PM - 7:30 PM', 'orange', false, false, false),
    ('cadec64d-9617-4327-909b-f69b75736a08', boh_cl_12, 'Mop all floors and wipe surfaces throughout the club (cardio, entrance, main gym floor, café)', 'checkbox', 24, '6:00 PM - 7:30 PM', 'orange', false, false, false),
    ('6e67b56e-1c3a-4a7f-894c-09b6162d98f0', boh_cl_12, 'Empty trash cans and replace liners on all gym floors', 'checkbox', 25, '6:00 PM - 7:30 PM', 'orange', false, false, false),
    ('3a87bb5b-60cf-46f9-bc93-330764b52120', boh_cl_12, 'Were there any obstacles today?', 'free_response', 26, 'End of Shift', 'gray', false, false, false),
    ('21ff8ac0-bb69-463a-bf91-10c17ceb4514', boh_cl_12, 'Did you receive or overhear any member feedback?', 'free_response', 27, 'End of Shift', 'gray', false, false, false),
    ('a2757ec5-2928-4395-b4d8-266c8e585db8', boh_cl_12, 'Do you have any additional notes for management?', 'free_response', 28, 'End of Shift', 'gray', false, false, false) ON CONFLICT (id) DO NOTHING;

  -- CAFE CHECKLISTS
  INSERT INTO cafe_checklists (title, shift_time, is_weekend, is_active) VALUES ('Cafe Daily Checklist', 'AM', false, true)
  ON CONFLICT (title, shift_time, is_weekend) DO UPDATE SET is_active = EXCLUDED.is_active RETURNING id INTO cafe_cl_1;

  -- CAFE ITEMS
  INSERT INTO cafe_checklist_items (id, checklist_id, task_description, task_type, sort_order, time_hint, category, color, is_high_priority, required, is_class_triggered) VALUES
    ('d68ebe28-fb62-46b8-8126-c3192fc5180f', cafe_cl_1, 'OPENING CHECKLIST:', 'header', 1, NULL, 'Opening', NULL, true, false, false),
    ('d0966954-631d-4aaf-8a06-39823bb23fea', cafe_cl_1, 'DAILY TASKS - To be completed throughout shift', 'header', 16, NULL, 'Mid-Shift', NULL, true, false, false),
    ('81bcf31d-9295-4cb8-8508-7339cd2cac08', cafe_cl_1, 'CLOSING CHECKLIST', 'header', 31, NULL, 'Closing', NULL, true, false, false),
    ('8898ef76-1690-4913-b8e5-10a159037822', cafe_cl_1, 'Proof Entire Cafe', 'signature', 61, '7:00 AM - 8:00 AM', 'Opening', 'red', false, true, false),
    ('2537d3fc-df65-49df-bd2c-72f856bf1525', cafe_cl_1, 'Clock In ON TIME', 'checkbox', 2, NULL, 'Opening', NULL, true, true, false),
    ('41332c5b-8c4e-4078-a600-575d5ad8102d', cafe_cl_1, 'Turn on countertop refrigerator', 'checkbox', 3, NULL, 'Opening', NULL, false, true, false),
    ('4697e43e-7440-4358-ace7-38378e13278b', cafe_cl_1, 'Uncover & turn on espresso machine & grinder', 'checkbox', 4, NULL, 'Opening', NULL, false, true, false),
    ('6b58c603-5203-4b52-9c1e-e022f47b0d06', cafe_cl_1, 'Turn on KDS (1601)', 'checkbox', 5, NULL, 'Opening', NULL, false, true, false),
    ('200ececb-91f4-44de-8c5d-362be635cf77', cafe_cl_1, 'Fill espresso grinder with Seismic coffee beans', 'checkbox', 6, NULL, 'Opening', NULL, false, true, false),
    ('2d26333a-f42b-41dc-aff3-59874288bc0c', cafe_cl_1, 'Make pot of drip coffee w/ Shockwave coffee beans 160g coffee beans. Grind on 4', 'checkbox', 7, NULL, 'Opening', NULL, false, true, false),
    ('756947f2-c928-494e-be26-94da3541ac70', cafe_cl_1, 'Bring out and arrange bar mats, mugs & glasses, drink pickup station, paper cups and lids, milk pitchers & espresso cups', 'checkbox', 8, NULL, 'Opening', NULL, false, true, false),
    ('02efbc8a-7dba-4d90-b8bd-3261f35bebf6', cafe_cl_1, 'Bring out and arrange packaged goods and refrigerated food & bevs', 'checkbox', 9, NULL, 'Opening', NULL, false, true, false),
    ('58a8f8d8-b50c-4d48-8e39-86ba327c960a', cafe_cl_1, 'Set up smoothie station w/ cutting board, measuring cups & spoons, turn on blenders & KDS (1601)', 'checkbox', 10, NULL, 'Opening', NULL, false, true, false),
    ('5196f195-a8ef-403a-93a1-f5af07036a65', cafe_cl_1, 'Turn on and fill dishwasher', 'checkbox', 11, NULL, 'Opening', NULL, false, true, false),
    ('47bff374-c3da-4244-88f8-87aa182ecb70', cafe_cl_1, 'Fill ice wells with ice', 'checkbox', 12, NULL, 'Opening', NULL, false, true, false),
    ('5d4edf77-4115-42ba-aee7-646237297194', cafe_cl_1, 'Place board games on tables', 'checkbox', 13, NULL, 'Opening', NULL, false, true, false),
    ('ef4e5e91-254b-4c65-a888-1b76f84d510d', cafe_cl_1, 'Open umbrellas, make sure tables are steady, push in chairs, wipe down any dirt/debris/stains on tables and chairs', 'photo', 14, NULL, 'Opening', NULL, false, true, false),
    ('c8b4eaaf-a415-4ebd-8b19-ef8ee44dc5a0', cafe_cl_1, 'Turn on cafe music and lights by 7:30', 'checkbox', 15, NULL, 'Opening', NULL, true, true, false),
    ('c060743d-a951-4744-9c93-c3e53c47aa51', cafe_cl_1, 'Restock lids, straws, sugar, napkins, etc.', 'checkbox', 17, NULL, 'Mid-Shift', NULL, false, true, false),
    ('054f1c3d-6c70-44bd-8d4b-11a9bf806ffc', cafe_cl_1, 'Restock packaged goods, food, bevs', 'checkbox', 18, NULL, 'Mid-Shift', NULL, false, true, false),
    ('83f3e1a7-2941-4abe-8aba-26381e0494df', cafe_cl_1, 'Restock milk fridge', 'checkbox', 19, NULL, 'Mid-Shift', NULL, false, true, false),
    ('4e4e28bc-9436-49d8-afc0-8126e5f2432f', cafe_cl_1, 'Complete Weekly Task', 'multiple_choice', 20, NULL, 'Mid-Shift', NULL, false, true, false),
    ('b9898d5b-26ca-4649-b49e-a3cb0a45db62', cafe_cl_1, 'FRIDAY & SATURDAY ONLY: Prep smoothies (build to 5 of each) (pic of 1)', 'photo', 21, NULL, 'Mid-Shift', NULL, false, false, false),
    ('b5b4cc1e-3c7a-4023-8529-fc9b9cecbc1f', cafe_cl_1, 'Prep vanilla, honey, & matcha (always 1 backup)', 'checkbox', 22, NULL, 'Mid-Shift', NULL, false, true, false),
    ('1f41b822-15af-484a-9555-95cbc70f6fac', cafe_cl_1, 'Prep cucumbers for spa water', 'checkbox', 23, NULL, 'Mid-Shift', NULL, false, true, false),
    ('4091cbc9-1fae-4e84-9218-ad4d1f1ad527', cafe_cl_1, 'Polish glassware with microfiber towel', 'checkbox', 24, NULL, 'Mid-Shift', NULL, false, true, false),
    ('9f8b45e6-e5c6-46db-84cc-eaf99b445513', cafe_cl_1, 'Refill frozen fruits in freezer drawer', 'checkbox', 25, NULL, 'Mid-Shift', NULL, false, true, false),
    ('dccaf6e9-af94-432e-8414-b14282fbb2bb', cafe_cl_1, 'Check that tables are sturdy, place wobble wedges as needed', 'checkbox', 26, NULL, 'Mid-Shift', NULL, false, true, false),
    ('ab296c8b-010b-4142-8ecf-d103be791949', cafe_cl_1, 'Wipe down tables and chairs, push in chairs', 'checkbox', 27, NULL, 'Mid-Shift', NULL, false, true, false),
    ('57809faf-cae1-48dd-84a9-3bccf2d266d4', cafe_cl_1, 'Sweep floors', 'checkbox', 28, NULL, 'Mid-Shift', NULL, false, true, false),
    ('8ee1e115-d708-47a5-bac1-248b9f0ce623', cafe_cl_1, 'Peel and freeze ripe bananas', 'checkbox', 29, NULL, 'Mid-Shift', NULL, false, true, false),
    ('d1ea521e-b903-40a5-94c4-a7f2a990ed77', cafe_cl_1, 'Peel, cut, and freeze ripe avocados', 'checkbox', 30, NULL, 'Mid-Shift', NULL, false, true, false),
    ('976c7b79-ff12-4080-bb5e-1ca878d5eeb5', cafe_cl_1, 'Smoothie Station', 'checkbox', 32, NULL, 'Closing', NULL, true, false, false),
    ('290681bc-1bc5-415d-8868-6459655d7e77', cafe_cl_1, 'Wash cutting board in sink', 'checkbox', 33, NULL, 'Closing', NULL, false, true, false),
    ('d17b203c-4c75-40bd-b6f6-c67d056c30cc', cafe_cl_1, 'Wash all dishes in dishwasher', 'checkbox', 34, NULL, 'Closing', NULL, false, true, false),
    ('c418a6cb-4149-4726-bc39-acd11d78d549', cafe_cl_1, 'Refill and wipe down smoothie ingredient containers and smoothie station/shelves', 'checkbox', 35, NULL, 'Closing', NULL, false, true, false),
    ('43994e36-ffa8-425a-a27b-60c486a64cb9', cafe_cl_1, 'Scrub inside of sink with scour pad', 'checkbox', 36, NULL, 'Closing', NULL, false, true, false),
    ('08229cbb-05e7-4151-80ea-7bd3578e703d', cafe_cl_1, 'Remove all dishes from dishwasher to drying rack', 'checkbox', 37, NULL, 'Closing', NULL, false, true, false),
    ('259f3991-227a-4f2f-b891-9dcf034332a0', cafe_cl_1, 'Drain dishwasher and turn off', 'checkbox', 38, NULL, 'Closing', NULL, false, true, false),
    ('6cecb41c-bc9a-4c09-a9a0-868c50d2d396', cafe_cl_1, 'Take out trash and replace with new bag', 'checkbox', 39, NULL, 'Closing', NULL, false, true, false),
    ('bcd90bcb-70cc-4a0b-9b52-f3e5d1d8a5f9', cafe_cl_1, 'COFFEE BAR:', 'checkbox', 40, NULL, 'Closing', NULL, true, false, false),
    ('f09ed128-7cbc-4fc5-b8a2-7b1dc34d5f36', cafe_cl_1, 'Bring all mugs/glassware/bar mats to back', 'checkbox', 41, NULL, 'Closing', NULL, false, true, false),
    ('6c9f3947-8b0d-4039-9b77-fe8436f69b6e', cafe_cl_1, 'Bring all milk pitchers and espresso cups to dishwasher', 'checkbox', 42, NULL, 'Closing', NULL, false, true, false),
    ('4bd649f5-2e30-48e2-a25e-fa28c9d7bd70', cafe_cl_1, 'Place paper cups, lids, sugar/straws/napkins on wooden tray to bring to back', 'checkbox', 43, NULL, 'Closing', NULL, false, true, false),
    ('2aa48534-29f7-47e6-ba66-3b936e85ea1b', cafe_cl_1, 'Soak portafilters baskets & screens in cafiza', 'checkbox', 44, NULL, 'Closing', NULL, false, true, false),
    ('a70e4fbd-e4f9-4411-b02f-d11f5af07471', cafe_cl_1, 'Backflush group heads with cafiza', 'checkbox', 45, NULL, 'Closing', NULL, false, true, false),
    ('e425af0d-f192-4162-9e1b-af934f955540', cafe_cl_1, 'Soak steam wands with Rinza', 'checkbox', 46, NULL, 'Closing', NULL, false, true, false),
    ('19272beb-1fd1-4fca-89dc-a4874bd780aa', cafe_cl_1, 'Dump leftover drip coffee and rinse out pot', 'checkbox', 47, NULL, 'Closing', NULL, false, true, false),
    ('355c012d-240b-4f66-a5fe-6268503ca438', cafe_cl_1, 'Close hopper, grind leftover beans, store beans in cambro labeled Seismic', 'checkbox', 48, NULL, 'Closing', NULL, false, true, false),
    ('9d44b16a-13f1-47e7-8663-a65bd3c23d5a', cafe_cl_1, 'Clean grinder with Grindz and vacuum out any leftover debris, turn off grinder', 'checkbox', 49, NULL, 'Closing', NULL, false, true, false),
    ('5c621f78-f705-490d-9e6c-536aa17fb966', cafe_cl_1, 'Put away all milks/syrups/matcha etc into milk fridge', 'checkbox', 50, NULL, 'Closing', NULL, false, true, false),
    ('905f3928-5809-4334-83fb-df7f1a88b428', cafe_cl_1, 'Cover ice wells with metal sheet pans', 'checkbox', 51, NULL, 'Closing', NULL, false, true, false),
    ('eaa13af2-616a-4450-9ff2-07843453c451', cafe_cl_1, 'Bring all packaged food to the back', 'checkbox', 52, NULL, 'Closing', NULL, false, true, false),
    ('d56eef41-85dd-4993-8395-589e554afd1c', cafe_cl_1, 'Bring all refrigerated food and bevs to back fridge. Log any items being tossed in Cafe notes. Turn off countertop fridge.', 'checkbox', 53, NULL, 'Closing', NULL, false, true, false),
    ('7cc15efc-c347-460e-9709-c3fa76f217a7', cafe_cl_1, 'Wipe down all countertops, espresso machine, bar station.', 'checkbox', 54, NULL, 'Closing', NULL, false, true, false),
    ('5b786836-dedb-4963-be4f-6cdb405b4798', cafe_cl_1, 'Turn off espresso machine', 'checkbox', 55, NULL, 'Closing', NULL, false, true, false),
    ('05a62562-eb51-4cdb-9b5c-b1550c567723', cafe_cl_1, 'Cover espresso machine and grinder', 'checkbox', 56, NULL, 'Closing', NULL, false, true, false),
    ('9209edea-3101-4e85-bc37-67b21bb700cb', cafe_cl_1, 'Take out trash & recycling', 'checkbox', 57, NULL, 'Closing', NULL, false, true, false),
    ('bf5fdc26-7a75-4da1-9f37-839b8b7caf0e', cafe_cl_1, 'Take down dirty rags to laundry if not picked up by BOH', 'checkbox', 58, NULL, 'Closing', NULL, false, true, false),
    ('39e692b4-a0db-4128-9546-e2af6dab4f36', cafe_cl_1, 'Please add notes for day overall-- was it busy, were there issues, etc. Please list what was tossed', 'free_response', 59, NULL, 'Closing', NULL, true, true, false),
    ('bb1b0cf7-aea2-44fc-9388-c8170d75448b', cafe_cl_1, 'Turn off lights', 'checkbox', 60, NULL, 'Closing', NULL, false, true, false),
    ('29f9fd3d-d491-49ee-a9cd-9c95559e6455', cafe_cl_1, 'Clock out', 'checkbox', 61, NULL, 'Closing', NULL, true, true, false) ON CONFLICT (id) DO NOTHING;

END $$;

-- ########## PHASE 5: Toast, api sync schedules, qa reads, backfill state (requires Phase 4) ##########
-- ========== Migration: 20260204100000_create_toast_sales_table.sql ==========
-- Create toast_sales table for Toast POS sales data
-- This table stores daily aggregated sales from Toast API

CREATE TABLE IF NOT EXISTS public.toast_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_date DATE NOT NULL UNIQUE,
  net_sales NUMERIC(10,2) DEFAULT 0,
  gross_sales NUMERIC(10,2) DEFAULT 0,
  cafe_sales NUMERIC(10,2) DEFAULT 0,
  raw_data JSONB,
  sync_batch_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_toast_sales_business_date ON public.toast_sales(business_date);
CREATE INDEX IF NOT EXISTS idx_toast_sales_sync_batch ON public.toast_sales(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_toast_sales_created_at ON public.toast_sales(created_at);

-- Enable RLS
ALTER TABLE public.toast_sales ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Authenticated users can view toast_sales" ON public.toast_sales;
CREATE POLICY "Authenticated users can view toast_sales"
  ON public.toast_sales
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can manage toast_sales" ON public.toast_sales;
CREATE POLICY "Service role can manage toast_sales"
  ON public.toast_sales
  FOR ALL
  TO service_role
  USING (true);

-- Grants
GRANT SELECT ON public.toast_sales TO authenticated;
GRANT ALL ON public.toast_sales TO service_role;

-- Add comment
COMMENT ON TABLE public.toast_sales IS 'Daily sales data synced from Toast POS API';


-- ========== Migration: 20260204100001_add_api_sync_schedules.sql ==========
-- Add sync_schedule entries for new API sync functions
-- These enable scheduled syncing for arketa_subscriptions and toast_sales

-- Add arketa_subscriptions to sync_schedule
INSERT INTO public.sync_schedule (
  sync_type,
  display_name,
  function_name,
  interval_minutes,
  is_enabled,
  next_run_at,
  last_status
) VALUES (
  'arketa_subscriptions',
  'Arketa Subscriptions',
  'sync-arketa-subscriptions',
  60,
  true,
  now(),
  'pending'
) ON CONFLICT (sync_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  function_name = EXCLUDED.function_name,
  is_enabled = EXCLUDED.is_enabled;

-- Add toast_sales to sync_schedule
INSERT INTO public.sync_schedule (
  sync_type,
  display_name,
  function_name,
  interval_minutes,
  is_enabled,
  next_run_at,
  last_status
) VALUES (
  'toast_sales',
  'Toast Sales',
  'sync-toast-orders',
  30,
  true,
  now(),
  'pending'
) ON CONFLICT (sync_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  function_name = EXCLUDED.function_name,
  is_enabled = EXCLUDED.is_enabled;

-- Add api_sync_status entries for tracking
INSERT INTO public.api_sync_status (api_name, last_sync_success)
VALUES 
  ('arketa_subscriptions', true),
  ('toast_sales', true)
ON CONFLICT (api_name) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.toast_sales IS 'Daily sales data synced from Toast POS API - synced every 30 minutes';


-- ========== Migration: 20260204100002_cleanup_sync_schedules.sql ==========
-- Cleanup sync schedules - remove derived tables and fix configurations
-- arketa_classes and arketa_instructors are derived from other API data
-- and should not have direct API syncs

-- Disable arketa_classes sync (it's a derived table)
-- Note: last_status must be one of: 'pending', 'running', 'success', 'failed', 'timeout'
UPDATE public.sync_schedule 
SET is_enabled = false
WHERE sync_type = 'arketa_classes';

-- Disable arketa_instructors sync (it's a derived table)
UPDATE public.sync_schedule 
SET is_enabled = false
WHERE sync_type = 'arketa_instructors';

-- Update display names for clarity
UPDATE public.sync_schedule 
SET display_name = CASE sync_type
    WHEN 'arketa_clients' THEN 'Arketa Clients'
    WHEN 'arketa_reservations' THEN 'Arketa Reservations'
    WHEN 'arketa_payments' THEN 'Arketa Payments'
    WHEN 'arketa_subscriptions' THEN 'Arketa Subscriptions'
    WHEN 'sling_users' THEN 'Sling Users'
    WHEN 'sling_shifts' THEN 'Sling Shifts'
    WHEN 'toast_sales' THEN 'Toast Sales'
    ELSE display_name
  END
WHERE sync_type IN (
  'arketa_clients', 'arketa_reservations', 'arketa_payments', 
  'arketa_subscriptions', 'sling_users', 'sling_shifts', 'toast_sales'
);

-- Ensure function_name is set correctly for all active syncs
UPDATE public.sync_schedule 
SET function_name = CASE sync_type
    WHEN 'arketa_clients' THEN 'sync-arketa-clients'
    WHEN 'arketa_reservations' THEN 'sync-arketa-reservations'
    WHEN 'arketa_payments' THEN 'sync-arketa-payments'
    WHEN 'arketa_subscriptions' THEN 'sync-arketa-subscriptions'
    WHEN 'sling_users' THEN 'sling-api'
    WHEN 'sling_shifts' THEN 'sling-api'
    WHEN 'toast_sales' THEN 'sync-toast-orders'
    ELSE function_name
  END
WHERE sync_type IN (
  'arketa_clients', 'arketa_reservations', 'arketa_payments', 
  'arketa_subscriptions', 'sling_users', 'sling_shifts', 'toast_sales'
);

-- Add comment
COMMENT ON TABLE public.sync_schedule IS 'API sync schedules - arketa_classes and arketa_instructors are disabled as they are derived tables';


-- ========== Migration: 20260205000000_integrate_dept_specific_cleanup.sql ==========
-- ============================================================================
-- Migration: Integrate Department-Specific Tables with Cleanup & Comments
-- Version: 20260205000000
-- Description: Add photo cleanup triggers for dept-specific tables and adapt
--              unified comments/submissions tables to work with all departments
-- ============================================================================

-- ============================================================================
-- 1. ADD PHOTO CLEANUP TRIGGERS FOR DEPARTMENT-SPECIFIC COMPLETION TABLES
-- ============================================================================

-- Add trigger for concierge_completions
DROP TRIGGER IF EXISTS trigger_queue_concierge_photo_on_delete ON concierge_completions;
CREATE TRIGGER trigger_queue_concierge_photo_on_delete
  BEFORE DELETE ON concierge_completions
  FOR EACH ROW
  EXECUTE FUNCTION queue_photo_deletion();

-- Add trigger for boh_completions
DROP TRIGGER IF EXISTS trigger_queue_boh_photo_on_delete ON boh_completions;
CREATE TRIGGER trigger_queue_boh_photo_on_delete
  BEFORE DELETE ON boh_completions
  FOR EACH ROW
  EXECUTE FUNCTION queue_photo_deletion();

-- Add trigger for cafe_completions
DROP TRIGGER IF EXISTS trigger_queue_cafe_photo_on_delete ON cafe_completions;
CREATE TRIGGER trigger_queue_cafe_photo_on_delete
  BEFORE DELETE ON cafe_completions
  FOR EACH ROW
  EXECUTE FUNCTION queue_photo_deletion();

-- ============================================================================
-- 2. UPDATE cleanup_old_completions() TO HANDLE ALL DEPARTMENT TABLES
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_completions()
RETURNS void AS $$
BEGIN
  -- Cleanup concierge_completions
  INSERT INTO storage_deletion_queue (bucket_name, file_path)
  SELECT 'checklist-photos', regexp_replace(photo_url, '^.*/checklist-photos/', '')
  FROM concierge_completions
  WHERE completion_date < CURRENT_DATE - INTERVAL '14 days'
    AND photo_url IS NOT NULL
    AND deleted_at IS NULL;
  
  UPDATE concierge_completions
  SET deleted_at = now()
  WHERE completion_date < CURRENT_DATE - INTERVAL '14 days'
    AND deleted_at IS NULL;

  -- Cleanup boh_completions
  INSERT INTO storage_deletion_queue (bucket_name, file_path)
  SELECT 'checklist-photos', regexp_replace(photo_url, '^.*/checklist-photos/', '')
  FROM boh_completions
  WHERE completion_date < CURRENT_DATE - INTERVAL '14 days'
    AND photo_url IS NOT NULL
    AND deleted_at IS NULL;
  
  UPDATE boh_completions
  SET deleted_at = now()
  WHERE completion_date < CURRENT_DATE - INTERVAL '14 days'
    AND deleted_at IS NULL;

  -- Cleanup cafe_completions
  INSERT INTO storage_deletion_queue (bucket_name, file_path)
  SELECT 'checklist-photos', regexp_replace(photo_url, '^.*/checklist-photos/', '')
  FROM cafe_completions
  WHERE completion_date < CURRENT_DATE - INTERVAL '14 days'
    AND photo_url IS NOT NULL
    AND deleted_at IS NULL;
  
  UPDATE cafe_completions
  SET deleted_at = now()
  WHERE completion_date < CURRENT_DATE - INTERVAL '14 days'
    AND deleted_at IS NULL;

  -- Also cleanup unified checklist_completions (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checklist_completions') THEN
    INSERT INTO storage_deletion_queue (bucket_name, file_path)
    SELECT 'checklist-photos', regexp_replace(photo_url, '^.*/checklist-photos/', '')
    FROM checklist_completions
    WHERE completion_date < CURRENT_DATE - INTERVAL '14 days'
      AND photo_url IS NOT NULL
      AND deleted_at IS NULL;
    
    UPDATE checklist_completions
    SET deleted_at = now()
    WHERE completion_date < CURRENT_DATE - INTERVAL '14 days'
      AND deleted_at IS NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_completions() IS 
  'Soft-deletes completions older than 14 days and queues photos for deletion across all department tables';

-- ============================================================================
-- 3. ADAPT UNIFIED checklist_comments TABLE (only if table exists)
--    Skip when 20260204000004 deprecate_old_checklist_tables has already run.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checklist_comments') THEN
    -- Add department_table column
    ALTER TABLE checklist_comments ADD COLUMN IF NOT EXISTS department_table TEXT;

    -- Drop existing foreign key constraints
    ALTER TABLE checklist_comments DROP CONSTRAINT IF EXISTS checklist_comments_checklist_id_fkey;
    ALTER TABLE checklist_comments DROP CONSTRAINT IF EXISTS checklist_comments_item_id_fkey;
    ALTER TABLE checklist_comments DROP CONSTRAINT IF EXISTS checklist_comments_completion_id_fkey;

    -- Make columns nullable
    ALTER TABLE checklist_comments ALTER COLUMN checklist_id DROP NOT NULL;
    ALTER TABLE checklist_comments ALTER COLUMN item_id DROP NOT NULL;
    ALTER TABLE checklist_comments ALTER COLUMN completion_id DROP NOT NULL;

    -- Update constraint to require at least one reference OR department_table info
    ALTER TABLE checklist_comments DROP CONSTRAINT IF EXISTS checklist_comments_target_check;
    ALTER TABLE checklist_comments ADD CONSTRAINT checklist_comments_target_check
      CHECK (
        checklist_id IS NOT NULL OR
        item_id IS NOT NULL OR
        completion_id IS NOT NULL OR
        department_table IS NOT NULL
      );

    -- Add indexes for performance
    CREATE INDEX IF NOT EXISTS idx_comments_dept_table ON checklist_comments(department_table, completion_date);
    CREATE INDEX IF NOT EXISTS idx_comments_dept_shift ON checklist_comments(department_table, shift_time, completion_date);

    -- Update RLS policies to work with department-specific comments
    DROP POLICY IF EXISTS "Users can view non-private comments" ON checklist_comments;
    CREATE POLICY "Users can view non-private comments"
      ON checklist_comments FOR SELECT
      USING (
        NOT is_private
        OR auth.uid() IN (
          SELECT user_id FROM user_roles WHERE role IN ('manager', 'admin')
        )
      );

    DROP POLICY IF EXISTS "Users can create comments" ON checklist_comments;
    CREATE POLICY "Users can create comments"
      ON checklist_comments FOR INSERT
      WITH CHECK (
        auth.uid() = staff_id AND
        auth.uid() IN (
          SELECT user_id FROM user_roles
          WHERE role IN ('concierge', 'floater', 'male_spa_attendant', 'female_spa_attendant', 'cafe', 'manager', 'admin')
        )
      );

    COMMENT ON COLUMN checklist_comments.department_table IS
      'Department table source: concierge, boh, or cafe (for department-specific comments without completion_id)';
  END IF;
END $$;

-- ============================================================================
-- 4. ADAPT UNIFIED checklist_shift_submissions TABLE (only if table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checklist_shift_submissions') THEN
    ALTER TABLE checklist_shift_submissions ADD COLUMN IF NOT EXISTS department_table TEXT;

    CREATE INDEX IF NOT EXISTS idx_shift_submissions_dept_table ON checklist_shift_submissions(department_table, completion_date);

    DROP POLICY IF EXISTS "Users can view submissions" ON checklist_shift_submissions;
    CREATE POLICY "Users can view submissions"
      ON checklist_shift_submissions FOR SELECT
      USING (
        auth.uid() IN (
          SELECT user_id FROM user_roles
          WHERE role IN ('concierge', 'floater', 'male_spa_attendant', 'female_spa_attendant', 'cafe', 'manager', 'admin')
        )
      );

    DROP POLICY IF EXISTS "Users can create submissions" ON checklist_shift_submissions;
    CREATE POLICY "Users can create submissions"
      ON checklist_shift_submissions FOR INSERT
      WITH CHECK (
        auth.uid() = submitted_by_id AND
        auth.uid() IN (
          SELECT user_id FROM user_roles
          WHERE role IN ('concierge', 'floater', 'male_spa_attendant', 'female_spa_attendant', 'cafe', 'manager', 'admin')
        )
      );

    COMMENT ON COLUMN checklist_shift_submissions.department_table IS
      'Department table source: concierge, boh, or cafe';
  END IF;
END $$;

-- ============================================================================
-- 5. ADD HELPER FUNCTION FOR CHECKING SHIFT SUBMISSION STATUS (only if table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checklist_shift_submissions') THEN
    CREATE OR REPLACE FUNCTION get_shift_submission_status(
      p_department_table TEXT,
      p_department TEXT,
      p_position TEXT,
      p_completion_date DATE,
      p_shift_time TEXT
    )
    RETURNS TABLE (
      is_submitted BOOLEAN,
      submitted_at TIMESTAMPTZ,
      submitted_by TEXT,
      total_tasks INTEGER,
      completed_tasks INTEGER
    ) AS $fn$
    BEGIN
      RETURN QUERY
      SELECT
        TRUE as is_submitted,
        css.submitted_at,
        css.submitted_by,
        css.total_tasks,
        css.completed_tasks
      FROM checklist_shift_submissions css
      WHERE css.department_table = p_department_table
        AND css.department = p_department
        AND COALESCE(css.position, '') = COALESCE(p_position, '')
        AND css.completion_date = p_completion_date
        AND css.shift_time = p_shift_time
      LIMIT 1;
    END;
    $fn$ LANGUAGE plpgsql;

    COMMENT ON FUNCTION get_shift_submission_status IS
      'Helper function to check if a shift has been submitted';
  END IF;
END $$;

-- ============================================================================
-- 6. ADD COMMENTS TO DOCUMENT CHANGES
-- ============================================================================

COMMENT ON TABLE storage_deletion_queue IS 
  'Queue for scheduled deletion of storage files (14-day retention) - works with all department completion tables';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 20260205000000 completed successfully';
  RAISE NOTICE '  - Added photo cleanup triggers for concierge, boh, and cafe completions';
  RAISE NOTICE '  - Updated cleanup_old_completions() to handle all department tables';
  RAISE NOTICE '  - Adapted checklist_comments table for department-specific use';
  RAISE NOTICE '  - Adapted checklist_shift_submissions table for department-specific use';
  RAISE NOTICE '  - Added helper function get_shift_submission_status()';
END $$;


-- ========== Migration: 20260205120000_toast_staging_and_daily_schedule.sql ==========
-- Toast API sync: align staging table with CSV format and set daily 1am schedule
-- CSV columns: id;business_date;net_sales;gross_sales;cafe_sales;raw_data;sync_batch_id;created_at
--
-- To run Toast (and other due syncs) daily at 1am: ensure scheduled-sync-runner
-- is invoked at 01:00 UTC (e.g. Supabase Dashboard → Integrations → Cron, or
-- external scheduler POST to /functions/v1/scheduled-sync-runner).

-- Add cafe_sales to toast_staging (match CSV and target toast_sales)
ALTER TABLE public.toast_staging
  ADD COLUMN IF NOT EXISTS cafe_sales numeric(10,2) DEFAULT 0;

-- Ensure toast_sales sync runs daily at 1am (UTC)
-- interval_minutes = 1440 (24h); next_run_at set to next 01:00 UTC so first run is at 1am
UPDATE public.sync_schedule
SET
  interval_minutes = 1440,
  next_run_at = (
    (date_trunc('day', (now() AT TIME ZONE 'UTC')) + interval '1 day' + interval '1 hour')
    AT TIME ZONE 'UTC'
  ),
  is_enabled = true,
  display_name = 'Toast Sales',
  function_name = 'sync-toast-orders'
WHERE sync_type = 'toast_sales';

COMMENT ON COLUMN public.toast_staging.cafe_sales IS 'Cafe sales amount for the business date (from Toast API / CSV)';


-- ========== Migration: 20260206000000_add_qa_reads_and_policy_categories.sql ==========
-- staff_qa_reads: track which Q&A questions managers have viewed
CREATE TABLE IF NOT EXISTS public.staff_qa_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qa_id uuid NOT NULL REFERENCES public.staff_qa(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(qa_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_qa_reads_user_id ON public.staff_qa_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_qa_reads_qa_id ON public.staff_qa_reads(qa_id);

ALTER TABLE public.staff_qa_reads ENABLE ROW LEVEL SECURITY;

-- Users manage their own reads (SELECT + INSERT for own user_id)
DROP POLICY IF EXISTS "Users manage own reads" ON public.staff_qa_reads;
CREATE POLICY "Users manage own reads"
  ON public.staff_qa_reads
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Managers can view all reads
DROP POLICY IF EXISTS "Managers can view all reads" ON public.staff_qa_reads;
CREATE POLICY "Managers can view all reads"
  ON public.staff_qa_reads
  FOR SELECT
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

-- policy_categories: manage policy groups/categories
CREATE TABLE IF NOT EXISTS public.policy_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_policy_categories_sort ON public.policy_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_policy_categories_active ON public.policy_categories(is_active);

ALTER TABLE public.policy_categories ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active categories
DROP POLICY IF EXISTS "Authenticated read active categories" ON public.policy_categories;
CREATE POLICY "Authenticated read active categories"
  ON public.policy_categories
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Managers can manage all categories
DROP POLICY IF EXISTS "Managers manage policy categories" ON public.policy_categories;
CREATE POLICY "Managers manage policy categories"
  ON public.policy_categories
  FOR ALL
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()))
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

-- Trigger for updated_at on policy_categories
DROP TRIGGER IF EXISTS update_policy_categories_updated_at ON public.policy_categories;
CREATE TRIGGER update_policy_categories_updated_at
  BEFORE UPDATE ON public.policy_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.staff_qa_reads IS 'Tracks which staff Q&A questions managers have read';
COMMENT ON TABLE public.policy_categories IS 'Policy groups/categories for club_policies';


-- ========== Migration: 20260206120000_toast_backfill_state_and_cron.sql ==========
-- Toast backfill: state table for resume-on-error and cron schedule (every 3 min until through 08/01/24)

-- State table: one row for toast backfill; cursor = (cursor_date, cursor_page) to resume where we left off
CREATE TABLE IF NOT EXISTS public.toast_backfill_state (
  id text PRIMARY KEY DEFAULT 'toast_backfill',
  cursor_date date NOT NULL DEFAULT '2024-08-01',
  cursor_page int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'paused')),
  last_error text,
  last_synced_at timestamptz,
  total_days_synced int DEFAULT 0,
  total_records_synced int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: only service_role (edge function) can read/write
ALTER TABLE public.toast_backfill_state ENABLE ROW LEVEL SECURITY;

-- No policies = anon/authenticated cannot access; service_role bypasses RLS
COMMENT ON TABLE public.toast_backfill_state IS 'Resumable Toast API backfill: cursor_date + cursor_page. Backfill runs through 2024-08-01.';

-- Seed initial state (start from 2024-08-01)
INSERT INTO public.toast_backfill_state (id, cursor_date, cursor_page, status)
VALUES ('toast_backfill', '2024-08-01', 1, 'running')
ON CONFLICT (id) DO NOTHING;

-- Add toast_backfill to sync_schedule: runs every 3 minutes
INSERT INTO public.sync_schedule (
  sync_type,
  display_name,
  function_name,
  interval_minutes,
  is_enabled,
  next_run_at,
  last_status
) VALUES (
  'toast_backfill',
  'Toast Backfill (through 08/01/24)',
  'toast-backfill-sync',
  3,
  true,
  now(),
  'pending'
) ON CONFLICT (sync_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  function_name = EXCLUDED.function_name,
  interval_minutes = EXCLUDED.interval_minutes,
  is_enabled = EXCLUDED.is_enabled;

COMMENT ON TABLE public.toast_backfill_state IS 'Toast API backfill state. Cron runs every 3 min; resumes from cursor_date/cursor_page on error.';


-- ########## PHASE 6: Lost and found, restore checklist comments, arketa, backfill calendar (requires Phase 5) ##########
-- ========== Migration: 20260207000000_lost_and_found_enhancements.sql ==========
-- Lost and Found enhancements: category enum, photo_url, member_requested, member_requests table, storage bucket
-- Migration created: 2026-02-07

-- 1. Create enum for object category
CREATE TYPE public.lost_and_found_category AS ENUM (
  'wallet',
  'keys',
  'phone',
  'clothing',
  'jewelry',
  'bag',
  'water_bottle',
  'other'
);

-- 2. Alter lost_and_found: add photo_url, object_category, member_requested
ALTER TABLE public.lost_and_found
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS object_category public.lost_and_found_category,
  ADD COLUMN IF NOT EXISTS member_requested boolean DEFAULT false;

-- 3. New table: lost_and_found_member_requests
CREATE TABLE IF NOT EXISTS public.lost_and_found_member_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  member_name text,
  member_contact text,
  date_inquired date DEFAULT CURRENT_DATE,
  notes text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
  matched_item_id uuid REFERENCES public.lost_and_found(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.lost_and_found_member_requests ENABLE ROW LEVEL SECURITY;

-- RLS for lost_and_found_member_requests
DROP POLICY IF EXISTS "Authenticated users can read member requests" ON public.lost_and_found_member_requests;
CREATE POLICY "Authenticated users can read member requests"
  ON public.lost_and_found_member_requests FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff can insert member requests" ON public.lost_and_found_member_requests;
CREATE POLICY "Staff can insert member requests"
  ON public.lost_and_found_member_requests FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff can update member requests" ON public.lost_and_found_member_requests;
CREATE POLICY "Staff can update member requests"
  ON public.lost_and_found_member_requests FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Managers can delete member requests" ON public.lost_and_found_member_requests;
CREATE POLICY "Managers can delete member requests"
  ON public.lost_and_found_member_requests FOR DELETE
  USING (public.is_manager_or_admin(auth.uid()));

-- Indexes for lost_and_found_member_requests
CREATE INDEX IF NOT EXISTS idx_lost_and_found_member_requests_status ON public.lost_and_found_member_requests(status);
CREATE INDEX IF NOT EXISTS idx_lost_and_found_member_requests_matched_item_id ON public.lost_and_found_member_requests(matched_item_id);
CREATE INDEX IF NOT EXISTS idx_lost_and_found_object_category ON public.lost_and_found(object_category);
CREATE INDEX IF NOT EXISTS idx_lost_and_found_member_requested ON public.lost_and_found(member_requested);

-- 4. Storage bucket for lost-and-found photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('lost-and-found-photos', 'lost-and-found-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload lost and found photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload lost and found photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'lost-and-found-photos');

DROP POLICY IF EXISTS "Authenticated users can view lost and found photos" ON storage.objects;
CREATE POLICY "Authenticated users can view lost and found photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'lost-and-found-photos');

DROP POLICY IF EXISTS "Users can update lost and found photos" ON storage.objects;
CREATE POLICY "Users can update lost and found photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'lost-and-found-photos');

DROP POLICY IF EXISTS "Managers can delete lost and found photos" ON storage.objects;
CREATE POLICY "Managers can delete lost and found photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lost-and-found-photos'
    AND public.is_manager_or_admin(auth.uid())
  );


-- ========== Migration: 20260208000000_restore_checklist_comments_and_shift_submissions.sql ==========
-- ============================================================================
-- Migration: Restore checklist_shift_submissions; drop checklist_comments
-- Version: 20260208000000
-- Description: Re-creates checklist_shift_submissions (dropped by 20260204000004)
--              so EmbeddedChecklist* continues to work. Drops checklist_comments
--              table if it exists (feature removed).
-- ============================================================================

-- Ensure checklist_comments table does not exist (feature removed)
DROP TABLE IF EXISTS public.checklist_comments CASCADE;

-- ============================================================================
-- 1. checklist_shift_submissions (only if missing)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checklist_shift_submissions') THEN
    CREATE TABLE public.checklist_shift_submissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      completion_date date NOT NULL,
      shift_time text NOT NULL,
      department text NOT NULL,
      position text,
      submitted_by text NOT NULL,
      submitted_by_id uuid,
      submitted_at timestamptz NOT NULL DEFAULT now(),
      total_tasks integer NOT NULL,
      completed_tasks integer NOT NULL,
      notes text,
      department_table text
    );

    CREATE INDEX IF NOT EXISTS idx_shift_submissions_date ON public.checklist_shift_submissions(completion_date);
    CREATE INDEX IF NOT EXISTS idx_shift_submissions_dept_table ON public.checklist_shift_submissions(department_table, completion_date);

    ALTER TABLE public.checklist_shift_submissions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view submissions" ON public.checklist_shift_submissions;
    CREATE POLICY "Users can view submissions"
      ON public.checklist_shift_submissions FOR SELECT
      USING (
        auth.uid() IN (
          SELECT user_id FROM user_roles
          WHERE role IN ('concierge', 'floater', 'male_spa_attendant', 'female_spa_attendant', 'cafe', 'manager', 'admin')
        )
      );

    DROP POLICY IF EXISTS "Users can create submissions" ON public.checklist_shift_submissions;
    CREATE POLICY "Users can create submissions"
      ON public.checklist_shift_submissions FOR INSERT
      WITH CHECK (
        auth.uid() = submitted_by_id AND
        auth.uid() IN (
          SELECT user_id FROM user_roles
          WHERE role IN ('concierge', 'floater', 'male_spa_attendant', 'female_spa_attendant', 'cafe', 'manager', 'admin')
        )
      );

    COMMENT ON TABLE public.checklist_shift_submissions IS
      'Department-scoped shift submissions (re-created after deprecate_old_checklist_tables)';
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================


-- ========== Migration: 20260209120000_arketa_history_staging_api_sync.sql ==========
-- Align Arketa staging/history tables and api_sync_status/api_logs with reference schema.
-- Target: arketa_reservations_history (staging cols + synced_at, unique reservation_id+class_id),
--         arketa_payments_staging (full reference columns), arketa_payments_history,
--         api_sync_status (last_processed_date, last_sync_status), api_logs (records_updated).

-- 1) arketa_reservations_staging: add missing columns to match reference
ALTER TABLE public.arketa_reservations_staging
  ADD COLUMN IF NOT EXISTS purchase_id text,
  ADD COLUMN IF NOT EXISTS reservation_type text,
  ADD COLUMN IF NOT EXISTS class_id text,
  ADD COLUMN IF NOT EXISTS class_name text,
  ADD COLUMN IF NOT EXISTS class_date date,
  ADD COLUMN IF NOT EXISTS checked_in boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS experience_type text,
  ADD COLUMN IF NOT EXISTS late_cancel boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS gross_amount_paid numeric,
  ADD COLUMN IF NOT EXISTS net_amount_paid numeric;

-- Backfill class_id from arketa_class_id where class_id is null
UPDATE public.arketa_reservations_staging SET class_id = arketa_class_id WHERE class_id IS NULL AND arketa_class_id IS NOT NULL;

-- 2) arketa_reservations_history (target): same columns as staging + synced_at, unique (reservation_id, class_id)
CREATE TABLE IF NOT EXISTS public.arketa_reservations_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id text NOT NULL,
  client_id text,
  purchase_id text,
  reservation_type text,
  class_id text NOT NULL,
  class_name text,
  class_date date,
  status text,
  checked_in boolean DEFAULT false,
  checked_in_at timestamptz,
  experience_type text,
  late_cancel boolean DEFAULT false,
  gross_amount_paid numeric,
  net_amount_paid numeric,
  raw_data jsonb,
  sync_batch_id uuid,
  synced_at timestamptz DEFAULT now(),
  UNIQUE(reservation_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_arketa_reservations_history_class_date ON public.arketa_reservations_history(class_date);
CREATE INDEX IF NOT EXISTS idx_arketa_reservations_history_reservation_class ON public.arketa_reservations_history(reservation_id, class_id);
ALTER TABLE public.arketa_reservations_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Managers can manage arketa_reservations_history" ON public.arketa_reservations_history;
CREATE POLICY "Managers can manage arketa_reservations_history"
  ON public.arketa_reservations_history FOR ALL USING (is_manager_or_admin(auth.uid()));

-- 3) arketa_payments_staging: add reference columns (keep existing id/sync_batch_id; add record_id as alias or new)
ALTER TABLE public.arketa_payments_staging
  ADD COLUMN IF NOT EXISTS record_id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS source_endpoint text,
  ADD COLUMN IF NOT EXISTS payment_id text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS offering_id text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS remaining_uses integer,
  ADD COLUMN IF NOT EXISTS total_refunded numeric,
  ADD COLUMN IF NOT EXISTS net_sales numeric,
  ADD COLUMN IF NOT EXISTS transaction_fees numeric,
  ADD COLUMN IF NOT EXISTS stripe_fees numeric,
  ADD COLUMN IF NOT EXISTS tax numeric,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS synced_at timestamptz DEFAULT now();

-- Backfill payment_id/source_endpoint from existing arketa_payment_id where missing
UPDATE public.arketa_payments_staging SET payment_id = arketa_payment_id WHERE payment_id IS NULL AND arketa_payment_id IS NOT NULL;
UPDATE public.arketa_payments_staging SET source_endpoint = 'purchases' WHERE source_endpoint IS NULL;

-- 4) arketa_payments_history (target): same columns as staging, unique (payment_id, source_endpoint)
CREATE TABLE IF NOT EXISTS public.arketa_payments_history (
  record_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_endpoint text NOT NULL,
  payment_id text NOT NULL,
  client_id text,
  amount numeric,
  status text,
  description text,
  payment_type text,
  category text,
  offering_id text,
  start_date date,
  end_date date,
  remaining_uses integer,
  currency text,
  total_refunded numeric,
  net_sales numeric,
  transaction_fees numeric,
  stripe_fees numeric,
  tax numeric,
  updated_at timestamptz,
  synced_at timestamptz DEFAULT now(),
  sync_batch_id uuid,
  UNIQUE(payment_id, source_endpoint)
);

CREATE INDEX IF NOT EXISTS idx_arketa_payments_history_payment_source ON public.arketa_payments_history(payment_id, source_endpoint);
ALTER TABLE public.arketa_payments_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Managers can manage arketa_payments_history" ON public.arketa_payments_history;
CREATE POLICY "Managers can manage arketa_payments_history"
  ON public.arketa_payments_history FOR ALL USING (is_manager_or_admin(auth.uid()));

-- 5) api_sync_status: add last_processed_date, last_sync_status (is_enabled already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'api_sync_status' AND column_name = 'last_processed_date') THEN
    ALTER TABLE public.api_sync_status ADD COLUMN last_processed_date text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'api_sync_status' AND column_name = 'last_sync_status') THEN
    ALTER TABLE public.api_sync_status ADD COLUMN last_sync_status text;
  END IF;
END $$;

-- 6) api_logs: add records_updated if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'api_logs' AND column_name = 'records_updated') THEN
    ALTER TABLE public.api_logs ADD COLUMN records_updated int DEFAULT 0;
  END IF;
END $$;

COMMENT ON TABLE public.arketa_reservations_history IS 'Target for reservations backfill; staging -> history via sync-from-staging. Unique (reservation_id, class_id).';
COMMENT ON TABLE public.arketa_payments_history IS 'Target for payments backfill; staging -> history via sync-from-staging. Unique (payment_id, source_endpoint).';


-- ========== Migration: 20260210000000_add_preferred_language_to_profiles.sql ==========
-- Add preferred_language to profiles for EN/ES default (onboarding + in-app toggle)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en'
  CHECK (preferred_language IN ('en', 'es'));

COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred UI language: en (English) or es (Spanish).';


-- ========== Migration: 20260210120000_arketa_reservations_csv_schema.sql ==========
-- Restrict arketa_reservations_staging and arketa_reservations_history to CSV header fields only.
-- CSV fields: id, client_id, reservation_id, purchase_id, reservation_type, class_id, class_name,
-- status, checked_in, checked_in_at, experience_type, late_cancel, synced_at, created_at,
-- gross_amount_paid, net_amount_paid, class_date, sync_batch_id, raw_data

-- 1) arketa_reservations_staging: add created_at if missing; drop columns not in CSV list
ALTER TABLE public.arketa_reservations_staging
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- Drop extra columns (staging: no synced_at - added on transfer to history)
ALTER TABLE public.arketa_reservations_staging
  DROP COLUMN IF EXISTS arketa_class_id,
  DROP COLUMN IF EXISTS arketa_reservation_id,
  DROP COLUMN IF EXISTS cancelled_at,
  DROP COLUMN IF EXISTS cursor_position,
  DROP COLUMN IF EXISTS client_email,
  DROP COLUMN IF EXISTS client_name,
  DROP COLUMN IF EXISTS staged_at;

-- 2) arketa_reservations_history: add created_at if missing; drop columns not in CSV list
ALTER TABLE public.arketa_reservations_history
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- History keeps synced_at (added on transfer). No extra columns to drop - history already matches CSV.
COMMENT ON TABLE public.arketa_reservations_staging IS 'Staging for reservations backfill; CSV fields only. staging -> history via sync-from-staging.';
COMMENT ON TABLE public.arketa_reservations_history IS 'Target for reservations backfill; CSV fields only. Unique (reservation_id, class_id).';


-- ========== Migration: 20260210120001_historical_backfill_progress.sql ==========
-- Create historical_backfill_progress table for date-based backfill orchestration (arketa-gym-flow style).
-- Used by historical-backfill-cron to track progress per API.

CREATE TABLE IF NOT EXISTS public.historical_backfill_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_name TEXT NOT NULL,
  current_date_cursor DATE NOT NULL DEFAULT CURRENT_DATE,
  target_end_date DATE NOT NULL DEFAULT '2024-05-01',
  chunk_days INTEGER NOT NULL DEFAULT 2,
  total_records_synced BIGINT NOT NULL DEFAULT 0,
  last_chunk_records INTEGER NOT NULL DEFAULT 0,
  last_chunk_started_at TIMESTAMPTZ,
  last_chunk_completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  backfill_phase TEXT DEFAULT 'initial',
  priority INTEGER DEFAULT 2,
  empty_dates_cursor TEXT,
  reverify_cursor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT historical_backfill_progress_api_name_key UNIQUE (api_name)
);

CREATE INDEX IF NOT EXISTS idx_historical_backfill_progress_status ON public.historical_backfill_progress(status);

ALTER TABLE public.historical_backfill_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to historical_backfill_progress" ON public.historical_backfill_progress;
CREATE POLICY "Service role full access to historical_backfill_progress"
  ON public.historical_backfill_progress FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read access to historical_backfill_progress" ON public.historical_backfill_progress;
CREATE POLICY "Public read access to historical_backfill_progress"
  ON public.historical_backfill_progress FOR SELECT TO public USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.historical_backfill_progress;

-- Seed: reservations and payments (plan matches arketa-gym-flow - reservations first, then payments)
INSERT INTO public.historical_backfill_progress (api_name, current_date_cursor, target_end_date, chunk_days, status, backfill_phase, priority)
VALUES
  ('arketa_reservations', CURRENT_DATE, '2024-05-01', 2, 'pending', 'initial', 2),
  ('arketa_payments', CURRENT_DATE, '2024-05-01', 2, 'pending', 'initial', 2)
ON CONFLICT (api_name) DO NOTHING;

DROP TRIGGER IF EXISTS update_historical_backfill_progress_updated_at ON public.historical_backfill_progress;
CREATE TRIGGER update_historical_backfill_progress_updated_at
  BEFORE UPDATE ON public.historical_backfill_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ========== Migration: 20260210120002_backfill_jobs_job_type.sql ==========
-- Add job_type to backfill_jobs for run-backfill-job compatibility (arketa-gym-flow style).
-- job_type = arketa_reservations | arketa_payments | arketa_classes
ALTER TABLE public.backfill_jobs
  ADD COLUMN IF NOT EXISTS job_type text;

-- Backfill job_type from api_source + data_type
UPDATE public.backfill_jobs
  SET job_type = api_source || '_' || data_type
  WHERE job_type IS NULL AND api_source IS NOT NULL AND data_type IS NOT NULL;

-- Add results column for run-backfill-job (array of SyncResult per date)
ALTER TABLE public.backfill_jobs
  ADD COLUMN IF NOT EXISTS results jsonb DEFAULT '[]'::jsonb;

-- Add total_records, total_new_records, total_dates, completed_dates for run-backfill-job
ALTER TABLE public.backfill_jobs
  ADD COLUMN IF NOT EXISTS total_records integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_new_records integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_dates integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_dates integer DEFAULT 0;

-- Backfill total_dates/completed_dates from total_days/days_processed
UPDATE public.backfill_jobs SET total_dates = total_days WHERE total_dates = 0 AND total_days > 0;
UPDATE public.backfill_jobs SET completed_dates = days_processed WHERE completed_dates = 0 AND days_processed > 0;


-- ========== Migration: 20260210120003_arketa_reservations_slim_16_columns.sql ==========
-- Slim arketa_reservations, arketa_reservations_history, and arketa_reservations_staging
-- to only: id (PK) + reservation_id, class_id, client_id, purchase_id, reservation_type,
-- class_name, class_date, status, checked_in, checked_in_at, experience_type, late_cancel,
-- gross_amount_paid, net_amount_paid, raw_data, sync_batch_id.

-- 1) Clear all records (optional - run when ready to wipe)
TRUNCATE TABLE public.arketa_reservations CASCADE;
TRUNCATE TABLE public.arketa_reservations_history CASCADE;
TRUNCATE TABLE public.arketa_reservations_staging CASCADE;

-- 2) arketa_reservations: add missing columns then drop all others
ALTER TABLE public.arketa_reservations
  ADD COLUMN IF NOT EXISTS reservation_id text,
  ADD COLUMN IF NOT EXISTS class_date date,
  ADD COLUMN IF NOT EXISTS sync_batch_id uuid;

-- Drop unique constraint on external_id before dropping column
ALTER TABLE public.arketa_reservations DROP CONSTRAINT IF EXISTS arketa_reservations_external_id_unique;
ALTER TABLE public.arketa_reservations DROP CONSTRAINT IF EXISTS arketa_reservations_external_id_key;

ALTER TABLE public.arketa_reservations
  DROP COLUMN IF EXISTS booking_id,
  DROP COLUMN IF EXISTS external_id,
  DROP COLUMN IF EXISTS client_name,
  DROP COLUMN IF EXISTS client_email,
  DROP COLUMN IF EXISTS class_time,
  DROP COLUMN IF EXISTS synced_at,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS canceled_at,
  DROP COLUMN IF EXISTS canceled_by,
  DROP COLUMN IF EXISTS date_purchased,
  DROP COLUMN IF EXISTS first_name,
  DROP COLUMN IF EXISTS last_name,
  DROP COLUMN IF EXISTS coupon_code,
  DROP COLUMN IF EXISTS email_marketing_opt_in,
  DROP COLUMN IF EXISTS estimated_gross_revenue,
  DROP COLUMN IF EXISTS estimated_net_revenue,
  DROP COLUMN IF EXISTS instructor_name,
  DROP COLUMN IF EXISTS location_address,
  DROP COLUMN IF EXISTS location_name,
  DROP COLUMN IF EXISTS milestone,
  DROP COLUMN IF EXISTS offering_id,
  DROP COLUMN IF EXISTS package_name,
  DROP COLUMN IF EXISTS package_period_end,
  DROP COLUMN IF EXISTS package_period_start,
  DROP COLUMN IF EXISTS payment_id,
  DROP COLUMN IF EXISTS payment_method,
  DROP COLUMN IF EXISTS purchase_type,
  DROP COLUMN IF EXISTS service_id,
  DROP COLUMN IF EXISTS tags,
  DROP COLUMN IF EXISTS updated_at;

-- Unique constraint for upserts (replaces external_id)
ALTER TABLE public.arketa_reservations
  ADD CONSTRAINT arketa_reservations_reservation_class_unique UNIQUE (reservation_id, class_id);

-- 3) arketa_reservations_history: drop synced_at and created_at only
ALTER TABLE public.arketa_reservations_history
  DROP COLUMN IF EXISTS synced_at,
  DROP COLUMN IF EXISTS created_at;

-- 4) arketa_reservations_staging: drop created_at and synced_at
ALTER TABLE public.arketa_reservations_staging
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS synced_at;

COMMENT ON TABLE public.arketa_reservations IS 'Arketa reservations: id + 16 fields only. Unique (reservation_id, class_id).';
COMMENT ON TABLE public.arketa_reservations_history IS 'Reservations history: id + 16 fields. Unique (reservation_id, class_id).';
COMMENT ON TABLE public.arketa_reservations_staging IS 'Staging for reservations: id + 16 fields. staging -> history via sync-from-staging.';


-- ========== Migration: 20260210120004_arketa_classes_class_date.sql ==========
-- Add class_date to arketa_classes for Tier 2 lookups and orphan detection (see docs/ARKETA_ARCHITECTURE.md).
-- class_date is the calendar date of the class in Pacific (America/Los_Angeles), derived from start_time.

ALTER TABLE public.arketa_classes
  ADD COLUMN IF NOT EXISTS class_date date;

-- Backfill existing rows: class_date = calendar date in PST/PDT (convert from stored timestamptz)
UPDATE public.arketa_classes
SET class_date = (start_time AT TIME ZONE 'America/Los_Angeles')::date
WHERE class_date IS NULL AND start_time IS NOT NULL;

-- Index for date-range queries (Tier 2: distinct class_id where class_date between X and Y)
CREATE INDEX IF NOT EXISTS idx_arketa_classes_class_date ON public.arketa_classes(class_date);

COMMENT ON COLUMN public.arketa_classes.class_date IS 'Calendar date of the class in Pacific (PST/PDT); used for Tier 2 reservation fetch and orphan detection.';


-- ========== Migration: 20260210120005_arketa_orphan_classes_view.sql ==========
-- Orphan recovery: classes in arketa_classes with zero reservations in arketa_reservations_history.
-- See docs/ARKETA_ARCHITECTURE.md — used to find gaps and optionally trigger Tier 2 or Tier 3 fetch.

CREATE OR REPLACE VIEW public.arketa_orphan_classes AS
SELECT
  c.id,
  c.external_id AS class_id,
  c.name AS class_name,
  c.class_date,
  c.start_time,
  c.booked_count,
  c.is_cancelled
FROM public.arketa_classes c
LEFT JOIN (
  SELECT class_id, COUNT(*) AS reservation_count
  FROM public.arketa_reservations_history
  GROUP BY class_id
) r ON c.external_id = r.class_id
WHERE r.reservation_count IS NULL OR r.reservation_count = 0;

COMMENT ON VIEW public.arketa_orphan_classes IS 'Classes in catalog with no reservation records; use for orphan recovery (Tier 2/3 backfill).';


-- ========== Migration: 20260211120000_backfill_calendar_rpcs.sql ==========
-- RPCs for backfill calendar heatmap: per-date sync status from Aug 1, 2024.
-- Used by BackfillCalendarHeatmap to show synced / partial / not pulled by day.

CREATE OR REPLACE FUNCTION public.get_backfill_reservations_calendar()
RETURNS TABLE(d date, record_count bigint, checked_in_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    class_date AS d,
    COUNT(*)::bigint AS record_count,
    COUNT(*) FILTER (WHERE checked_in = true)::bigint AS checked_in_count
  FROM arketa_reservations_history
  WHERE class_date >= '2024-08-01' AND class_date IS NOT NULL
  GROUP BY class_date
  ORDER BY class_date;
$$;

CREATE OR REPLACE FUNCTION public.get_backfill_payments_calendar()
RETURNS TABLE(d date, record_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    start_date AS d,
    COUNT(*)::bigint AS record_count
  FROM arketa_payments_history
  WHERE start_date >= '2024-08-01' AND start_date IS NOT NULL
  GROUP BY start_date
  ORDER BY start_date;
$$;

CREATE OR REPLACE FUNCTION public.get_backfill_classes_calendar()
RETURNS TABLE(d date, record_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    class_date::date AS d,
    COUNT(*)::bigint AS record_count
  FROM arketa_classes
  WHERE class_date >= '2024-08-01' AND class_date IS NOT NULL
  GROUP BY class_date
  ORDER BY class_date;
$$;

CREATE OR REPLACE FUNCTION public.get_backfill_toast_calendar()
RETURNS TABLE(d date, record_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    business_date AS d,
    COUNT(*)::bigint AS record_count
  FROM toast_sales
  WHERE business_date >= '2024-08-01'
  GROUP BY business_date
  ORDER BY business_date;
$$;

COMMENT ON FUNCTION public.get_backfill_reservations_calendar() IS 'Per-date reservation counts and check-in counts for backfill calendar (Aug 1 2024+).';
COMMENT ON FUNCTION public.get_backfill_payments_calendar() IS 'Per-date payment counts for backfill calendar (Aug 1 2024+).';
COMMENT ON FUNCTION public.get_backfill_classes_calendar() IS 'Per-date class counts for backfill calendar (Aug 1 2024+).';
COMMENT ON FUNCTION public.get_backfill_toast_calendar() IS 'Per-date toast_sales presence for backfill calendar (Aug 1 2024+).';

-- Grant execute to authenticated (RLS on tables still applies; SECURITY DEFINER uses definer rights)
GRANT EXECUTE ON FUNCTION public.get_backfill_reservations_calendar() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_backfill_payments_calendar() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_backfill_classes_calendar() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_backfill_toast_calendar() TO authenticated;


-- ########## PHASE 7: Messaging, account approval, event drinks, order checks, staff resources, imports (requires Phase 6) ##########
-- ========== Migration: 20260211125441_messaging_upgrade.sql ==========
-- =============================================
-- Messaging System Upgrade Migration
-- =============================================
-- This migration upgrades the staff messaging system with:
-- - Group conversations and threading
-- - Reactions and read receipts
-- - Drafts and scheduled messages
-- - Archive functionality

-- =============================================
-- 1. ALTER EXISTING TABLES
-- =============================================

-- Add new columns to staff_messages
ALTER TABLE staff_messages
ADD COLUMN IF NOT EXISTS recipient_departments text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_urgent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS group_id uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS group_name text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS thread_id uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES staff_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS scheduled_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS edited_at timestamptz DEFAULT NULL;

-- Add indexes to staff_messages
CREATE INDEX IF NOT EXISTS idx_staff_messages_thread_id ON staff_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_staff_messages_group_id ON staff_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_staff_messages_recipient_ids ON staff_messages USING GIN(recipient_ids);
CREATE INDEX IF NOT EXISTS idx_staff_messages_scheduled ON staff_messages(scheduled_at) WHERE is_sent = false;

-- Add new columns to staff_message_reads
ALTER TABLE staff_message_reads
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Add index to staff_message_reads
CREATE INDEX IF NOT EXISTS idx_staff_message_reads_archived ON staff_message_reads(staff_id, is_archived);

-- Add unique constraint if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'staff_message_reads_message_id_staff_id_key'
  ) THEN
    ALTER TABLE staff_message_reads 
    ADD CONSTRAINT staff_message_reads_message_id_staff_id_key 
    UNIQUE (message_id, staff_id);
  END IF;
END $$;

-- =============================================
-- 2. CREATE NEW TABLES
-- =============================================

-- Staff message reactions
CREATE TABLE IF NOT EXISTS staff_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES staff_messages(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_name text NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, staff_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_staff_message_reactions_message ON staff_message_reactions(message_id);

-- Staff message groups
CREATE TABLE IF NOT EXISTS staff_message_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  member_ids uuid[] NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_message_groups_created_by ON staff_message_groups(created_by);

-- Staff message drafts
CREATE TABLE IF NOT EXISTS staff_message_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text,
  content text,
  recipient_staff_ids uuid[],
  recipient_departments text[],
  group_id uuid REFERENCES staff_message_groups(id) ON DELETE SET NULL,
  is_urgent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_message_drafts_staff_id ON staff_message_drafts(staff_id);

-- =============================================
-- 3. ENABLE RLS ON NEW TABLES
-- =============================================

ALTER TABLE staff_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_message_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_message_drafts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. RLS POLICIES
-- =============================================

-- Policies for staff_message_reactions
DROP POLICY IF EXISTS "Users can view reactions on their messages" ON staff_message_reactions;
CREATE POLICY "Users can view reactions on their messages"
  ON staff_message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_messages 
      WHERE staff_messages.id = staff_message_reactions.message_id
      AND (staff_messages.sender_id = auth.uid() OR auth.uid() = ANY(staff_messages.recipient_ids))
    )
  );

DROP POLICY IF EXISTS "Users can add reactions to messages they can see" ON staff_message_reactions;
CREATE POLICY "Users can add reactions to messages they can see"
  ON staff_message_reactions FOR INSERT
  WITH CHECK (
    staff_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM staff_messages 
      WHERE staff_messages.id = staff_message_reactions.message_id
      AND (staff_messages.sender_id = auth.uid() OR auth.uid() = ANY(staff_messages.recipient_ids))
    )
  );

DROP POLICY IF EXISTS "Users can delete their own reactions" ON staff_message_reactions;
CREATE POLICY "Users can delete their own reactions"
  ON staff_message_reactions FOR DELETE
  USING (staff_id = auth.uid());

-- Policies for staff_message_groups
DROP POLICY IF EXISTS "Users can view groups they belong to" ON staff_message_groups;
CREATE POLICY "Users can view groups they belong to"
  ON staff_message_groups FOR SELECT
  USING (auth.uid() = ANY(member_ids) OR created_by = auth.uid());

DROP POLICY IF EXISTS "Users can create groups" ON staff_message_groups;
CREATE POLICY "Users can create groups"
  ON staff_message_groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update groups they created" ON staff_message_groups;
CREATE POLICY "Users can update groups they created"
  ON staff_message_groups FOR UPDATE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete groups they created" ON staff_message_groups;
CREATE POLICY "Users can delete groups they created"
  ON staff_message_groups FOR DELETE
  USING (created_by = auth.uid());

-- Policies for staff_message_drafts
DROP POLICY IF EXISTS "Users can manage their own drafts" ON staff_message_drafts;
CREATE POLICY "Users can manage their own drafts"
  ON staff_message_drafts FOR ALL
  USING (staff_id = auth.uid());

-- =============================================
-- 5. TRIGGERS
-- =============================================

-- Trigger to update updated_at on staff_message_groups
CREATE OR REPLACE FUNCTION update_staff_message_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_staff_message_groups_updated_at ON staff_message_groups;
CREATE TRIGGER trigger_update_staff_message_groups_updated_at
  BEFORE UPDATE ON staff_message_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_message_groups_updated_at();

-- Trigger to update updated_at on staff_message_drafts
CREATE OR REPLACE FUNCTION update_staff_message_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_staff_message_drafts_updated_at ON staff_message_drafts;
CREATE TRIGGER trigger_update_staff_message_drafts_updated_at
  BEFORE UPDATE ON staff_message_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_message_drafts_updated_at();

-- =============================================
-- 6. SCHEDULED MESSAGES FUNCTION
-- =============================================

-- Function to process scheduled messages
CREATE OR REPLACE FUNCTION process_scheduled_messages()
RETURNS void AS $$
BEGIN
  -- Update messages that are scheduled to be sent now
  UPDATE staff_messages
  SET is_sent = true
  WHERE scheduled_at IS NOT NULL
    AND scheduled_at <= now()
    AND is_sent = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: pg_cron setup requires extension and configuration
-- This would typically be done via Supabase dashboard or separate setup:
-- SELECT cron.schedule('process-scheduled-messages', '* * * * *', 'SELECT process_scheduled_messages()');

-- =============================================
-- 7. REALTIME PUBLICATION
-- =============================================

-- Add tables to realtime publication (if supabase_realtime exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Add staff_messages if not already included
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'staff_messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE staff_messages;
    END IF;

    -- Add staff_message_reads if not already included
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'staff_message_reads'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE staff_message_reads;
    END IF;

    -- Add staff_message_reactions
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'staff_message_reactions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE staff_message_reactions;
    END IF;
  END IF;
END $$;

-- =============================================
-- 8. GRANT PERMISSIONS
-- =============================================

-- Service role has full access
GRANT ALL ON staff_message_reactions TO service_role;
GRANT ALL ON staff_message_groups TO service_role;
GRANT ALL ON staff_message_drafts TO service_role;

-- Authenticated users have conditional access via RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_message_reactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_message_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_message_drafts TO authenticated;


-- ========== Migration: 20260211135346_add_account_approval_system.sql ==========
-- Account Approval System Migration
-- Adds approval workflow for new user accounts with auto-approval for Sling-matched emails

-- 1. Add approval status columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' 
    CHECK (approval_status IN ('pending', 'auto_approved', 'manager_approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_notes text;

-- Create index for approval status queries
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);

-- 2. Create account approval requests table
CREATE TABLE IF NOT EXISTS public.account_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  full_name text,
  requested_roles app_role[],
  justification text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on account_approval_requests
ALTER TABLE public.account_approval_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for account_approval_requests
DROP POLICY IF EXISTS "Users can view their own approval requests" ON public.account_approval_requests;
CREATE POLICY "Users can view their own approval requests"
  ON public.account_approval_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Managers can view all approval requests" ON public.account_approval_requests;
CREATE POLICY "Managers can view all approval requests"
  ON public.account_approval_requests FOR SELECT
  TO authenticated
  USING (is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Managers can update approval requests" ON public.account_approval_requests;
CREATE POLICY "Managers can update approval requests"
  ON public.account_approval_requests FOR UPDATE
  TO authenticated
  USING (is_manager_or_admin(auth.uid()));

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_account_approval_requests_status 
  ON public.account_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_approval_requests_user_id 
  ON public.account_approval_requests(user_id);

-- 3. Update auto_match_sling_user function to set approval status
CREATE OR REPLACE FUNCTION public.auto_match_sling_user()
RETURNS TRIGGER AS $$
DECLARE
  matched_sling_id uuid;
BEGIN
  -- Try to find a matching sling_user by email
  SELECT id INTO matched_sling_id
  FROM public.sling_users
  WHERE LOWER(email) = LOWER(NEW.email)
    AND is_active = true
  LIMIT 1;
  
  -- If found, auto-approve and link to sling
  IF matched_sling_id IS NOT NULL THEN
    NEW.sling_id := matched_sling_id;
    NEW.approval_status := 'auto_approved';
    NEW.approved_at := now();
  ELSE
    -- No Sling match, keep as pending
    NEW.approval_status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Function to map Sling positions to app_role enum
CREATE OR REPLACE FUNCTION public.get_sling_roles_for_user(_sling_id uuid)
RETURNS app_role[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sling_positions text[];
  mapped_roles app_role[];
  pos text;
BEGIN
  -- Get positions array from sling_users
  SELECT positions INTO sling_positions
  FROM public.sling_users
  WHERE id = _sling_id;
  
  IF sling_positions IS NULL THEN
    RETURN ARRAY[]::app_role[];
  END IF;
  
  -- Initialize empty array
  mapped_roles := ARRAY[]::app_role[];
  
  -- Map each position to app_role
  FOREACH pos IN ARRAY sling_positions
  LOOP
    CASE LOWER(pos)
      -- Admin mapping
      WHEN 'admin', 'administrator' THEN
        IF NOT ('admin'::app_role = ANY(mapped_roles)) THEN
          mapped_roles := array_append(mapped_roles, 'admin'::app_role);
        END IF;
      
      -- Manager mapping
      WHEN 'manager', 'general manager', 'operations manager' THEN
        IF NOT ('manager'::app_role = ANY(mapped_roles)) THEN
          mapped_roles := array_append(mapped_roles, 'manager'::app_role);
        END IF;
      
      -- Concierge mapping
      WHEN 'concierge', 'front desk', 'receptionist' THEN
        IF NOT ('concierge'::app_role = ANY(mapped_roles)) THEN
          mapped_roles := array_append(mapped_roles, 'concierge'::app_role);
        END IF;
      
      -- Trainer mapping
      WHEN 'trainer', 'personal trainer', 'fitness trainer', 'instructor' THEN
        IF NOT ('trainer'::app_role = ANY(mapped_roles)) THEN
          mapped_roles := array_append(mapped_roles, 'trainer'::app_role);
        END IF;
      
      -- Female spa attendant mapping
      WHEN 'spa attendant - female', 'female spa attendant', 'spa attendant (female)' THEN
        IF NOT ('female_spa_attendant'::app_role = ANY(mapped_roles)) THEN
          mapped_roles := array_append(mapped_roles, 'female_spa_attendant'::app_role);
        END IF;
      
      -- Male spa attendant mapping
      WHEN 'spa attendant - male', 'male spa attendant', 'spa attendant (male)' THEN
        IF NOT ('male_spa_attendant'::app_role = ANY(mapped_roles)) THEN
          mapped_roles := array_append(mapped_roles, 'male_spa_attendant'::app_role);
        END IF;
      
      -- Floater mapping
      WHEN 'floater', 'float' THEN
        IF NOT ('floater'::app_role = ANY(mapped_roles)) THEN
          mapped_roles := array_append(mapped_roles, 'floater'::app_role);
        END IF;
      
      -- Cafe mapping
      WHEN 'cafe', 'barista', 'cafe attendant' THEN
        IF NOT ('cafe'::app_role = ANY(mapped_roles)) THEN
          mapped_roles := array_append(mapped_roles, 'cafe'::app_role);
        END IF;
      
      ELSE
        -- Unknown position, skip
        NULL;
    END CASE;
  END LOOP;
  
  RETURN mapped_roles;
END;
$$;

-- 5. Function for managers to approve accounts
CREATE OR REPLACE FUNCTION public.manager_approve_account(
  _user_id uuid,
  _approved_roles app_role[],
  _notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_to_insert app_role;
BEGIN
  -- Verify caller is admin or manager
  IF NOT is_manager_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and managers can approve accounts';
  END IF;

  -- Update profile approval status
  UPDATE public.profiles
  SET 
    approval_status = 'manager_approved',
    approved_by = auth.uid(),
    approved_at = now(),
    approval_notes = _notes
  WHERE user_id = _user_id;
  
  -- Insert approved roles (clear existing first)
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  
  FOREACH role_to_insert IN ARRAY _approved_roles
  LOOP
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, role_to_insert)
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
  
  -- Update approval request status if exists
  UPDATE public.account_approval_requests
  SET 
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_notes = _notes
  WHERE user_id = _user_id AND status = 'pending';
END;
$$;

-- 6. Function for managers to reject accounts
CREATE OR REPLACE FUNCTION public.manager_reject_account(
  _user_id uuid,
  _reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin or manager
  IF NOT is_manager_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and managers can reject accounts';
  END IF;

  -- Update profile approval status
  -- Note: We reuse approved_by/approved_at fields for rejections to maintain
  -- a simple schema. These fields track "who reviewed" and "when" regardless of outcome.
  UPDATE public.profiles
  SET 
    approval_status = 'rejected',
    approved_by = auth.uid(),
    approved_at = now(),
    approval_notes = _reason
  WHERE user_id = _user_id;
  
  -- Update approval request status if exists
  UPDATE public.account_approval_requests
  SET 
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_notes = _reason
  WHERE user_id = _user_id AND status = 'pending';
END;
$$;

-- 7. Function to get pending approvals (managers only)
CREATE OR REPLACE FUNCTION public.get_pending_approvals()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  requested_roles app_role[],
  sling_id uuid,
  sling_matched boolean,
  suggested_roles app_role[],
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin or manager
  IF NOT is_manager_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and managers can view pending approvals';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.full_name,
    COALESCE(
      (SELECT array_agg(ur.role) FROM public.user_roles ur WHERE ur.user_id = p.user_id),
      ARRAY[]::app_role[]
    ) as requested_roles,
    p.sling_id,
    (p.sling_id IS NOT NULL) as sling_matched,
    CASE 
      WHEN p.sling_id IS NOT NULL THEN public.get_sling_roles_for_user(p.sling_id)
      ELSE ARRAY[]::app_role[]
    END as suggested_roles,
    p.created_at
  FROM public.profiles p
  WHERE p.approval_status = 'pending'
    AND p.onboarding_completed = true
  ORDER BY p.created_at DESC;
END;
$$;

-- 8. Update trigger for account_approval_requests
DROP TRIGGER IF EXISTS update_account_approval_requests_updated_at ON public.account_approval_requests;
CREATE TRIGGER update_account_approval_requests_updated_at
BEFORE UPDATE ON public.account_approval_requests
FOR EACH ROW
EXECUTE_FUNCTION public.update_updated_at_column();

-- 9. Add comment for documentation
COMMENT ON COLUMN public.profiles.approval_status IS 
  'Account approval status: pending (awaiting manager), auto_approved (Sling match), manager_approved (manually approved), rejected';
COMMENT ON TABLE public.account_approval_requests IS 
  'Tracks account approval requests and manager reviews';

-- 10. Notification triggers for account approval workflow

-- Function to notify managers when new user signs up (pending approval)
CREATE OR REPLACE FUNCTION public.notify_managers_new_signup()
RETURNS TRIGGER AS $$
DECLARE
  manager_id uuid;
BEGIN
  -- Only notify if status is pending
  IF NEW.approval_status = 'pending' AND NEW.onboarding_completed = true THEN
    -- Create notification for all managers and admins
    FOR manager_id IN 
      SELECT DISTINCT ur.user_id
      FROM public.user_roles ur
      WHERE ur.role IN ('admin', 'manager')
    LOOP
      INSERT INTO public.staff_notifications (
        user_id,
        type,
        title,
        body,
        data
      ) VALUES (
        manager_id,
        'account_approval_pending',
        'New Account Pending Approval',
        NEW.full_name || ' (' || NEW.email || ') has signed up and needs account approval.',
        jsonb_build_object(
          'user_id', NEW.user_id,
          'email', NEW.email,
          'full_name', NEW.full_name
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new signup notifications
DROP TRIGGER IF EXISTS trigger_notify_managers_new_signup ON public.profiles;
CREATE TRIGGER trigger_notify_managers_new_signup
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (OLD.onboarding_completed = false AND NEW.onboarding_completed = true)
EXECUTE FUNCTION public.notify_managers_new_signup();

-- Function to notify user when account is approved
CREATE OR REPLACE FUNCTION public.notify_user_account_approved()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify on status change to approved
  IF OLD.approval_status = 'pending' AND 
     (NEW.approval_status = 'auto_approved' OR NEW.approval_status = 'manager_approved') THEN
    
    INSERT INTO public.staff_notifications (
      user_id,
      type,
      title,
      body,
      data
    ) VALUES (
      NEW.user_id,
      'account_approved',
      'Account Approved',
      'Your account has been approved! You now have access to the system.',
      jsonb_build_object(
        'approval_status', NEW.approval_status,
        'approved_at', NEW.approved_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for approval notifications
DROP TRIGGER IF EXISTS trigger_notify_user_account_approved ON public.profiles;
CREATE TRIGGER trigger_notify_user_account_approved
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (NEW.approval_status IN ('auto_approved', 'manager_approved'))
EXECUTE FUNCTION public.notify_user_account_approved();

-- Function to notify user when account is rejected
CREATE OR REPLACE FUNCTION public.notify_user_account_rejected()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify on status change to rejected
  IF OLD.approval_status != 'rejected' AND NEW.approval_status = 'rejected' THEN
    
    INSERT INTO public.staff_notifications (
      user_id,
      type,
      title,
      body,
      data
    ) VALUES (
      NEW.user_id,
      'account_rejected',
      'Account Not Approved',
      COALESCE(
        'Your account request was not approved. Reason: ' || NEW.approval_notes,
        'Your account request was not approved. Please contact an administrator for more information.'
      ),
      jsonb_build_object(
        'approval_status', NEW.approval_status,
        'approval_notes', NEW.approval_notes,
        'rejected_at', NEW.approved_at,
        'rejected_by', NEW.approved_by
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for rejection notifications
DROP TRIGGER IF EXISTS trigger_notify_user_account_rejected ON public.profiles;
CREATE TRIGGER trigger_notify_user_account_rejected
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (NEW.approval_status = 'rejected')
EXECUTE FUNCTION public.notify_user_account_rejected();


-- ========== Migration: 20260212000000_create_event_drinks.sql ==========
-- =============================================
-- Event Drinks Preparation Tracker
-- =============================================
-- A centralized checklist for the cafe team to plan, coordinate,
-- and track every step of preparing a special drink for an event.

-- 1. Create the event_drinks table
CREATE TABLE IF NOT EXISTS public.event_drinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text,
  event_type text DEFAULT 'Saturday Social',
  event_type_notes text,
  drink_name text NOT NULL,
  event_date date,
  staff text[] DEFAULT '{}',
  supplies_ordered boolean DEFAULT false,
  supplies_ordered_at date,
  photoshoot text CHECK (photoshoot IN ('Yes', 'NA') OR photoshoot IS NULL),
  photoshoot_at date,
  menu_printed text CHECK (menu_printed IN ('Yes', 'NA') OR menu_printed IS NULL),
  menu_printed_at date,
  staff_notified boolean DEFAULT false,
  staff_notified_at date,
  email_thread_path text,
  email_thread_filename text,
  needs_followup boolean DEFAULT false,
  recipe text,
  food text,
  supplies_needed text,
  additional_notes text,
  is_archived boolean DEFAULT false,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.event_drinks ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Cafe staff can view event drinks" ON public.event_drinks;
CREATE POLICY "Cafe staff can view event drinks"
  ON public.event_drinks FOR SELECT
  TO authenticated
  USING (
    public.user_has_any_role(auth.uid(), ARRAY['cafe'::app_role, 'manager'::app_role, 'admin'::app_role])
  );

DROP POLICY IF EXISTS "Cafe staff can create event drinks" ON public.event_drinks;
CREATE POLICY "Cafe staff can create event drinks"
  ON public.event_drinks FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_any_role(auth.uid(), ARRAY['cafe'::app_role, 'manager'::app_role, 'admin'::app_role])
  );

DROP POLICY IF EXISTS "Cafe staff can update event drinks" ON public.event_drinks;
CREATE POLICY "Cafe staff can update event drinks"
  ON public.event_drinks FOR UPDATE
  TO authenticated
  USING (
    public.user_has_any_role(auth.uid(), ARRAY['cafe'::app_role, 'manager'::app_role, 'admin'::app_role])
  );

DROP POLICY IF EXISTS "Managers can delete event drinks" ON public.event_drinks;
CREATE POLICY "Managers can delete event drinks"
  ON public.event_drinks FOR DELETE
  TO authenticated
  USING (
    public.is_manager_or_admin(auth.uid())
  );

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_event_drinks_is_archived ON public.event_drinks(is_archived);
CREATE INDEX IF NOT EXISTS idx_event_drinks_event_date ON public.event_drinks(event_date);
CREATE INDEX IF NOT EXISTS idx_event_drinks_needs_followup ON public.event_drinks(needs_followup);

-- 5. Auto-update updated_at trigger
DROP TRIGGER IF EXISTS update_event_drinks_updated_at ON public.event_drinks;
CREATE TRIGGER update_event_drinks_updated_at
  BEFORE UPDATE ON public.event_drinks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create private storage bucket for email thread files
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-drinks-files', 'event-drinks-files', false)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage RLS policies
DROP POLICY IF EXISTS "Cafe staff can upload event drink files" ON storage.objects;
CREATE POLICY "Cafe staff can upload event drink files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-drinks-files'
    AND public.user_has_any_role(auth.uid(), ARRAY['cafe'::app_role, 'manager'::app_role, 'admin'::app_role])
  );

DROP POLICY IF EXISTS "Cafe staff can view event drink files" ON storage.objects;
CREATE POLICY "Cafe staff can view event drink files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'event-drinks-files'
    AND public.user_has_any_role(auth.uid(), ARRAY['cafe'::app_role, 'manager'::app_role, 'admin'::app_role])
  );

DROP POLICY IF EXISTS "Cafe staff can update event drink files" ON storage.objects;
CREATE POLICY "Cafe staff can update event drink files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'event-drinks-files'
    AND public.user_has_any_role(auth.uid(), ARRAY['cafe'::app_role, 'manager'::app_role, 'admin'::app_role])
  );

DROP POLICY IF EXISTS "Managers can delete event drink files" ON storage.objects;
CREATE POLICY "Managers can delete event drink files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-drinks-files'
    AND public.is_manager_or_admin(auth.uid())
  );


-- ========== Migration: 20260212050000_import_event_drinks_history.sql ==========
-- =============================================
-- Import historical event drinks data
-- =============================================
-- Source: event_drinks-export-2026-02-11_19-57-11.csv
-- Transforms:
--   notes        → additional_notes
--   photoshoot   false/true → NULL/'Yes'
--   menu_printed false/true → NULL/'Yes'
--   staff JSON   ["a","b"] → postgres array '{"a","b"}'

INSERT INTO public.event_drinks (
  id, event_name, event_type, event_type_notes, drink_name, event_date,
  staff, supplies_ordered, supplies_ordered_at,
  photoshoot, photoshoot_at, menu_printed, menu_printed_at,
  staff_notified, staff_notified_at,
  needs_followup, recipe, food, supplies_needed, additional_notes,
  is_archived, created_by, created_at, updated_at
) VALUES

-- 1. Book Launch Brunch w/ Tomas El Rayes
(
  'f80e4607-b3d0-4b9e-a45b-c0350c4a793c',
  'Book Launch Brunch w/ Tomas El Rayes',
  'Saturday Social', NULL,
  'N/A',
  '2026-02-28',
  '{}',
  false, NULL,
  NULL, NULL,
  NULL, NULL,
  false, NULL,
  false,
  NULL, NULL, NULL, NULL,
  false, 'Unknown',
  '2026-01-09 19:48:16.858026+00',
  '2026-01-09 19:49:06.736+00'
),

-- 2. NOYZ – Apple Blossom Matcha
(
  'c3af1a69-e68c-4368-bada-d1155d559916',
  'NOYZ',
  'Saturday Social', NULL,
  'Apple Blossom Matcha',
  '2026-02-07',
  '{}',
  false, NULL,
  NULL, NULL,
  NULL, NULL,
  false, NULL,
  false,
  NULL, NULL, NULL,
  E'1. ONLY HUMAN:\nVANILLA BEAN / AMBROXAN / CEDARWOOD\n\n2. DETOUR:\nGARDENIA BLOOM / APPLE BLOSSOM / SKIN MUSK',
  false, 'Unknown',
  '2026-01-09 19:42:22.036184+00',
  '2026-01-18 02:03:18.764+00'
),

-- 3. Biogena One – Free Add-In (archived)
(
  '3380295e-c9d5-4e06-a619-e2df41575afc',
  'Biogena One',
  'Saturday Social', NULL,
  'Free Add-In',
  '2025-01-10',
  '{"Skye","Charlie","Chris"}',
  false, NULL,
  NULL, NULL,
  NULL, NULL,
  false, NULL,
  false,
  'Free Biogena One powder supplement add-in to any drink purchase',
  NULL, NULL, NULL,
  true, 'Unknown',
  '2026-01-09 19:22:11.632828+00',
  '2026-01-10 20:44:33.413+00'
),

-- 4. Shrtlst – Tropical Recharge
(
  '2ebc67aa-6851-4649-bf8e-36955e3333fe',
  'Shrtlst',
  'Saturday Social', NULL,
  'Tropical Recharge',
  '2026-01-24',
  '{"Chris","Skye","Charlie"}',
  false, NULL,
  NULL, NULL,
  NULL, NULL,
  false, NULL,
  false,
  'They are going with our traditional recharge smoothie to mimic their clouds/ in the air theme. They are bringing their own branded cups.',
  NULL, NULL, NULL,
  false, 'Unknown',
  '2026-01-08 23:58:43.485859+00',
  '2026-01-09 19:22:59.575+00'
),

-- 5. DUO Training Workshop – Complimentary Bites (archived)
(
  'c1117f30-12b4-4a7b-8866-3edb312bbea9',
  'DUO Training Workshop',
  'Other', 'HUME Workshop/ Hang',
  'Complimentary Bites',
  '2026-01-11',
  '{"Chris","Charlie"}',
  true, '2026-01-09',
  NULL, NULL,
  'Yes', '2026-01-09',
  false, NULL,
  false,
  'prep black drip coffee (complimentary) to workshop attendees 10am',
  E'prep light bites from cafe / Gjusta (overnight oats, chia pudding, smoothie samples 2x flavors) for 11:00am\nGjusta items will be divided up into little espresso portion cups\nSmoothie samples in 8 oz cups\nSmoothies: cacao powder and olive oil glow?',
  E'mini spoons (Skye)\nCafe signage (abbey)',
  NULL,
  true, 'Unknown',
  '2026-01-09 00:17:00.695663+00',
  '2026-01-13 20:45:13.85+00'
),

-- 6. Momentum – Free add-in
(
  '13c2221b-f5dd-4784-a962-69085d299c02',
  'Momentum',
  'Saturday Social', NULL,
  'Free add-in',
  '2026-01-17',
  '{"Skye","Chris","Charlie"}',
  false, NULL,
  NULL, NULL,
  NULL, NULL,
  false, NULL,
  false,
  NULL, NULL, NULL,
  E'1 free scoop to any drink',
  false, 'Unknown',
  '2026-01-09 19:33:33.319916+00',
  '2026-01-13 23:08:51.14+00'
),

-- 7. Magna Sat Social – Tropical Magna Smoothie
(
  'a3e7b6b7-0881-43be-a483-0450a2da8c2a',
  'Magna Sat Social',
  'Saturday Social', NULL,
  'Tropical Magna Smoothie',
  '2026-01-31',
  '{"Skye","Charlie","Chris"}',
  false, NULL,
  NULL, NULL,
  NULL, NULL,
  false, NULL,
  false,
  NULL, NULL, NULL,
  'First 30 purchases of Magna Tropical Smoothie get free Magna sample pack.',
  false, 'Unknown',
  '2026-01-09 19:30:25.421364+00',
  '2026-01-13 23:22:19.013+00'
),

-- 8. Half Past 8
(
  'aeeee6a6-310a-46c7-9953-960f1ef0af2d',
  'Half Past 8',
  'Saturday Social', NULL,
  'NA',
  '2026-02-21',
  '{}',
  false, NULL,
  NULL, NULL,
  NULL, NULL,
  false, NULL,
  false,
  NULL, NULL, NULL, NULL,
  false, 'Unknown',
  '2026-01-09 19:46:37.003443+00',
  '2026-01-09 19:46:37.003443+00'
)

ON CONFLICT (id) DO NOTHING;


-- ========== Migration: 20260212120000_order_checks_tables_and_backfill_state.sql ==========
-- Toast order checks: target table, staging table, and backfill state for per-check sync from Toast ordersBulk.

-- 1.1 Target table order_checks (one row per Toast Check)
CREATE TABLE IF NOT EXISTS public.order_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_guid TEXT NOT NULL UNIQUE,
  order_guid TEXT NOT NULL,
  business_date DATE NOT NULL,
  amount NUMERIC(10,2),
  tax_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  payment_status TEXT,
  paid_date TIMESTAMPTZ,
  closed_date TIMESTAMPTZ,
  voided BOOLEAN DEFAULT false,
  void_date TIMESTAMPTZ,
  raw_data JSONB,
  sync_batch_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_checks_check_guid ON public.order_checks(check_guid);
CREATE INDEX IF NOT EXISTS idx_order_checks_business_date ON public.order_checks(business_date);
CREATE INDEX IF NOT EXISTS idx_order_checks_order_guid ON public.order_checks(order_guid);
CREATE INDEX IF NOT EXISTS idx_order_checks_sync_batch ON public.order_checks(sync_batch_id);

ALTER TABLE public.order_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view order_checks" ON public.order_checks;
CREATE POLICY "Authenticated users can view order_checks"
  ON public.order_checks
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can manage order_checks" ON public.order_checks;
CREATE POLICY "Service role can manage order_checks"
  ON public.order_checks
  FOR ALL
  TO service_role
  USING (true);

GRANT SELECT ON public.order_checks TO authenticated;
GRANT ALL ON public.order_checks TO service_role;

COMMENT ON TABLE public.order_checks IS 'Per-check data synced from Toast POS ordersBulk API';

-- 1.2 Staging table order_checks_staging
CREATE TABLE IF NOT EXISTS public.order_checks_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_guid TEXT NOT NULL,
  order_guid TEXT NOT NULL,
  business_date DATE NOT NULL,
  amount NUMERIC(10,2),
  tax_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  payment_status TEXT,
  paid_date TIMESTAMPTZ,
  closed_date TIMESTAMPTZ,
  voided BOOLEAN DEFAULT false,
  void_date TIMESTAMPTZ,
  raw_data JSONB,
  sync_batch_id UUID NOT NULL,
  staged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(check_guid, sync_batch_id)
);

CREATE INDEX IF NOT EXISTS idx_order_checks_staging_batch ON public.order_checks_staging(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_order_checks_staging_business_date ON public.order_checks_staging(business_date);

ALTER TABLE public.order_checks_staging ENABLE ROW LEVEL SECURITY;

-- Staging: managers can manage (same pattern as toast_staging); service_role for edge functions
DROP POLICY IF EXISTS "Managers can manage order_checks_staging" ON public.order_checks_staging;
CREATE POLICY "Managers can manage order_checks_staging"
  ON public.order_checks_staging
  FOR ALL
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Service role can manage order_checks_staging" ON public.order_checks_staging;
CREATE POLICY "Service role can manage order_checks_staging"
  ON public.order_checks_staging
  FOR ALL
  TO service_role
  USING (true);

GRANT ALL ON public.order_checks_staging TO service_role;

COMMENT ON TABLE public.order_checks_staging IS 'Staging for Toast order checks before transfer to order_checks';

-- 1.3 Backfill state table order_checks_backfill_state
CREATE TABLE IF NOT EXISTS public.order_checks_backfill_state (
  id TEXT PRIMARY KEY DEFAULT 'order_checks_backfill',
  cursor_date DATE NOT NULL DEFAULT '2024-08-01',
  cursor_page INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'paused')),
  last_error TEXT,
  last_synced_at TIMESTAMPTZ,
  total_checks_synced INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.order_checks_backfill_state ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.order_checks_backfill_state IS 'Resumable Toast order checks backfill: cursor_date + cursor_page.';

INSERT INTO public.order_checks_backfill_state (id, cursor_date, cursor_page, status)
VALUES ('order_checks_backfill', '2024-08-01', 1, 'running')
ON CONFLICT (id) DO NOTHING;

-- 1.4 Sync schedule for order_checks_backfill
INSERT INTO public.sync_schedule (
  sync_type,
  display_name,
  function_name,
  interval_minutes,
  is_enabled,
  next_run_at,
  last_status
) VALUES (
  'order_checks_backfill',
  'Toast Order Checks Backfill',
  'toast-order-checks-backfill',
  3,
  true,
  now(),
  'pending'
) ON CONFLICT (sync_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  function_name = EXCLUDED.function_name,
  interval_minutes = EXCLUDED.interval_minutes,
  is_enabled = EXCLUDED.is_enabled;


-- ========== Migration: 20260212200000_resource_outdated_flags.sql ==========
-- ============================================================================
-- Resource Outdated Flags + Inbox Reads
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Tables
-- --------------------------------------------------------------------------

-- resource_outdated_flags: staff-reported flags for outdated resources.
-- Uses a polymorphic pattern (resource_type + resource_id) with no FK
-- constraint because the referenced row can live in one of 4 tables.
CREATE TABLE IF NOT EXISTS public.resource_outdated_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic resource reference (4 possible target tables)
  resource_type text NOT NULL CHECK (resource_type IN (
    'quick_link_group', 'quick_link_item', 'resource_page', 'club_policy'
  )),
  resource_id uuid NOT NULL,
  resource_label text NOT NULL,  -- human-readable name stored at flag time

  -- Who flagged and why
  flagged_by_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flagged_by_name text NOT NULL,
  note text NOT NULL,  -- mandatory explanation

  -- Resolution tracking
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dismissed', 'resolved')),
  resolved_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_by_name text,
  resolved_at timestamptz,
  resolution_note text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- inbox_reads: generalised read-tracking for the management inbox.
-- Replaces the per-feature staff_qa_reads pattern with a single table that
-- supports multiple item types (qa, flag, shift_note).
CREATE TABLE IF NOT EXISTS public.inbox_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('qa', 'flag', 'shift_note')),
  item_id uuid NOT NULL,
  read_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- --------------------------------------------------------------------------
-- 2. Enable RLS
-- --------------------------------------------------------------------------

ALTER TABLE public.resource_outdated_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_reads              ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- 3. RLS Policies — resource_outdated_flags
-- --------------------------------------------------------------------------

-- All authenticated users can read flags (needed for "Under Review" badges)
DROP POLICY IF EXISTS "Authenticated can read flags" ON public.resource_outdated_flags;
CREATE POLICY "Authenticated can read flags"
  ON public.resource_outdated_flags
  FOR SELECT
  TO authenticated
  USING (true);

-- Any authenticated user can create a flag on their own behalf
DROP POLICY IF EXISTS "Authenticated can create flags" ON public.resource_outdated_flags;
CREATE POLICY "Authenticated can create flags"
  ON public.resource_outdated_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (flagged_by_id = auth.uid());

-- Managers/admins can update flags (resolve or dismiss)
DROP POLICY IF EXISTS "Managers can update flags" ON public.resource_outdated_flags;
CREATE POLICY "Managers can update flags"
  ON public.resource_outdated_flags
  FOR UPDATE
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

-- Managers/admins can delete flags
DROP POLICY IF EXISTS "Managers can delete flags" ON public.resource_outdated_flags;
CREATE POLICY "Managers can delete flags"
  ON public.resource_outdated_flags
  FOR DELETE
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

-- --------------------------------------------------------------------------
-- 4. RLS Policies — inbox_reads
-- --------------------------------------------------------------------------

-- Users manage their own inbox read markers
DROP POLICY IF EXISTS "Users manage own inbox reads" ON public.inbox_reads;
CREATE POLICY "Users manage own inbox reads"
  ON public.inbox_reads
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- 5. Indexes
-- --------------------------------------------------------------------------

-- Fast lookup for "Under Review" badge rendering on resource pages
CREATE INDEX IF NOT EXISTS idx_resource_flags_resource
  ON public.resource_outdated_flags (resource_type, resource_id)
  WHERE status = 'pending';

-- Management inbox query — pending flags sorted newest-first
CREATE INDEX IF NOT EXISTS idx_resource_flags_status_created
  ON public.resource_outdated_flags (status, created_at DESC);

-- Inbox reads lookup by user
CREATE INDEX IF NOT EXISTS idx_inbox_reads_user
  ON public.inbox_reads (user_id, item_type);

-- --------------------------------------------------------------------------
-- 6. Triggers
-- --------------------------------------------------------------------------

DROP TRIGGER IF EXISTS update_resource_outdated_flags_updated_at ON public.resource_outdated_flags;
CREATE TRIGGER update_resource_outdated_flags_updated_at
  BEFORE UPDATE ON public.resource_outdated_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- --------------------------------------------------------------------------
-- 7. Data Migration — copy existing staff_qa_reads into inbox_reads
-- --------------------------------------------------------------------------

INSERT INTO public.inbox_reads (user_id, item_type, item_id, read_at)
SELECT user_id, 'qa', qa_id, read_at
FROM public.staff_qa_reads
ON CONFLICT (user_id, item_type, item_id) DO NOTHING;

-- --------------------------------------------------------------------------
-- 8. Comments
-- --------------------------------------------------------------------------

COMMENT ON TABLE public.resource_outdated_flags IS 'Staff-reported flags indicating a resource may contain outdated information';
COMMENT ON TABLE public.inbox_reads IS 'Tracks which management inbox items a user has read (qa, flag, shift_note)';


-- ========== Migration: 20260213000000_create_staff_resources.sql ==========
-- ============================================================================
-- Staff Resources: Quick Link Groups, Quick Link Items, Resource Pages
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Tables
-- --------------------------------------------------------------------------

-- Quick Link Groups: card containers assigned to roles
CREATE TABLE IF NOT EXISTS public.quick_link_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  assigned_roles app_role[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Quick Link Items: individual links inside a group
CREATE TABLE IF NOT EXISTS public.quick_link_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.quick_link_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Resource Pages: rich text content pages
CREATE TABLE IF NOT EXISTS public.resource_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  assigned_roles app_role[] NOT NULL DEFAULT '{}',
  is_published boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 2. Enable RLS
-- --------------------------------------------------------------------------

ALTER TABLE public.quick_link_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_link_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_pages    ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- 3. RLS Policies — quick_link_groups
-- --------------------------------------------------------------------------

-- Managers/admins: full CRUD
DROP POLICY IF EXISTS "quick_link_groups_manager_select" ON public.quick_link_groups;
CREATE POLICY "quick_link_groups_manager_select"
  ON public.quick_link_groups FOR SELECT
  USING (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "quick_link_groups_manager_insert" ON public.quick_link_groups;
CREATE POLICY "quick_link_groups_manager_insert"
  ON public.quick_link_groups FOR INSERT
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "quick_link_groups_manager_update" ON public.quick_link_groups;
CREATE POLICY "quick_link_groups_manager_update"
  ON public.quick_link_groups FOR UPDATE
  USING (public.is_manager_or_admin(auth.uid()))
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "quick_link_groups_manager_delete" ON public.quick_link_groups;
CREATE POLICY "quick_link_groups_manager_delete"
  ON public.quick_link_groups FOR DELETE
  USING (public.is_manager_or_admin(auth.uid()));

-- Staff: read groups assigned to their role
DROP POLICY IF EXISTS "quick_link_groups_staff_select" ON public.quick_link_groups;
CREATE POLICY "quick_link_groups_staff_select"
  ON public.quick_link_groups FOR SELECT
  USING (public.user_has_any_role(auth.uid(), assigned_roles));

-- --------------------------------------------------------------------------
-- 4. RLS Policies — quick_link_items
-- --------------------------------------------------------------------------

-- Managers/admins: full CRUD
DROP POLICY IF EXISTS "quick_link_items_manager_select" ON public.quick_link_items;
CREATE POLICY "quick_link_items_manager_select"
  ON public.quick_link_items FOR SELECT
  USING (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "quick_link_items_manager_insert" ON public.quick_link_items;
CREATE POLICY "quick_link_items_manager_insert"
  ON public.quick_link_items FOR INSERT
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "quick_link_items_manager_update" ON public.quick_link_items;
CREATE POLICY "quick_link_items_manager_update"
  ON public.quick_link_items FOR UPDATE
  USING (public.is_manager_or_admin(auth.uid()))
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "quick_link_items_manager_delete" ON public.quick_link_items;
CREATE POLICY "quick_link_items_manager_delete"
  ON public.quick_link_items FOR DELETE
  USING (public.is_manager_or_admin(auth.uid()));

-- Staff: read items whose parent group is assigned to their role
DROP POLICY IF EXISTS "quick_link_items_staff_select" ON public.quick_link_items;
CREATE POLICY "quick_link_items_staff_select"
  ON public.quick_link_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quick_link_groups g
      WHERE g.id = quick_link_items.group_id
        AND public.user_has_any_role(auth.uid(), g.assigned_roles)
    )
  );

-- --------------------------------------------------------------------------
-- 5. RLS Policies — resource_pages
-- --------------------------------------------------------------------------

-- Managers/admins: full CRUD
DROP POLICY IF EXISTS "resource_pages_manager_select" ON public.resource_pages;
CREATE POLICY "resource_pages_manager_select"
  ON public.resource_pages FOR SELECT
  USING (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "resource_pages_manager_insert" ON public.resource_pages;
CREATE POLICY "resource_pages_manager_insert"
  ON public.resource_pages FOR INSERT
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "resource_pages_manager_update" ON public.resource_pages;
CREATE POLICY "resource_pages_manager_update"
  ON public.resource_pages FOR UPDATE
  USING (public.is_manager_or_admin(auth.uid()))
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "resource_pages_manager_delete" ON public.resource_pages;
CREATE POLICY "resource_pages_manager_delete"
  ON public.resource_pages FOR DELETE
  USING (public.is_manager_or_admin(auth.uid()));

-- Staff: read published pages assigned to their role
DROP POLICY IF EXISTS "resource_pages_staff_select" ON public.resource_pages;
CREATE POLICY "resource_pages_staff_select"
  ON public.resource_pages FOR SELECT
  USING (
    is_published = true
    AND public.user_has_any_role(auth.uid(), assigned_roles)
  );

-- --------------------------------------------------------------------------
-- 6. Indexes
-- --------------------------------------------------------------------------

-- GIN indexes on role arrays for fast containment checks
CREATE INDEX IF NOT EXISTS idx_quick_link_groups_assigned_roles
  ON public.quick_link_groups USING gin (assigned_roles);

CREATE INDEX IF NOT EXISTS idx_resource_pages_assigned_roles
  ON public.resource_pages USING gin (assigned_roles);

-- btree indexes for ordering and lookups
CREATE INDEX IF NOT EXISTS idx_quick_link_groups_display_order
  ON public.quick_link_groups (display_order);

CREATE INDEX IF NOT EXISTS idx_quick_link_items_group_id
  ON public.quick_link_items (group_id);

CREATE INDEX IF NOT EXISTS idx_quick_link_items_display_order
  ON public.quick_link_items (display_order);

CREATE INDEX IF NOT EXISTS idx_resource_pages_is_published
  ON public.resource_pages (is_published);

-- --------------------------------------------------------------------------
-- 7. Triggers — auto-update updated_at
-- --------------------------------------------------------------------------

DROP TRIGGER IF EXISTS update_quick_link_groups_updated_at ON public.quick_link_groups;
CREATE TRIGGER update_quick_link_groups_updated_at
  BEFORE UPDATE ON public.quick_link_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_quick_link_items_updated_at ON public.quick_link_items;
CREATE TRIGGER update_quick_link_items_updated_at
  BEFORE UPDATE ON public.quick_link_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_resource_pages_updated_at ON public.resource_pages;
CREATE TRIGGER update_resource_pages_updated_at
  BEFORE UPDATE ON public.resource_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- --------------------------------------------------------------------------
-- 8. Seed Data — Concierge Quick Links (7 groups, 40 links)
-- --------------------------------------------------------------------------

DO $$
DECLARE
  _group_id uuid;
BEGIN

  -- Group 1: Temporary Memberships
  INSERT INTO public.quick_link_groups (title, display_order, assigned_roles)
  VALUES ('Temporary Memberships', 1, '{concierge}')
  RETURNING id INTO _group_id;

  INSERT INTO public.quick_link_items (group_id, name, url, display_order) VALUES
    (_group_id, 'Day Pass', 'https://hume.la/daypass', 1),
    (_group_id, 'One Week Pass', 'https://app.arketa.co/humeprojects/pricing/checkout/PuixJmIY8UZUOfPuc1RZ', 2),
    (_group_id, 'Two Week Pass', 'https://app.arketa.co/humeprojects/pricing/checkout/4nV9AtDrEPJgnhj2T23v', 3),
    (_group_id, 'Month Pass', 'https://app.arketa.co/humeprojects/pricing/checkout/n94aKHh6oDotnhR5pLjv', 4),
    (_group_id, 'Temp Pass Questionnaire', 'https://hume.la/tempmembership', 5);

  -- Group 2: Membership & Passes
  INSERT INTO public.quick_link_groups (title, display_order, assigned_roles)
  VALUES ('Membership & Passes', 2, '{concierge}')
  RETURNING id INTO _group_id;

  INSERT INTO public.quick_link_items (group_id, name, url, display_order) VALUES
    (_group_id, 'Phase 2 Payment', 'https://app.arketa.co/humeprojects/pricing/checkout/jj7mlhtpv7SylbzrKHDF', 1),
    (_group_id, 'Phase 3 Application (Pt 1)', 'https://hume.la/apply', 2),
    (_group_id, 'Phase 3 Application (Pt 2 - CC Info)', 'https://app.arketa.co/humeprojects/pricing/checkout/TF7S5VWOvSYPPoh20BfL', 3),
    (_group_id, 'Phase 3 Annual', 'https://app.arketa.co/humeprojects/pricing/checkout/lyykBfqD7ByVZqxSJIjZ', 4),
    (_group_id, 'Pause Policy', 'https://hume.la/pausepolicy', 5);

  -- Group 3: Tours & Registration
  INSERT INTO public.quick_link_groups (title, display_order, assigned_roles)
  VALUES ('Tours & Registration', 3, '{concierge}')
  RETURNING id INTO _group_id;

  INSERT INTO public.quick_link_items (group_id, name, url, display_order) VALUES
    (_group_id, 'Club Tour Schedule', 'https://calendly.com/humela/tour/?month=2025-06', 1),
    (_group_id, 'Tour Registration Form', 'https://app.arketa.co/humeprojects/intake-form/8ulXmvYgoqjNyd3o9BiK', 2),
    (_group_id, 'Guest Registration', 'https://hume.la/guestpass', 3),
    (_group_id, 'Cafe Guest Form/Waiver', 'https://app.arketa.co/humeprojects/intake-form/gbDPkFV66FYKVwCGwjXe', 4),
    (_group_id, 'Dylan Gym Floor Walkthrough', 'https://calendly.com/humela/club-tour-clone?back=1&month=2025-09', 5),
    (_group_id, 'Class Schedule', 'https://app.arketa.co/humeprojects/schedule', 6);

  -- Group 4: Private Sessions & Appointments
  INSERT INTO public.quick_link_groups (title, display_order, assigned_roles)
  VALUES ('Private Sessions & Appointments', 4, '{concierge}')
  RETURNING id INTO _group_id;

  INSERT INTO public.quick_link_items (group_id, name, url, display_order) VALUES
    (_group_id, 'Non-Member Private Session Purchase', 'https://app.arketa.co/humeprojects/pricing/checkout/cQahytIcDz2JJcsKs33B', 1),
    (_group_id, 'Private Appt Scheduling (General)', 'https://app.arketa.co/humeprojects/privates/by-service', 2),
    (_group_id, 'Massage Availability (Any Therapist)', 'https://app.arketa.co/humeprojects/privates/by-service/OKbSHlmC3G7H8PEjO90n/date?instructorId=any&locationId=ZpbZcKknSQeHKmmtYtes&roomId=any', 3),
    (_group_id, 'Personal Training Availability', 'https://app.arketa.co/humeprojects/privates/by-service/UB9vTC8QIdZeF3fuikCK/date?instructorId=any&locationId=ZpbZcKknSQeHKmmtYtes&roomId=any&calendarId=&date=2026-01-13&time=', 4),
    (_group_id, 'Trainer/Specialist Availability', 'https://docs.google.com/spreadsheets/d/1_xrQKcHF095-YBkPTLfd6m9MajdlGe3gfmFXarGmlHQ/edit?usp=sharing', 5),
    (_group_id, 'IV Therapy Booking', 'https://hume.nomadmd.app', 6),
    (_group_id, 'Jenna Consultation', 'https://calendly.com/hume-jenna/consult?month=2026-01', 7),
    (_group_id, 'Trainer Bios', 'https://hume.la/trainers', 8),
    (_group_id, 'Q-Intake Form for HBOT & FB Pro', 'https://intakeq.com/new/hhwini/', 9);

  -- Group 5: Events & Gifts
  INSERT INTO public.quick_link_groups (title, display_order, assigned_roles)
  VALUES ('Events & Gifts', 5, '{concierge}')
  RETURNING id INTO _group_id;

  INSERT INTO public.quick_link_items (group_id, name, url, display_order) VALUES
    (_group_id, 'Gift Card', 'https://app.arketa.co/humeprojects/gifting', 1),
    (_group_id, 'Event Inquiries', 'https://hume.la/events', 2);

  -- Group 6: Trackers & References
  INSERT INTO public.quick_link_groups (title, display_order, assigned_roles)
  VALUES ('Trackers & References', 6, '{concierge}')
  RETURNING id INTO _group_id;

  INSERT INTO public.quick_link_items (group_id, name, url, display_order) VALUES
    (_group_id, 'Cancellation Tracker', 'https://docs.google.com/spreadsheets/d/1OA5iIdJyG2lDOt3hRp-Z3yuHSobfeEm80MEjQtw2GGw/edit?usp=sharing', 1),
    (_group_id, 'Lost and Found Tracker', 'https://docs.google.com/spreadsheets/d/1IcW5S8pdyhMdFlQFIGupfdTM2x74CiIUcoVqOAPQKEo/edit?usp=sharing', 2),
    (_group_id, 'OSEA Product Reference', 'https://docs.google.com/document/d/16wXDYQDj2CmhqQpxnCHcg0f5-czo3jFbIhQ0mWGi9y0/edit?usp=sharing', 3),
    (_group_id, 'Hume + Mastercard Overview', 'https://docs.google.com/document/d/1C4uWKLM4y8Eksfyh20lx8ESlqdPknaVoP_oGnESFmQc/edit?usp=sharing', 4),
    (_group_id, 'FOH Closet Index', 'https://docs.google.com/spreadsheets/d/1gPrH9n9eLIps3TYQvdRTA5_ZrcPJuvNQIAU39Sb0AQE/edit?gid=1763833801#gid=1763833801', 5),
    (_group_id, 'Garage Inventory Index', 'https://docs.google.com/spreadsheets/d/17XPgYQw2UHran4cimgwU-r1xUOnfzPTkQH7nLZhBOTE/edit?usp=sharing', 6),
    (_group_id, 'Retail Inventory Report', 'https://docs.google.com/spreadsheets/d/1mpFmLfurC2muE7zXncab5gns4zuZdlH06MSG7dKs6HE/edit?usp=sharing', 7),
    (_group_id, 'Equipment Attachments', 'https://docs.google.com/spreadsheets/d/1IBBDLpNQ16rprnQuvXpfOgJXS0w1Q18OJj6Hq390dao/edit?usp=sharing', 8),
    (_group_id, 'Private Session Pricing', 'https://docs.google.com/document/d/1YsjH2ZkRqVw6ABPhmlqwcS-kVEbD-cuhPjXxhusNWcY/edit?usp=sharing', 9),
    (_group_id, 'Weekly Updates', 'https://docs.google.com/document/d/1ecAGndTbNCg7g9p-8mKY0N8-bnuoiF_x/edit?usp=sharing&ouid=111370512065880803227&rtpof=true&sd=true', 10);

  -- Group 7: Treatment & Equipment Guides
  INSERT INTO public.quick_link_groups (title, display_order, assigned_roles)
  VALUES ('Treatment & Equipment Guides', 7, '{concierge}')
  RETURNING id INTO _group_id;

  INSERT INTO public.quick_link_items (group_id, name, url, display_order) VALUES
    (_group_id, 'Balancer Pro Tutorial', 'https://docs.google.com/document/d/1dOm4-eHkG5TIMQfIetPcAlxjkadZDB0OTRUqGVOcApU/edit?usp=sharing', 1),
    (_group_id, 'HBOT Tutorial', 'https://docs.google.com/document/d/18yqBLWGwfvLU8H2AV-7FCzslb91DHihh99uQNi8B8K4/edit?usp=sharing', 2),
    (_group_id, 'Detox Rebecca Treatment Overview', 'https://docs.google.com/document/d/1AH0wA0Q_8nItv6xPGaTrMY3xf7DqNJFaFXYnHEk3GO4/edit?tab=t.0#heading=h.9trcv997yfgb', 3);

END $$;


-- ========== Migration: 20260213100000_add_get_unread_message_count_fn.sql ==========
-- Optimizes the unread message count query from two sequential queries
-- (N+1 pattern) into a single database function call.
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT count(*)::integer
  FROM public.staff_messages m
  WHERE m.is_sent = true
    AND m.recipient_ids @> ARRAY[p_user_id]
    AND NOT EXISTS (
      SELECT 1
      FROM public.staff_message_reads r
      WHERE r.message_id = m.id
        AND r.staff_id = p_user_id
    );
$$;


-- ========== Migration: 20260213100001_standardize_event_drinks_created_by.sql ==========
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


-- ========== Migration: 20260213100002_add_missing_fk_indexes.sql ==========
-- Add missing indexes on foreign key columns for better join/lookup performance.

CREATE INDEX IF NOT EXISTS idx_quick_link_groups_created_by
  ON public.quick_link_groups(created_by);

CREATE INDEX IF NOT EXISTS idx_resource_pages_created_by
  ON public.resource_pages(created_by);


-- ========== Migration: 20260213120000_toast_order_guid_not_null.sql ==========
-- Enforce order_guid NOT NULL on toast_staging and toast_sales.
-- Syncs always provide order_guid (from order.guid or fallback UUID).
-- Skip if tables do not exist (e.g. toast not used in this project).
-- Also skip if the order_guid column doesn't exist (it was dropped in an earlier migration).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'toast_staging' 
    AND column_name = 'order_guid'
  ) THEN
    DELETE FROM toast_staging WHERE order_guid IS NULL;
    ALTER TABLE public.toast_staging ALTER COLUMN order_guid SET NOT NULL;
    COMMENT ON COLUMN public.toast_staging.order_guid IS 'Toast order GUID; one row per order.';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'toast_sales' 
    AND column_name = 'order_guid'
  ) THEN
    DELETE FROM toast_sales WHERE order_guid IS NULL;
    ALTER TABLE public.toast_sales ALTER COLUMN order_guid SET NOT NULL;
    COMMENT ON COLUMN public.toast_sales.order_guid IS 'Toast order GUID; one row per order.';
  END IF;
END $$;


-- ========== Migration: 20260213191947_add_pdf_support_to_resource_pages.sql ==========
-- ============================================================================
-- Add PDF Support to Resource Pages
--
-- Extends resource_pages table to support PDF page types alongside builder pages
-- PDFs share the same metadata model (title, roles, folder, tags, published)
-- but store file references instead of TipTap JSON content
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Add PDF-specific columns to resource_pages
-- --------------------------------------------------------------------------

ALTER TABLE public.resource_pages
  ADD COLUMN IF NOT EXISTS page_type text NOT NULL DEFAULT 'builder'
    CHECK (page_type IN ('builder', 'pdf')),
  ADD COLUMN IF NOT EXISTS pdf_file_url text,
  ADD COLUMN IF NOT EXISTS pdf_file_path text,
  ADD COLUMN IF NOT EXISTS pdf_file_size integer,
  ADD COLUMN IF NOT EXISTS pdf_original_filename text,
  ADD COLUMN IF NOT EXISTS pdf_page_count integer;

-- --------------------------------------------------------------------------
-- 2. Create index for filtering by type
-- --------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_resource_pages_type ON public.resource_pages(page_type);

-- --------------------------------------------------------------------------
-- 3. Add column comments explaining the design
-- --------------------------------------------------------------------------

COMMENT ON COLUMN public.resource_pages.page_type IS 
  'Type of page: builder (TipTap JSON content) or pdf (uploaded PDF file). Defaults to builder for existing pages.';

COMMENT ON COLUMN public.resource_pages.pdf_file_url IS 
  'Public URL for PDF files, stored in resource-page-assets bucket under pdfs/ prefix. Only used when page_type=pdf.';

COMMENT ON COLUMN public.resource_pages.pdf_file_path IS 
  'Storage path for PDF file deletion/replacement (e.g., pdfs/abc123.pdf). Only used when page_type=pdf.';

COMMENT ON COLUMN public.resource_pages.pdf_file_size IS 
  'File size in bytes for display (e.g., "2.3 MB"). Only used when page_type=pdf.';

COMMENT ON COLUMN public.resource_pages.pdf_original_filename IS 
  'Original filename from upload for download links. Only used when page_type=pdf.';

COMMENT ON COLUMN public.resource_pages.pdf_page_count IS 
  'Number of pages in PDF (extracted on upload). Only used when page_type=pdf.';


-- ========== Migration: 20260214000000_sick_day_pay_requests.sql ==========
-- Create sick day pay requests table
CREATE TABLE IF NOT EXISTS public.sick_day_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  user_name TEXT NOT NULL,
  requested_dates DATE[] NOT NULL,
  notes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by_id UUID REFERENCES auth.users(id),
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sick_requests_user ON public.sick_day_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_sick_requests_status ON public.sick_day_requests(status);
CREATE INDEX IF NOT EXISTS idx_sick_requests_dates ON public.sick_day_requests USING gin(requested_dates);

-- RLS Policies
ALTER TABLE public.sick_day_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
DROP POLICY IF EXISTS "Users can view own sick day requests" ON public.sick_day_requests;
CREATE POLICY "Users can view own sick day requests"
ON public.sick_day_requests FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own requests
DROP POLICY IF EXISTS "Users can create own sick day requests" ON public.sick_day_requests;
CREATE POLICY "Users can create own sick day requests"
ON public.sick_day_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Managers/admins can view all requests
DROP POLICY IF EXISTS "Managers can view all sick day requests" ON public.sick_day_requests;
CREATE POLICY "Managers can view all sick day requests"
ON public.sick_day_requests FOR SELECT
USING (public.is_manager_or_admin(auth.uid()));

-- Managers/admins can update requests
DROP POLICY IF EXISTS "Managers can update sick day requests" ON public.sick_day_requests;
CREATE POLICY "Managers can update sick day requests"
ON public.sick_day_requests FOR UPDATE
USING (public.is_manager_or_admin(auth.uid()));


-- ========== Migration: 20260215120000_daily_schedule_arketa_migration.sql ==========
-- Daily schedule: disconnect from Sling, rename to daily_schedule, repurpose for Arketa classes + reservations.
-- See plan: daily_schedule Arketa Migration.

-- 1) Rename table (skip if already renamed or source table missing)
DO $$
BEGIN
  -- Only rename if daily_schedules exists and daily_schedule does NOT exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_schedules')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_schedule') THEN
    ALTER TABLE public.daily_schedules RENAME TO daily_schedule;
  -- If daily_schedule already exists but daily_schedules also exists, drop daily_schedules
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_schedule')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_schedules') THEN
    DROP TABLE public.daily_schedules CASCADE;
  -- If neither exists, raise error
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_schedule') THEN
    RAISE EXCEPTION 'Table daily_schedules does not exist and daily_schedule does not exist - cannot run daily_schedule migration';
  END IF;
END $$;

-- 2) Drop old unique constraint (name from default convention)
ALTER TABLE public.daily_schedule DROP CONSTRAINT IF EXISTS daily_schedules_schedule_date_sling_user_id_shift_start_key;

-- 3) Drop old columns
ALTER TABLE public.daily_schedule
  DROP COLUMN IF EXISTS sling_user_id,
  DROP COLUMN IF EXISTS staff_id,
  DROP COLUMN IF EXISTS staff_name,
  DROP COLUMN IF EXISTS position,
  DROP COLUMN IF EXISTS shift_start,
  DROP COLUMN IF EXISTS shift_end,
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS is_currently_working,
  DROP COLUMN IF EXISTS last_synced_at;

-- 4) Add new columns (only if they don't already exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_schedule' AND column_name = 'class_id') THEN
    ALTER TABLE public.daily_schedule ADD COLUMN class_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_schedule' AND column_name = 'start_time') THEN
    ALTER TABLE public.daily_schedule ADD COLUMN start_time timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_schedule' AND column_name = 'end_time') THEN
    ALTER TABLE public.daily_schedule ADD COLUMN end_time timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_schedule' AND column_name = 'class_name') THEN
    ALTER TABLE public.daily_schedule ADD COLUMN class_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_schedule' AND column_name = 'max_capacity') THEN
    ALTER TABLE public.daily_schedule ADD COLUMN max_capacity integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_schedule' AND column_name = 'total_booked') THEN
    ALTER TABLE public.daily_schedule ADD COLUMN total_booked integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_schedule' AND column_name = 'instructor') THEN
    ALTER TABLE public.daily_schedule ADD COLUMN instructor text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_schedule' AND column_name = 'description') THEN
    ALTER TABLE public.daily_schedule ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_schedule' AND column_name = 'updated_at') THEN
    ALTER TABLE public.daily_schedule ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_schedule' AND column_name = 'canceled') THEN
    ALTER TABLE public.daily_schedule ADD COLUMN canceled boolean DEFAULT false;
  END IF;
END $$;

-- 5) Clear existing rows (Sling data no longer applicable), then add NOT NULL
-- Only truncate if table still has old Sling-related columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'daily_schedule' AND column_name = 'sling_user_id') THEN
    TRUNCATE public.daily_schedule;
  END IF;
END $$;

-- Set NOT NULL constraints only if they're not already set
DO $$
BEGIN
  -- Check and set class_id NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_schedule' 
    AND column_name = 'class_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.daily_schedule ALTER COLUMN class_id SET NOT NULL;
  END IF;
  
  -- Check and set start_time NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_schedule' 
    AND column_name = 'start_time'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.daily_schedule ALTER COLUMN start_time SET NOT NULL;
  END IF;
  
  -- Check and set class_name NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_schedule' 
    AND column_name = 'class_name'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.daily_schedule ALTER COLUMN class_name SET NOT NULL;
  END IF;
END $$;

-- 6) Add unique constraint (only if it doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'daily_schedule_schedule_date_class_id_key'
  ) THEN
    ALTER TABLE public.daily_schedule
      ADD CONSTRAINT daily_schedule_schedule_date_class_id_key UNIQUE (schedule_date, class_id);
  END IF;
END $$;

-- 7) Drop old RLS policies (names referenced daily_schedules)
DROP POLICY IF EXISTS "Managers can manage daily_schedules" ON public.daily_schedule;
DROP POLICY IF EXISTS "Concierges can view daily_schedules" ON public.daily_schedule;

-- 8) Create new RLS policies
DROP POLICY IF EXISTS "Managers can manage daily_schedule" ON public.daily_schedule;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'daily_schedule'
    AND policyname = 'Managers can manage daily_schedule'
  ) THEN
    CREATE POLICY "Managers can manage daily_schedule"
      ON public.daily_schedule FOR ALL
      USING (is_manager_or_admin(auth.uid()));
  END IF;
END $$;

DROP POLICY IF EXISTS "Concierges can view daily_schedule" ON public.daily_schedule;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'daily_schedule'
    AND policyname = 'Concierges can view daily_schedule'
  ) THEN
    CREATE POLICY "Concierges can view daily_schedule"
      ON public.daily_schedule FOR SELECT
      USING (user_has_role(auth.uid(), 'concierge'));
  END IF;
END $$;

-- 9) Drop old indexes and create new ones
DROP INDEX IF EXISTS public.idx_daily_schedules_date;
DROP INDEX IF EXISTS public.idx_daily_schedules_user;

CREATE INDEX IF NOT EXISTS idx_daily_schedule_date ON public.daily_schedule(schedule_date);
CREATE INDEX IF NOT EXISTS idx_daily_schedule_class_id ON public.daily_schedule(class_id);

-- 10) updated_at trigger
DROP TRIGGER IF EXISTS update_daily_schedule_updated_at ON public.daily_schedule;
CREATE TRIGGER update_daily_schedule_updated_at
  BEFORE UPDATE ON public.daily_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.daily_schedule IS 'Daily class schedule from arketa_classes + arketa_reservations_history; refreshed at 12am and after reservations sync.';

-- 11) RPC to refresh daily_schedule for a given date (used by edge function and optionally by trigger)
CREATE OR REPLACE FUNCTION public.refresh_daily_schedule(p_schedule_date date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer;
BEGIN
  DELETE FROM public.daily_schedule WHERE schedule_date = p_schedule_date;

  INSERT INTO public.daily_schedule (
    class_id,
    schedule_date,
    start_time,
    end_time,
    class_name,
    max_capacity,
    total_booked,
    instructor,
    description,
    updated_at,
    canceled
  )
  SELECT
    c.external_id,
    c.class_date,
    c.start_time,
    c.start_time + COALESCE((c.duration_minutes || ' minutes')::interval, interval '0'),
    c.name,
    c.capacity,
    COALESCE(r.total_booked, 0)::integer,
    c.instructor_name,
    NULL,
    now(),
    COALESCE(c.is_cancelled, false)
  FROM public.arketa_classes c
  LEFT JOIN (
    SELECT class_id, class_date,
           COUNT(*) FILTER (WHERE status IS DISTINCT FROM 'cancelled') AS total_booked
    FROM public.arketa_reservations_history
    GROUP BY class_id, class_date
  ) r ON c.external_id = r.class_id AND c.class_date = r.class_date
  WHERE c.class_date = p_schedule_date;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

COMMENT ON FUNCTION public.refresh_daily_schedule(date) IS 'Refreshes daily_schedule for the given date from arketa_classes + arketa_reservations_history. Returns number of rows inserted.';

GRANT EXECUTE ON FUNCTION public.refresh_daily_schedule(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_daily_schedule(date) TO authenticated;

-- 12) Triggers: refresh daily_schedule when arketa_reservations_history changes (one trigger per event; transition tables require single-event triggers)
CREATE OR REPLACE FUNCTION public.refresh_daily_schedule_on_reservations_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d date;
BEGIN
  FOR d IN SELECT DISTINCT class_date FROM new_t WHERE class_date IS NOT NULL
  LOOP
    PERFORM refresh_daily_schedule(d);
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_daily_schedule_on_reservations_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d date;
BEGIN
  FOR d IN
    SELECT DISTINCT dt FROM (
      SELECT class_date AS dt FROM new_t WHERE class_date IS NOT NULL
      UNION
      SELECT class_date AS dt FROM old_t WHERE class_date IS NOT NULL
    ) sub
  LOOP
    PERFORM refresh_daily_schedule(d);
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_daily_schedule_on_reservations_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d date;
BEGIN
  FOR d IN SELECT DISTINCT class_date FROM old_t WHERE class_date IS NOT NULL
  LOOP
    PERFORM refresh_daily_schedule(d);
  END LOOP;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_refresh_daily_schedule_on_reservations ON public.arketa_reservations_history;
DROP TRIGGER IF EXISTS trigger_refresh_daily_schedule_on_reservations_insert ON public.arketa_reservations_history;
DROP TRIGGER IF EXISTS trigger_refresh_daily_schedule_on_reservations_update ON public.arketa_reservations_history;
DROP TRIGGER IF EXISTS trigger_refresh_daily_schedule_on_reservations_delete ON public.arketa_reservations_history;

DROP TRIGGER IF EXISTS trigger_refresh_daily_schedule_on_reservations_insert ON public.arketa_reservations_history;
CREATE TRIGGER trigger_refresh_daily_schedule_on_reservations_insert
  AFTER INSERT ON public.arketa_reservations_history
  REFERENCING NEW TABLE AS new_t
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_daily_schedule_on_reservations_insert();

DROP TRIGGER IF EXISTS trigger_refresh_daily_schedule_on_reservations_update ON public.arketa_reservations_history;
CREATE TRIGGER trigger_refresh_daily_schedule_on_reservations_update
  AFTER UPDATE ON public.arketa_reservations_history
  REFERENCING OLD TABLE AS old_t NEW TABLE AS new_t
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_daily_schedule_on_reservations_update();

DROP TRIGGER IF EXISTS trigger_refresh_daily_schedule_on_reservations_delete ON public.arketa_reservations_history;
CREATE TRIGGER trigger_refresh_daily_schedule_on_reservations_delete
  AFTER DELETE ON public.arketa_reservations_history
  REFERENCING OLD TABLE AS old_t
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_daily_schedule_on_reservations_delete();

-- 13) Add daily_schedule to sync_schedule for 12am refresh (interval 1440 min; external cron should call at 00:00 Pacific for exact midnight)
INSERT INTO public.sync_schedule (
  sync_type,
  display_name,
  function_name,
  interval_minutes,
  next_run_at,
  is_enabled,
  last_status
)
VALUES (
  'daily_schedule',
  'Daily Schedule',
  'refresh-daily-schedule',
  1440,
  now(),
  true,
  'pending'
)
ON CONFLICT (sync_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  function_name = EXCLUDED.function_name,
  interval_minutes = EXCLUDED.interval_minutes,
  is_enabled = EXCLUDED.is_enabled;


-- ========== Migration: 20260216100000_enhance_daily_reports_manager_tool.sql ==========
-- Enhance daily_reports table for Manager Report Tool
-- Adds weather, feedback JSONB arrays, facility notes, class details, reservation metrics, sync tracking

-- Rename cafe_net_sales to cafe_sales for consistency
ALTER TABLE public.daily_reports
  RENAME COLUMN cafe_net_sales TO cafe_sales;

-- Add new columns (single ALTER with multiple ADD COLUMN for compatibility)
ALTER TABLE public.daily_reports
  ADD COLUMN IF NOT EXISTS weather text,
  ADD COLUMN IF NOT EXISTS private_appointments int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_sales_membership numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_sales_other numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS positive_feedback_am jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS positive_feedback_pm jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS negative_feedback_am jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS negative_feedback_pm jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS facility_notes_am jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS facility_notes_pm jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS crowd_comments_am text,
  ADD COLUMN IF NOT EXISTS crowd_comments_pm text,
  ADD COLUMN IF NOT EXISTS tour_notes text,
  ADD COLUMN IF NOT EXISTS tour_followup_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancellation_notes text,
  ADD COLUMN IF NOT EXISTS cafe_notes text,
  ADD COLUMN IF NOT EXISTS other_notes text,
  ADD COLUMN IF NOT EXISTS class_details jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total_cancellations int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_no_shows int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_waitlisted int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attendance_rate numeric(5,2),
  ADD COLUMN IF NOT EXISTS class_popularity jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS instructor_metrics jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS member_metrics jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sync_source text DEFAULT 'auto';

-- Add check constraint for sync_source (avoid error if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_reports_sync_source_check'
  ) THEN
    ALTER TABLE public.daily_reports
      ADD CONSTRAINT daily_reports_sync_source_check
      CHECK (sync_source IS NULL OR sync_source IN ('auto', 'manual'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.daily_reports.weather IS 'Weather condition from Open-Meteo API';
COMMENT ON COLUMN public.daily_reports.positive_feedback_am IS 'Positive member feedback from AM shift (JSONB array)';
COMMENT ON COLUMN public.daily_reports.positive_feedback_pm IS 'Positive member feedback from PM shift (JSONB array)';
COMMENT ON COLUMN public.daily_reports.class_details IS 'Class schedule with time, name, instructor, signups, waitlist';
COMMENT ON COLUMN public.daily_reports.sync_source IS 'How aggregation was triggered: auto or manual';


-- ========== Migration: 20260216100001_sync_schedule_daily_report_aggregation.sql ==========
-- Add daily report aggregation to sync_schedule for hourly auto-runs
INSERT INTO public.sync_schedule (
  sync_type,
  display_name,
  function_name,
  interval_minutes,
  next_run_at,
  is_enabled,
  last_status
)
VALUES (
  'daily_report_aggregation',
  'Daily Report Aggregation',
  'auto-aggregate-daily-report',
  60,
  now(),
  true,
  'pending'
)
ON CONFLICT (sync_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  function_name = EXCLUDED.function_name,
  interval_minutes = EXCLUDED.interval_minutes,
  is_enabled = EXCLUDED.is_enabled;


-- ========== Migration: 20260216120000_api_sync_skipped_records.sql ==========
-- Table for logging records skipped or anomalous per API sync (e.g. reservations without matching class_id).
-- Dev Tools page shows one tab per api_name with tables that update when backfill/cron/manual sync runs.

CREATE TABLE IF NOT EXISTS public.api_sync_skipped_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name text NOT NULL,
  record_id text NOT NULL,
  secondary_id text,
  reason text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_sync_skipped_records_api_name ON public.api_sync_skipped_records(api_name);
CREATE INDEX IF NOT EXISTS idx_api_sync_skipped_records_created_at ON public.api_sync_skipped_records(created_at DESC);

ALTER TABLE public.api_sync_skipped_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can view api_sync_skipped_records" ON public.api_sync_skipped_records;
CREATE POLICY "Managers can view api_sync_skipped_records"
  ON public.api_sync_skipped_records FOR SELECT
  USING (public.is_manager_or_admin(auth.uid()));

-- Inserts are done by edge functions using service role (bypasses RLS).

COMMENT ON TABLE public.api_sync_skipped_records IS 'Per-record log of skipped or anomalous records from API syncs; used by Dev Tools Sync Skipped Records page.';


-- ========== Migration: 20260217120000_arketa_classes_staging_and_schema.sql ==========
-- Arketa classes: add description/updated_at, unique on (external_id, class_date), recreate staging.
-- See plan: Arketa Classes Staging and Schema.

-- 1) Add description and updated_at to arketa_classes if not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'arketa_classes' AND column_name = 'description') THEN
    ALTER TABLE public.arketa_classes ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'arketa_classes' AND column_name = 'updated_at') THEN
    ALTER TABLE public.arketa_classes ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 2) Drop existing unique constraint on external_id and add unique (external_id, class_date)
ALTER TABLE public.arketa_classes DROP CONSTRAINT IF EXISTS arketa_classes_external_id_key;
ALTER TABLE public.arketa_classes
  ADD CONSTRAINT arketa_classes_external_id_class_date_key UNIQUE (external_id, class_date);

-- 3) updated_at trigger on arketa_classes (ensure function exists from earlier migrations)
DROP TRIGGER IF EXISTS update_arketa_classes_updated_at ON public.arketa_classes;
CREATE TRIGGER update_arketa_classes_updated_at
  BEFORE UPDATE ON public.arketa_classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Drop existing arketa_classes_staging and recreate with new schema
DROP TABLE IF EXISTS public.arketa_classes_staging;

CREATE TABLE IF NOT EXISTS public.arketa_classes_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text NOT NULL,
  class_date date NOT NULL,
  start_time timestamptz NOT NULL,
  duration_minutes integer,
  name text NOT NULL,
  capacity integer,
  instructor_name text,
  is_cancelled boolean DEFAULT false,
  description text,
  booked_count integer DEFAULT 0,
  waitlist_count integer DEFAULT 0,
  status text,
  room_name text,
  raw_data jsonb,
  synced_at timestamptz DEFAULT now(),
  sync_batch_id uuid NOT NULL,
  staged_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arketa_classes_staging_sync_batch_id ON public.arketa_classes_staging(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_arketa_classes_staging_class_date ON public.arketa_classes_staging(class_date);

ALTER TABLE public.arketa_classes_staging ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage arketa_classes_staging" ON public.arketa_classes_staging;
CREATE POLICY "Managers can manage arketa_classes_staging"
  ON public.arketa_classes_staging FOR ALL
  USING (is_manager_or_admin(auth.uid()));

COMMENT ON TABLE public.arketa_classes_staging IS 'Staging for Arketa classes sync; rows upserted to arketa_classes on (external_id, class_date) then deleted.';

-- 5) RPC: upsert from staging into arketa_classes then delete staging rows for the batch
CREATE OR REPLACE FUNCTION public.upsert_arketa_classes_from_staging(p_sync_batch_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_count integer;
BEGIN
  INSERT INTO public.arketa_classes (
    external_id,
    class_date,
    start_time,
    duration_minutes,
    name,
    capacity,
    instructor_name,
    is_cancelled,
    description,
    booked_count,
    waitlist_count,
    status,
    room_name,
    raw_data,
    synced_at,
    updated_at
  )
  SELECT
    external_id,
    class_date,
    start_time,
    duration_minutes,
    name,
    capacity,
    instructor_name,
    is_cancelled,
    description,
    booked_count,
    waitlist_count,
    status,
    room_name,
    raw_data,
    synced_at,
    now()
  FROM public.arketa_classes_staging
  WHERE sync_batch_id = p_sync_batch_id
  ON CONFLICT (external_id, class_date) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    duration_minutes = EXCLUDED.duration_minutes,
    name = EXCLUDED.name,
    capacity = EXCLUDED.capacity,
    instructor_name = EXCLUDED.instructor_name,
    is_cancelled = EXCLUDED.is_cancelled,
    description = EXCLUDED.description,
    booked_count = EXCLUDED.booked_count,
    waitlist_count = EXCLUDED.waitlist_count,
    status = EXCLUDED.status,
    room_name = EXCLUDED.room_name,
    raw_data = EXCLUDED.raw_data,
    synced_at = EXCLUDED.synced_at,
    updated_at = now();

  GET DIAGNOSTICS affected_count = ROW_COUNT;

  DELETE FROM public.arketa_classes_staging
  WHERE sync_batch_id = p_sync_batch_id;

  RETURN affected_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_arketa_classes_from_staging(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_arketa_classes_from_staging(uuid) TO authenticated;

COMMENT ON FUNCTION public.upsert_arketa_classes_from_staging(uuid) IS 'Upserts staging rows into arketa_classes on (external_id, class_date), then deletes those staging rows. Returns number of rows upserted.';


-- ========== Migration: 20260218120000_drop_orphan_announcements_tables.sql ==========
-- Drop orphaned announcements tables (consolidate on staff_announcements)
-- Tables public.announcements and public.announcement_reads are only used by
-- CommunicationsPage/useAnnouncements; we refactor the app to use staff_announcements only.
-- CASCADE drops any FK from staff_announcement_comments (or others) that incorrectly
-- reference announcements; we then re-add the correct FK to staff_announcements.

DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
DROP TABLE IF EXISTS public.announcement_reads;
DROP TABLE IF EXISTS public.announcements CASCADE;

-- Ensure staff_announcement_comments references staff_announcements (CASCADE may have removed the wrong FK)
ALTER TABLE public.staff_announcement_comments
  DROP CONSTRAINT IF EXISTS staff_announcement_comments_announcement_id_fkey;
ALTER TABLE public.staff_announcement_comments
  ADD CONSTRAINT staff_announcement_comments_announcement_id_fkey
  FOREIGN KEY (announcement_id) REFERENCES public.staff_announcements(id) ON DELETE CASCADE;


-- ========== Migration: 20260218120001_staff_announcement_type_enum.sql ==========
-- Add staff_announcement_type enum and migrate staff_announcements.announcement_type
-- Values: 'announcement' (replaces 'alert'), 'weekly_update'
-- Drop default first so the type change can run, then set the new default.

CREATE TYPE public.staff_announcement_type AS ENUM ('announcement', 'weekly_update');

ALTER TABLE public.staff_announcements
  ALTER COLUMN announcement_type DROP DEFAULT;

ALTER TABLE public.staff_announcements
  ALTER COLUMN announcement_type TYPE public.staff_announcement_type
  USING (
    CASE
      WHEN announcement_type::text = 'weekly_update' THEN 'weekly_update'::public.staff_announcement_type
      ELSE 'announcement'::public.staff_announcement_type
    END
  );

ALTER TABLE public.staff_announcements
  ALTER COLUMN announcement_type SET DEFAULT 'announcement'::public.staff_announcement_type;


-- ========== Migration: 20260218120002_import_weekly_updates_csv.sql ==========
-- Import weekly updates history from CSV (weekly_updates-export-2026-02-10)
-- Upserts 9 rows into staff_announcements with announcement_type = 'weekly_update'.
-- department "all" -> target_departments NULL; "FOH" -> target_departments ARRAY['concierge'].
-- Idempotent: safe to re-run (ON CONFLICT DO UPDATE).

INSERT INTO public.staff_announcements (
  id,
  title,
  content,
  announcement_type,
  priority,
  target_departments,
  week_start_date,
  photo_url,
  expires_at,
  scheduled_at,
  is_active,
  created_by,
  created_by_id,
  created_at
) VALUES
(
  'cf640abb-f12f-4b93-8263-05f0d6d003f4',
  'Weekly Updates - 12/5/25',
  E'SAUNA & STEAM ROOM:\nThere is a new change to the sauna and steam room policy–the steam room is going to be programmed 15 minutes before close instead of 30 mins. Members are now allowed to stay in both spaces until 15 minutes before close.\n\nVENN DIAGRAM FOR CC''S:\nThere is a new chart for who to CC/ forward emails to. It can be found in the master email templates. Please check before forwarding because many more things are being sent to Abbey and Roger than needed. Please use the events form template when anyone inquires about a photoshoot/ space rental/ event.\n\nNEW PAYMENT TERMINAL:\nWe now have a tap to pay option! The tap to pay terminal will live at the front desk. For members, proceed as usual and then select "send to payment terminal" → select Payment Terminal → send to payment terminal again and then tap to pay. You can email receipts the same way you normally do.\n\nFor non members, click the "New Sale" button that lives above the "Home" button in the top left corner of arketa. Once selected, click "create a walk in sale" under "search client". The terminal will need to stay charged, so please keep an eye on it.\n\nNEW MEMBER & GUEST POLICY CARDS:\nThese need to be given out every time there is a guest and every time there is a new member. There are backups in the cabinet behind the desk.\n\nNEW MAT CLEANING LOCATION:\nThe office is officially gone. The new mat cleaning spot is now in the garage next to where the break room will be (far left corner of the garage, past the huge towel bins).\n\nNEW DATABASE:\nI have created a new database! This is a way to consolidate the many forms we have into one spot. This will now be filled out instead of the daily reports apply, will let them know when a spot opens up.',
  'weekly_update'::public.staff_announcement_type,
  'normal',
  NULL,
  '2025-12-01',
  NULL,
  NULL,
  NULL,
  true,
  'Management',
  NULL,
  '2025-12-12 00:28:38.865527+00'
),
(
  'd12e6cc0-eb36-4055-b7c3-b008405b2a06',
  'Weekly Updates - 12/2/25',
  E'NEW TEMPLATES:\nThere are new templates for the following:\n1. If a brand or someone in the industry wants to come see the space (it is a polite no)\n2. If people complain about the pause policy/ billing cycle\n3. For questions/ complaints regarding the upcoming holiday/ renovation closure\n\nAll can be found in the master email templates doc. For context: we currently have many people on our waitlist, which means we are able to enforce our policies and risk the cancellations. We will not be offering exemptions 99% of the time.\n\nAPPOINTMENT AVAILABILITY LINK:\nYou can send links to view appointment availability. This will be helpful if someone is like "I want to book a massage next week. When is available?". I added the links to the important links page.\n\nTEMPORARY PASSES REMINDER:\nReminder on day passes and temporary passes: you can still send an application for temporary passes or day passes when people inquire. However, please know that our day passes/ temp memberships now require member referral and a week''s notice. Since we are at capacity, Roger is approving all temporary passes.\n\nPAUSE/ CANCELLATION IN DAILY NOTES:\nPlease do not add just a name under the "pause/ cancellation" section. Add full name, whether they are pausing or canceling, and the reason.\n\nCAPACITY & NEW MEMBERS:\nWhen I say we are "at capacity", this means we are not increasing the number of members that we have. However, we are still accepting new members when spots become available.',
  'weekly_update'::public.staff_announcement_type,
  'normal',
  NULL,
  '2025-12-01',
  NULL,
  NULL,
  NULL,
  true,
  'Management',
  NULL,
  '2025-12-12 00:28:38.865527+00'
),
(
  'b752fcd2-d469-4d3c-8bdc-1be9b595e165',
  'Weekly Updates - 11/21/25',
  E'SWAPPING CLASSES:\nThe members are trying to get sneaky by asking us to swap them out of one class and into another to avoid the late cancel fees.\n\nSwapping Class - 1st Time Request:\nThank you for reaching out! We are able to facilitate the switch as a one-time courtesy. In the future, to switch classes, please first cancel the class you are currently signed up for through the app.\n\nSwapping Class - Repeated Request:\nThank you for reaching out! To switch classes, please cancel the class you are currently signed up for through the app.\n\nNEW STUDIO:\nThe new HIIT studio will have 8 treadmills and boxing bags. Please don''t mention classes or other programming in there to members yet.\n\nDAILY NOTES - CANCELLATIONS/ PAUSES:\nPlease don''t just put someone''s name in the "cancellation/ pause" section with no additional information. Please add if they paused or cancelled with the reason why.\n\nCANCELLING AN APPLICATION:\nIf someone wants to cancel their application and they have already given CC, you must cancel their "trial membership".\n\nEARLY CLOSURE:\nWe will be closed for thanksgiving next Thursday and we close early on Wednesday at 1:30 PM.\n\nARKETA INBOX:\nThe arketa inbox has been a little neglected. Please be sure to close out a conversation once it has been answered.\n\nDAY PASSES/ SERVICES AVAILABLE TO NON MEMBERS:\nWe are no longer selling day passes or temporary memberships to randoms. To purchase a day pass, use a service, or get a temp membership, the person must fill out the temp pass application at least one week before their intended visit with a member referral.',
  'weekly_update'::public.staff_announcement_type,
  'normal',
  NULL,
  '2025-11-17',
  NULL,
  NULL,
  NULL,
  true,
  'Management',
  NULL,
  '2025-12-12 00:28:38.865527+00'
),
(
  '65d67a4c-074c-4e80-a9fe-dbf8182791f9',
  'Weekly Updates - 11/14/25',
  E'CAPACITY:\nWe are aware capacity is an issue and have capped membership. If someone complains, please ask them what space was full, what time, etc.\n\nGOODBYE BELLA:\nOur beautiful Bella has moved on from HUME. Dustin is now our Events and Partnerships Lead. Abbey will be continuing her social media/ content role at a greater capacity.\n\nCONCERNS/ QUESTIONS TRACKER:\nRemember to please add your questions/ concerns in the tracker instead of just in notes!\n\nTARP FOLDING:\nPlease fold tarps after uncovering the machines in the morning and drape them over the railings.\n\nCLOCKING OUT:\nDo not clock in before you are in the facilities. Clock out when you leave the facilities.\n\nBREAKS:\nWeekday AM - clock out for break by 10:20 at the LATEST\nWeekday PM - clock out for break by 6:20 at the LATEST\nWeekend AM - clock out for break by 11:20 at the LATEST\nWeekend PM - 5:50 at the LATEST\n\nLOST AND FOUND:\nIt is in the old staff closet. Please do not let that closet get messy.\n\nOSEA LAUNCH:\nWe are now selling OSEA retail! All products are in arketa. There is an OSEA product reference page on our important links.',
  'weekly_update'::public.staff_announcement_type,
  'normal',
  NULL,
  '2025-11-10',
  NULL,
  NULL,
  NULL,
  true,
  'Management',
  NULL,
  '2025-12-12 00:28:38.865527+00'
),
(
  '32dd183b-4742-466b-ada4-be8185672df5',
  'Weekly Updates - 10/24/25',
  E'PRICING REMINDER:\nThe new membership price is $450, not $495. The new annual rate is $4,595 (no initiation).\n\nPOLICY CARDS:\nReminder to please give out policy cards to guests, day pass holders, and new members!\n\nMASTERCARD:\nIf someone reaches out inquiring about Mastercard, please give them my email and let them know I am happy to help.\n\nPOTENTIAL MEMBERS ASKING FOR OLD PRICING:\nUnless someone has already put in CC info for Phase 2 pricing, they cannot get Phase 2 pricing. There is 0.1% room for negotiation.\n\nHBOT BEING LEFT ON:\nThe HBOT keeps being left on. Even if the member prefers to let themselves out, please remember to turn the HBOT off afterward and remake the sheets.\n\nNEW MASTER EMAIL GUIDE & OUTLOOK FOLDER:\nDustin has put together a new Master Email Templates guide! It is beautiful and should be fully up to date.\n\nPAUSE CHART:\nRoger still wants us to track all pause requests. Please remember to update it!\n\nCANCELLATIONS:\nReminder to always get a reason before confirming a cancellation!\n\nTRAINER/ INSTRUCTOR AVAIL:\nThere is now a document that has the general availability of our instructors and trainers on the important links page.',
  'weekly_update'::public.staff_announcement_type,
  'normal',
  NULL,
  '2025-10-20',
  NULL,
  NULL,
  NULL,
  true,
  'Management',
  NULL,
  '2025-12-12 00:28:38.865527+00'
),
(
  '1b3edfaf-6d9d-4550-a294-a9b41fd3a54b',
  'WEEKLY UPDATES 12-12-25',
  E'GOODBYE JOLT:\nWe have a new app! It is built by me and we will be trialing it out over the next several weeks. Here are download directions:\nPaste the link below into the web browser of your choice & follow directions to install on your home screen. I named mine "Staff Portal" but choose whatever. LINK: arketa-gym-flow.lovable.app/install\nLogin with your pin (the last 4 digits of your phone number)\nThe "Since You''ve Been Gone" notification will pop up with any unread messages and alerts.\nClick "Open Checklist" to see the list for the day. It is the same as jolt, but has music reset and mat cleaning times at the top. Pictures have been glitchy. Let me know if it doesn''t work!\n\nCAPACITY LANGUAGE:\nReminder we are not telling any prospective members that we "are not accepting new members". We still are, just on a very limited capacity and only when spots open. We are once again selling day/ temp passes, so please have people fill them out. I receive all apps and review with roger weekly.\n\nBLAKE GUESTS:\nBlake gets one guest pass per week for classes (not including his partner, Lea, who must be both checked in and signed up for class). Blake will text the desk the name and email of the guest. The guest must be checked in, given the policy handout, and added to class. They should not be late and Blake should meet them at the desk. There should NEVER be more than 21 mats for any of Blake''s classes. Please let me know if you have questions!\n\nCLASSES IN NEW IMPACT ROOM:\nTBD on this. If people ask, please tell them we are still trialing programing but are excited to be offering private sessions\n\nMOVIE NIGHT - 12/19\nWe are having a movie night for members next Friday on the rooftop. Tickets are $25 and must be reserved in advance. There will be goodie bags. Staff can buy tickets day-of. We are showing Elf.\n\nCLOSURE LANGUAGE & EMAILS:\nIf someone complains about the closure over email, still respond with the usual templates but forward to me for visibility. I will take over the thread if they push back after initial response. If people complain at the desk, please explain why we are closing (can use language from the template). If they still really press back, have them email the desk/ me\n\nMEMBERSHIP PAUSES & FEES:\nPlease remember to actually charge people the pause fee. It needs to be added as a membership and set to start the date their membership is set to pause. Also, we are no longer requiring 7 days advance notice before their billing cycle but we will not refund for billing dates already passed. The following circumstances are exempted from paying but still need to align with billing cycles: illness, injury, pregnancy or maternity/ paternity leave, emergency\n\nMEMBERSHIP ACTIVATIONS:\nBig change! We are now activating/ charging memberships at the desk. In the past, new members were charged both initiation and first month/ annual when they received the "Welcome to HUME" email. Now, new members will be charged initiation beforehand but their memberships will not be activated until their first visit. This is also true for annual members, who will be charged in full at the desk (they do not pay initiation)\n\nTo show you read this, please send me a screenshot of the homepage of the new app! Bonus if you tell me what you want for christmas/ a general gift (i wanted more vuori)',
  'weekly_update'::public.staff_announcement_type,
  'normal',
  NULL,
  '2025-12-12',
  NULL,
  NULL,
  NULL,
  true,
  'Jillian Brenner',
  NULL,
  '2025-12-12 21:17:00.143917+00'
),
(
  'a69fe6f7-7b79-4015-a0c1-601f5c821f1b',
  '1/16/26',
  E'DATABASE LINK:\nI will now be referring to the database as the "OS", short for Operations System. Kat, Dustin, and Roger have informed me it is not actually a database :/\n\nIf you accidentally x out of the OS, here is the link: https://arketa-gym-flow.lovable.app/\n\nDAY PASS PASSWORD:\nThe template has been updated to include the password for the day pass. We had to include a password because randoms somehow kept buying them. The password is HUME2026\n\nReminder that anyone purchasing a day pass must reach out before purchasing another one. For example, if someone bought a day pass last September and wants to visit in Feb, they must reach out ahead of time. We do not sell day passes at the door. Repeat visitors do not have to fill out the form more than once.\n\nTIME ZONE CLASSES\nFyi that time zone affects class times. If someone is on the east coast, they will see east coast times in the app. If someone is confused about class times seemingly changing, pls ask them if they are out of state\n\nNON-RESIDENT PASS:\nThe 30 day annual pass should only be offered to people who are moving. It is exclusively for non-LA residents\n\nTWO CLASSES IN ONE DAY:\nReminder that we can''t add people to their second class in one day more than 30-1 hour before their second class starts. I know a couple people like to call/ text often to be added. This particularly must be enforced for classes that often fill up or have 2 or less spots left.\n\nGUESTS IN CLASSES:\nI have updated the templates to say that guests can be added to class 30 minutes or less before class start time. I realized there has been some mixed messaging about how long before class members can add guests. Let''s keep our messaging as 30 minutes. That said, if someone shows up in the morning with a guest and wants to sign up for a class in a few hours with their guest, you may make a judgement call (if there is a lot of room in the class) but please let them know it is a one-time courtesy.\n\nRETAIL UPDATE:\nReminder that the osea items in the display are NOT FOR SALE. You MUST only take items from beneath the cabinets. The display items are not part of our retail. Dustin has provided a helpful osea product overview and cabinet supply index that can be found in important links.\n\nCABINET AND LOST AND FOUND UPDATE:\nThe cabinets have been labeled and lost and found has been organized. I will be walking each staff member through the new process in person. If I haven''t shown you by next Friday, pls find me and ask.\n\nCHANGING PAUSE DATES:\nThere seems to be ongoing confusion about to adjust a pause date after it has been set. If someone wants to extend their pause, please select "resume payment collections". The member will then be set to "active". From there, add a new pause date. Members are not automatically charged when you hit "resume payment collection"',
  'weekly_update'::public.staff_announcement_type,
  'normal',
  ARRAY['concierge'],
  '2026-01-16',
  NULL,
  NULL,
  NULL,
  true,
  'Management',
  NULL,
  '2026-01-16 19:54:35.826607+00'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  announcement_type = EXCLUDED.announcement_type,
  priority = EXCLUDED.priority,
  target_departments = EXCLUDED.target_departments,
  week_start_date = EXCLUDED.week_start_date,
  is_active = EXCLUDED.is_active,
  created_by = EXCLUDED.created_by,
  created_at = EXCLUDED.created_at;


-- ########## PHASE 8: Bug report reads, notification center, package tracking, policy sections, pdf, notifications (requires Phase 7) ##########
-- ========== Migration: 20260219000000_add_bug_report_reads_and_user_preferences.sql ==========
-- ============================================================================
-- Migration: Add Bug Report Reads and User Preferences Tables
-- Version: 20260219000000
-- Description: Adds bug_report_reads for tracking read state per user,
--              user_preferences for notification toggles, and enables
--              Supabase Realtime on bug_reports.
-- ============================================================================

-- 1. Create bug_report_reads table
CREATE TABLE IF NOT EXISTS public.bug_report_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_report_id UUID REFERENCES public.bug_reports(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (bug_report_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bug_report_reads_user ON bug_report_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_report_reads_bug ON bug_report_reads(bug_report_id);

-- Enable RLS on bug_report_reads
ALTER TABLE bug_report_reads ENABLE ROW LEVEL SECURITY;

-- Users can insert their own read receipts
DROP POLICY IF EXISTS "Users can mark bug reports as read" ON bug_report_reads;
CREATE POLICY "Users can mark bug reports as read"
  ON bug_report_reads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own read receipts
DROP POLICY IF EXISTS "Users can view own read receipts" ON bug_report_reads;
CREATE POLICY "Users can view own read receipts"
  ON bug_report_reads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own read receipts (needed for UPSERT on conflict)
DROP POLICY IF EXISTS "Users can update own read receipts" ON bug_report_reads;
CREATE POLICY "Users can update own read receipts"
  ON bug_report_reads FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Admins/managers can view all read receipts
DROP POLICY IF EXISTS "Admins can view all read receipts" ON bug_report_reads;
CREATE POLICY "Admins can view all read receipts"
  ON bug_report_reads FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT ur.user_id FROM user_roles ur
      WHERE ur.role IN ('admin', 'manager')
    )
  );

-- 2. Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bug_report_badge_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at trigger for user_preferences
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_preferences_updated_at ON user_preferences;
CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- 3. Enable Supabase Realtime on bug_reports for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE bug_reports;

-- ============================================================================
-- Migration Complete
-- ============================================================================


-- ========== Migration: 20260220000000_add_notification_center.sql ==========
-- ============================================================
-- Migration: Notification Center foundation
-- Adds dismissed_at to staff_notifications, creates
-- notification_preferences table, enables Realtime.
-- ============================================================

-- 1. Add dismissed_at column to staff_notifications
ALTER TABLE public.staff_notifications
  ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Indexes on staff_notifications
CREATE INDEX IF NOT EXISTS idx_staff_notifications_dismissed
  ON public.staff_notifications(user_id, dismissed_at)
  WHERE dismissed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_staff_notifications_created
  ON public.staff_notifications(user_id, created_at DESC);

-- 3. RLS DELETE policy on staff_notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.staff_notifications;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'staff_notifications'
      AND policyname = 'Users can delete own notifications'
  ) THEN
    CREATE POLICY "Users can delete own notifications"
      ON public.staff_notifications
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 4. Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  type_enabled JSONB DEFAULT '{
    "qa_answered": true, "qa_new_question": true, "announcement": true,
    "message": true, "bug_report_update": true, "member_alert": true,
    "class_turnover": true, "mat_cleaning": true
  }'::jsonb,
  delivery_method JSONB DEFAULT '{
    "qa_answered": "push", "qa_new_question": "push", "announcement": "push",
    "message": "push", "bug_report_update": "banner", "member_alert": "push",
    "class_turnover": "banner", "mat_cleaning": "banner"
  }'::jsonb,
  dnd_enabled BOOLEAN DEFAULT false,
  dnd_sling_linked BOOLEAN DEFAULT false,
  dnd_manual_start TIME DEFAULT NULL,
  dnd_manual_end TIME DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Enable RLS + policies on notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Managers can read all notification preferences" ON public.notification_preferences;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notification_preferences' AND policyname='Users can read own notification preferences') THEN
    CREATE POLICY "Users can read own notification preferences" ON public.notification_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notification_preferences' AND policyname='Users can insert own notification preferences') THEN
    CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notification_preferences' AND policyname='Users can update own notification preferences') THEN
    CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notification_preferences' AND policyname='Managers can read all notification preferences') THEN
    CREATE POLICY "Managers can read all notification preferences" ON public.notification_preferences FOR SELECT TO authenticated USING (public.is_manager_or_admin(auth.uid()));
  END IF;
END $$;

-- 6. Trigger: auto-update updated_at on notification_preferences
DROP TRIGGER IF EXISTS set_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER set_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Enable Realtime on staff_notifications
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE staff_notifications;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;


-- ========== Migration: 20260220000001_fix_auto_match_sling_trigger.sql ==========
-- Fix: The remote_schema migration (20260210162035) dropped:
--   1. profiles.sling_id column (line 755)
--   2. trigger_auto_match_sling_user trigger (line 18)
--   3. auto_match_sling_user() function (line 117)
--
-- The approval system migration (20260211135346) recreated the function but NOT
-- the column or trigger. Without these, auto_match_sling_user() never fires and
-- would fail anyway since sling_id doesn't exist on profiles.

-- 1. Restore sling_id column on profiles (dropped by remote_schema)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sling_id uuid REFERENCES public.sling_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_sling_id ON public.profiles(sling_id);

-- 2. Recreate the trigger so future signups get auto-matched and auto-approved
DROP TRIGGER IF EXISTS trigger_auto_match_sling_user ON public.profiles;

CREATE TRIGGER trigger_auto_match_sling_user
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_match_sling_user();

-- 3. Backfill: auto-approve existing profiles that match sling_users but are stuck as 'pending'
UPDATE public.profiles p
SET
  approval_status = 'auto_approved',
  approved_at = now(),
  sling_id = s.id
FROM public.sling_users s
WHERE LOWER(p.email) = LOWER(s.email)
  AND s.is_active = true
  AND p.approval_status = 'pending';

-- Also fix profiles that already have a sling_id but are still pending
UPDATE public.profiles
SET
  approval_status = 'auto_approved',
  approved_at = now()
WHERE sling_id IS NOT NULL
  AND approval_status = 'pending';


-- ========== Migration: 20260220000004_backfill_and_reassert_auto_match.sql ==========
-- Re-assert the auto_match_sling_user function with LOWER() email comparison
-- and re-run the backfill now that sling_users table is populated.

-- 1. Re-assert the trigger function (ensures LOWER comparison is in place)
CREATE OR REPLACE FUNCTION public.auto_match_sling_user()
RETURNS TRIGGER AS $$
DECLARE
  matched_sling_id uuid;
BEGIN
  -- Case-insensitive email match against sling_users
  SELECT id INTO matched_sling_id
  FROM public.sling_users
  WHERE LOWER(email) = LOWER(NEW.email)
    AND is_active = true
  LIMIT 1;
  
  -- If found, auto-approve and link to sling
  IF matched_sling_id IS NOT NULL THEN
    NEW.sling_id := matched_sling_id;
    NEW.approval_status := 'auto_approved';
    NEW.approved_at := now();
  ELSE
    -- No Sling match, keep as pending
    NEW.approval_status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Ensure trigger exists
DROP TRIGGER IF EXISTS trigger_auto_match_sling_user ON public.profiles;
CREATE TRIGGER trigger_auto_match_sling_user
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_match_sling_user();

-- 3. Backfill: auto-approve existing pending profiles that match sling_users
UPDATE public.profiles p
SET
  approval_status = 'auto_approved',
  approved_at = now(),
  sling_id = s.id
FROM public.sling_users s
WHERE LOWER(p.email) = LOWER(s.email)
  AND s.is_active = true
  AND p.approval_status = 'pending';

-- 4. Also fix any profiles that have a sling_id linked but are still pending
UPDATE public.profiles
SET
  approval_status = 'auto_approved',
  approved_at = now()
WHERE sling_id IS NOT NULL
  AND approval_status = 'pending';


-- ========== Migration: 20260220000005_add_must_change_password.sql ==========
-- Add must_change_password flag to profiles table
-- When an admin/manager resets a user's password, this flag is set to true.
-- On next login, the user is forced to create a new password before proceeding.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;


-- ========== Migration: 20260220100000_allow_cross_role_resource_search.sql ==========
-- ============================================================================
-- Allow all authenticated users to read all staff resources (cross-role search)
-- ============================================================================
-- The existing RLS policies restrict non-privileged staff to resources
-- assigned to their role. The unified resource search feature needs every
-- authenticated user to be able to read ALL quick link groups, items, and
-- resource pages so that cross-role search results can be displayed.
--
-- Because Supabase combines multiple PERMISSIVE policies with OR, adding
-- these policies does not weaken the existing manager/staff policies —
-- they simply widen SELECT access to all authenticated users.
-- ============================================================================

-- Quick link groups: allow all authenticated users to read
CREATE POLICY "authenticated_users_read_all_quick_link_groups"
  ON public.quick_link_groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Quick link items: allow all authenticated users to read
CREATE POLICY "authenticated_users_read_all_quick_link_items"
  ON public.quick_link_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Resource pages: allow all authenticated users to read published pages
CREATE POLICY "authenticated_users_read_published_resource_pages"
  ON public.resource_pages
  FOR SELECT
  TO authenticated
  USING (is_published = true);


-- ========== Migration: 20260220200000_arketa_combined_sync_schedule.sql ==========
-- Enable the combined classes+reservations sync on a 20-minute interval,
-- and disable the standalone reservations sync (now handled by the combined function).

UPDATE public.sync_schedule
SET function_name = 'sync-arketa-classes-and-reservations',
    interval_minutes = 20,
    is_enabled = true,
    display_name = 'Arketa Classes + Reservations',
    next_run_at = now(),
    updated_at = now()
WHERE sync_type = 'arketa_classes';

UPDATE public.sync_schedule
SET is_enabled = false,
    updated_at = now()
WHERE sync_type = 'arketa_reservations';


-- ========== Migration: 20260221000000_upgrade_resource_pages_for_builder.sql ==========
-- ============================================================================
-- Upgrade resource_pages for Page Builder (Phase 1)
--
-- Creates: resource_page_folders, resource_page_editors, resource_page_reads
-- Alters:  resource_pages (new columns, FK, indexes, data migration)
-- Storage: resource-page-assets bucket
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Create resource_page_folders table (must exist before FK from resource_pages)
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.resource_page_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  parent_folder_id uuid REFERENCES public.resource_page_folders(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_resource_page_folders_updated_at ON public.resource_page_folders;
CREATE TRIGGER update_resource_page_folders_updated_at
  BEFORE UPDATE ON public.resource_page_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.resource_page_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS folders_manager_all ON public.resource_page_folders;
CREATE POLICY folders_manager_all ON public.resource_page_folders
  FOR ALL USING (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS folders_staff_select ON public.resource_page_folders;
CREATE POLICY folders_staff_select ON public.resource_page_folders
  FOR SELECT USING (auth.role() = 'authenticated');

-- --------------------------------------------------------------------------
-- 2. Alter resource_pages — add new columns
-- --------------------------------------------------------------------------

ALTER TABLE public.resource_pages
  ADD COLUMN content_json jsonb,
  ADD COLUMN folder_id uuid,
  ADD COLUMN tags text[] DEFAULT '{}',
  ADD COLUMN search_text text,
  ADD COLUMN cover_image_url text,
  ADD COLUMN display_order integer DEFAULT 0,
  ADD COLUMN last_edited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- --------------------------------------------------------------------------
-- 3. Add FK from resource_pages.folder_id -> resource_page_folders
-- --------------------------------------------------------------------------

ALTER TABLE public.resource_pages
  ADD CONSTRAINT fk_resource_pages_folder
  FOREIGN KEY (folder_id) REFERENCES public.resource_page_folders(id) ON DELETE SET NULL;

-- --------------------------------------------------------------------------
-- 4. Backfill content_json and search_text from existing HTML content
-- --------------------------------------------------------------------------

UPDATE public.resource_pages
SET content_json = jsonb_build_object(
  'type', 'doc',
  'content', jsonb_build_array(
    jsonb_build_object(
      'type', 'paragraph',
      'content', jsonb_build_array(
        jsonb_build_object('type', 'text', 'text', COALESCE(content, ''))
      )
    )
  )
),
search_text = regexp_replace(COALESCE(content, ''), '<[^>]*>', '', 'g');

-- --------------------------------------------------------------------------
-- 5. Create indexes on resource_pages new columns
-- --------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_resource_pages_folder ON public.resource_pages(folder_id);
CREATE INDEX IF NOT EXISTS idx_resource_pages_tags ON public.resource_pages USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_resource_pages_search ON public.resource_pages USING GIN(to_tsvector('english', COALESCE(search_text, '')));
CREATE INDEX IF NOT EXISTS idx_resource_pages_display_order ON public.resource_pages(folder_id, display_order);

-- --------------------------------------------------------------------------
-- 6. Create resource_page_editors table (delegated editing)
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.resource_page_editors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.resource_pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamptz DEFAULT now(),
  UNIQUE(page_id, user_id)
);

ALTER TABLE public.resource_page_editors ENABLE ROW LEVEL SECURITY;

-- Managers can manage editors
DROP POLICY IF EXISTS editors_manager_all ON public.resource_page_editors;
CREATE POLICY editors_manager_all ON public.resource_page_editors
  FOR ALL USING (public.is_manager_or_admin(auth.uid()));

-- Delegated editors can see their own grants
DROP POLICY IF EXISTS editors_own_select ON public.resource_page_editors;
CREATE POLICY editors_own_select ON public.resource_page_editors
  FOR SELECT USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- 7. New RLS policy on resource_pages: delegated editors can UPDATE
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS resource_pages_editor_update ON public.resource_pages;
CREATE POLICY resource_pages_editor_update ON public.resource_pages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.resource_page_editors
      WHERE page_id = resource_pages.id AND user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- 8. Create resource_page_reads table (read receipts)
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.resource_page_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.resource_pages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(page_id, user_id)
);

ALTER TABLE public.resource_page_reads ENABLE ROW LEVEL SECURITY;

-- Staff can insert their own read receipts
DROP POLICY IF EXISTS reads_own_insert ON public.resource_page_reads;
CREATE POLICY reads_own_insert ON public.resource_page_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Staff can see their own reads
DROP POLICY IF EXISTS reads_own_select ON public.resource_page_reads;
CREATE POLICY reads_own_select ON public.resource_page_reads
  FOR SELECT USING (user_id = auth.uid());

-- Managers can see all reads (for the read receipt dashboard)
DROP POLICY IF EXISTS reads_manager_select ON public.resource_page_reads;
CREATE POLICY reads_manager_select ON public.resource_page_reads
  FOR SELECT USING (public.is_manager_or_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_page_reads_page ON public.resource_page_reads(page_id);
CREATE INDEX IF NOT EXISTS idx_page_reads_user ON public.resource_page_reads(user_id);

-- --------------------------------------------------------------------------
-- 9. Create storage bucket for page assets (images, etc.)
-- --------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('resource-page-assets', 'resource-page-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage.objects in this bucket
DROP POLICY IF EXISTS resource_assets_insert ON storage.objects;
CREATE POLICY resource_assets_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resource-page-assets' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS resource_assets_select ON storage.objects;
CREATE POLICY resource_assets_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resource-page-assets' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS resource_assets_delete ON storage.objects;
CREATE POLICY resource_assets_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resource-page-assets' AND public.is_manager_or_admin(auth.uid())
  );


-- ========== Migration: 20260222000000_create_package_tracking.sql ==========
-- Package Tracking System
-- Allows staff to scan packages, track locations with photos, and notify recipients

-- Create packages table
CREATE TABLE IF NOT EXISTS public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code text NOT NULL,
  recipient_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_name text, -- Fallback for non-users
  status text NOT NULL DEFAULT 'pending_pickup' 
    CHECK (status IN ('pending_pickup', 'picked_up', 'archived')),
  
  -- Timestamps
  arrived_at timestamptz NOT NULL DEFAULT now(),
  picked_up_at timestamptz,
  archived_at timestamptz,
  
  -- Location tracking
  current_location text NOT NULL,
  location_photo_url text NOT NULL, -- Required photo
  
  -- Metadata
  notes text,
  scanned_by_user_id uuid REFERENCES auth.users(id),
  marked_opened_by_user_id uuid REFERENCES auth.users(id),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create package location history table
CREATE TABLE IF NOT EXISTS public.package_location_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid REFERENCES public.packages(id) ON DELETE CASCADE,
  location text NOT NULL,
  location_photo_url text NOT NULL,
  moved_by_user_id uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_packages_recipient ON public.packages(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_packages_status ON public.packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_arrived_at ON public.packages(arrived_at DESC);
CREATE INDEX IF NOT EXISTS idx_packages_tracking ON public.packages(tracking_code);
CREATE INDEX IF NOT EXISTS idx_package_history_package ON public.package_location_history(package_id);

-- Create storage bucket for package photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('package-photos', 'package-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for package-photos bucket
CREATE POLICY "Authenticated users can upload package photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'package-photos');

CREATE POLICY "Anyone can view package photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'package-photos');

CREATE POLICY "Authenticated users can update their uploaded photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'package-photos')
  WITH CHECK (bucket_id = 'package-photos');

CREATE POLICY "Admins can delete package photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'package-photos' 
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_packages_updated_at ON public.packages;
CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up archived packages after 30 days
CREATE OR REPLACE FUNCTION cleanup_archived_packages()
RETURNS void AS $$
BEGIN
  -- Hard delete packages archived 30+ days ago
  DELETE FROM public.packages 
  WHERE status = 'archived' 
    AND archived_at < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Queue package photos for deletion when packages are deleted
CREATE OR REPLACE FUNCTION queue_package_photo_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue main location photo
  IF OLD.location_photo_url IS NOT NULL THEN
    INSERT INTO storage_deletion_queue (bucket_name, file_path)
    VALUES ('package-photos', regexp_replace(OLD.location_photo_url, '^.*/package-photos/', ''));
  END IF;
  
  -- Queue history photos
  INSERT INTO storage_deletion_queue (bucket_name, file_path)
  SELECT 'package-photos', regexp_replace(location_photo_url, '^.*/package-photos/', '')
  FROM public.package_location_history
  WHERE package_id = OLD.id AND location_photo_url IS NOT NULL;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS queue_package_photos_on_delete ON public.packages;
CREATE TRIGGER queue_package_photos_on_delete
  BEFORE DELETE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION queue_package_photo_deletion();

-- RLS Policies for packages table
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all packages"
  ON public.packages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert packages"
  ON public.packages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update packages"
  ON public.packages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only admins can delete packages"
  ON public.packages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for package_location_history table
ALTER TABLE public.package_location_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view package history"
  ON public.package_location_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert package history"
  ON public.package_location_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only admins can delete package history"
  ON public.package_location_history FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add package_arrived notification type (if staff_notifications table exists)
DO $$
BEGIN
  -- This is a soft addition - if the notification system evolves, 
  -- the type will be handled in the application layer
  NULL;
END $$;

-- Schedule cleanup job and reminders only if pg_cron is available (cron schema exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cron') THEN
    PERFORM cron.schedule(
      'cleanup-archived-packages',
      '0 2 * * *',
      'SELECT cleanup_archived_packages();'
    );
    PERFORM cron.schedule(
      'send-package-reminders',
      '0 9 * * *',
      $cron$
      SELECT net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/send-package-reminders',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
        )
      );
      $cron$
    );
  END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON public.packages TO authenticated;
GRANT ALL ON public.package_location_history TO authenticated;


-- ========== Migration: 20260223000000_policy_sections_redesign.sql ==========
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


-- ========== Migration: 20260224000000_add_pdf_text_search.sql ==========
-- ============================================================================
-- Add PDF Full-Text Search Support
--
-- Enhances resource_pages table with better text extraction and search
-- capabilities for PDF documents. Adds trigger to normalize search text
-- and ensures proper indexing for full-text search.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Verify search_text column exists (should be from builder migration)
-- --------------------------------------------------------------------------

-- This column should already exist from 20260221000000_upgrade_resource_pages_for_builder.sql
-- But we'll add it conditionally just in case
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_pages' 
    AND column_name = 'search_text'
  ) THEN
    ALTER TABLE public.resource_pages ADD COLUMN search_text text;
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 2. Create function to normalize and clean PDF search text
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION extract_pdf_search_text()
RETURNS trigger AS $$
BEGIN
  -- For PDF pages, search_text is populated by application during upload
  -- This trigger ensures it's normalized and cleaned for better search results
  IF NEW.page_type = 'pdf' AND NEW.search_text IS NOT NULL THEN
    -- Normalize whitespace: replace multiple spaces/newlines with single space
    NEW.search_text := regexp_replace(NEW.search_text, '\s+', ' ', 'g');
    
    -- Trim leading and trailing whitespace
    NEW.search_text := trim(NEW.search_text);
    
    -- Remove any control characters
    NEW.search_text := regexp_replace(NEW.search_text, '[\x00-\x1F\x7F]', '', 'g');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------------
-- 3. Create trigger to clean search text on insert/update
-- --------------------------------------------------------------------------

DROP TRIGGER IF EXISTS update_pdf_search_text ON public.resource_pages;

CREATE TRIGGER update_pdf_search_text
  BEFORE INSERT OR UPDATE OF search_text, page_type ON public.resource_pages
  FOR EACH ROW
  EXECUTE FUNCTION extract_pdf_search_text();

-- --------------------------------------------------------------------------
-- 4. Ensure full-text search index exists
-- --------------------------------------------------------------------------

-- Check if index exists, create if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'resource_pages' 
    AND indexname = 'idx_resource_pages_search'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_resource_pages_search 
      ON public.resource_pages 
      USING GIN(to_tsvector('english', COALESCE(search_text, '')));
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 5. Add helpful comments
-- --------------------------------------------------------------------------

COMMENT ON COLUMN public.resource_pages.search_text IS 
  'Plain text extracted from PDF content (via pdfjs-dist) or TipTap JSON. Used for full-text search. Normalized and cleaned by trigger.';

COMMENT ON FUNCTION extract_pdf_search_text() IS
  'Normalizes and cleans search_text for PDF pages: removes extra whitespace, control characters, and trims text for better search quality.';

COMMENT ON TRIGGER update_pdf_search_text ON public.resource_pages IS
  'Automatically normalizes search_text before insert/update to ensure consistent and clean full-text search data.';

-- --------------------------------------------------------------------------
-- 6. Update any existing PDFs to have normalized search text
-- --------------------------------------------------------------------------

UPDATE public.resource_pages
SET search_text = trim(regexp_replace(regexp_replace(COALESCE(search_text, ''), '\s+', ' ', 'g'), '[\x00-\x1F\x7F]', '', 'g'))
WHERE page_type = 'pdf' AND search_text IS NOT NULL;


-- ========== Migration: 20260224000001_add_page_specific_flags.sql ==========
-- ============================================================================
-- Add Page-Specific Flagging Support for PDFs
--
-- Extends resource_outdated_flags table to support flagging specific pages within
-- PDF documents. Only runs when resource_outdated_flags exists (table created in
-- 20260212200000_resource_outdated_flags.sql).
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'resource_outdated_flags'
  ) THEN
    RETURN;
  END IF;

  -- 1. Add page-specific flagging columns
  ALTER TABLE public.resource_outdated_flags
    ADD COLUMN IF NOT EXISTS flagged_page_number integer,
    ADD COLUMN IF NOT EXISTS flagged_page_context text;

  -- 2. Add constraint (ignore if already exists)
  BEGIN
    ALTER TABLE public.resource_outdated_flags
      ADD CONSTRAINT resource_flags_page_number_positive
      CHECK (flagged_page_number IS NULL OR flagged_page_number > 0);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  -- 3. Create indexes
  CREATE INDEX IF NOT EXISTS idx_resource_flags_page
    ON public.resource_outdated_flags(resource_id, flagged_page_number)
    WHERE flagged_page_number IS NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_resource_flags_has_page
    ON public.resource_outdated_flags(resource_type, flagged_page_number)
    WHERE flagged_page_number IS NOT NULL;

  -- 4. Comments
  COMMENT ON COLUMN public.resource_outdated_flags.flagged_page_number IS
    'For PDF pages: the specific page number being flagged (1-indexed). NULL means flag applies to entire document. Only used when resource_type=''resource_page'' and page_type=''pdf''.';
  COMMENT ON COLUMN public.resource_outdated_flags.flagged_page_context IS
    'Optional: text snippet or context from the flagged page for reviewer reference. Can include surrounding text to help locate the issue within the page.';
END $$;

-- 5. Helper function (only when table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'resource_outdated_flags'
  ) THEN
    EXECUTE $exec$
      CREATE OR REPLACE FUNCTION get_pdf_page_flags(
        page_id uuid,
        page_num integer DEFAULT NULL
      )
      RETURNS TABLE (
        id uuid,
        note text,
        flagged_page_number integer,
        flagged_page_context text,
        flagged_by_name text,
        created_at timestamptz,
        status text
      ) AS $fn$
      BEGIN
        RETURN QUERY
        SELECT
          f.id,
          f.note,
          f.flagged_page_number,
          f.flagged_page_context,
          f.flagged_by_name,
          f.created_at,
          f.status
        FROM public.resource_outdated_flags f
        WHERE f.resource_id = page_id
          AND f.resource_type = 'resource_page'
          AND f.status = 'pending'
          AND (
            page_num IS NULL
            OR f.flagged_page_number IS NULL
            OR f.flagged_page_number = page_num
          )
        ORDER BY
          CASE WHEN f.flagged_page_number IS NULL THEN 0 ELSE 1 END,
          f.flagged_page_number NULLS FIRST,
          f.created_at DESC;
      END;
      $fn$ LANGUAGE plpgsql STABLE;
    $exec$;
    EXECUTE 'COMMENT ON FUNCTION get_pdf_page_flags(uuid, integer) IS ''Get all pending flags for a PDF page. If page_num is provided, returns flags for that specific page plus document-level flags. If page_num is NULL, returns all flags for the document.''';
  END IF;
END $$;

-- 6. View (will fail if resource_outdated_flags does not exist; then run after table is created)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'resource_outdated_flags'
  ) THEN
    CREATE OR REPLACE VIEW resource_flags_with_page_info AS
    SELECT
      f.*,
      rp.title as resource_title,
      rp.page_type,
      rp.pdf_page_count,
      CASE
        WHEN f.flagged_page_number IS NOT NULL AND rp.pdf_page_count IS NOT NULL
        THEN format('Page %s of %s', f.flagged_page_number, rp.pdf_page_count)
        WHEN f.flagged_page_number IS NOT NULL
        THEN format('Page %s', f.flagged_page_number)
        ELSE 'Entire document'
      END as page_display
    FROM public.resource_outdated_flags f
    LEFT JOIN public.resource_pages rp ON f.resource_id = rp.id AND f.resource_type = 'resource_page'
    WHERE f.resource_type = 'resource_page';

    COMMENT ON VIEW resource_flags_with_page_info IS
      'View combining resource_outdated_flags with resource_pages to show formatted page numbers and document info. Used in flag inbox to display "Page X of Y" format.';
  END IF;
END $$;


-- ========== Migration: 20260224000002_deprecate_policies_system.sql ==========
-- ============================================================================
-- Deprecate Policies System in Favor of PDF Resource Pages
--
-- Marks club_policies and policy_categories tables as deprecated without
-- dropping them. Archives existing data and creates a "Policies" folder
-- in resource_page_folders for the new PDF-based policy system.
--
-- All steps that depend on resource_pages or resource_page_folders run only
-- when those tables exist (e.g. remote may not have resource_page_folders yet).
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Mark tables as deprecated with comments (only if tables exist)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'club_policies') THEN
    EXECUTE 'COMMENT ON TABLE public.club_policies IS ''DEPRECATED (2024-02-24): Replaced by resource_pages with page_type=''''pdf''''. This table is kept for historical reference and rollback capability. All policies archived. DO NOT add new data to this table.''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'policy_categories') THEN
    EXECUTE 'COMMENT ON TABLE public.policy_categories IS ''DEPRECATED (2024-02-24): Replaced by resource_page_folders. This table is kept for historical reference and rollback capability. All categories archived. DO NOT add new data to this table.''';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 2. Add migration tracking columns to club_policies (when resource_pages exists)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resource_pages')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'club_policies') THEN
    ALTER TABLE public.club_policies
      ADD COLUMN IF NOT EXISTS archived_at timestamptz,
      ADD COLUMN IF NOT EXISTS archived_reason text DEFAULT 'Migrated to PDF resource pages system',
      ADD COLUMN IF NOT EXISTS migrated_to_page_id uuid REFERENCES public.resource_pages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 3. Add migration tracking columns to policy_categories
--    (archived_at/archived_reason always; migrated_to_folder_id only when resource_page_folders exists)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'policy_categories') THEN
    ALTER TABLE public.policy_categories
      ADD COLUMN IF NOT EXISTS archived_at timestamptz,
      ADD COLUMN IF NOT EXISTS archived_reason text DEFAULT 'Migrated to resource_page_folders system';
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resource_page_folders') THEN
      ALTER TABLE public.policy_categories
        ADD COLUMN IF NOT EXISTS migrated_to_folder_id uuid REFERENCES public.resource_page_folders(id) ON DELETE SET NULL;
    ELSE
      ALTER TABLE public.policy_categories ADD COLUMN IF NOT EXISTS migrated_to_folder_id uuid;
    END IF;
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 4–5. Archive steps (commented out; see notes in original migration)
-- --------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- 6. Create "Policies" folder in resource_page_folders (only when table exists)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resource_page_folders') THEN
    INSERT INTO public.resource_page_folders (name, description, display_order, created_at, updated_at)
    SELECT
      'Policies',
      'Official club policies and procedures. Upload policy documents as PDFs for easy access and searchability.',
      0,
      now(),
      now()
    WHERE NOT EXISTS (
      SELECT 1 FROM public.resource_page_folders WHERE name = 'Policies'
    );
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 7. Add indexes for migration tracking (only when tables exist)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'club_policies') THEN
    CREATE INDEX IF NOT EXISTS idx_club_policies_archived
      ON public.club_policies(archived_at)
      WHERE archived_at IS NOT NULL;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'club_policies' AND column_name = 'migrated_to_page_id') THEN
      CREATE INDEX IF NOT EXISTS idx_club_policies_migrated
        ON public.club_policies(migrated_to_page_id)
        WHERE migrated_to_page_id IS NOT NULL;
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'policy_categories') THEN
    CREATE INDEX IF NOT EXISTS idx_policy_categories_archived
      ON public.policy_categories(archived_at)
      WHERE archived_at IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_policy_categories_migrated
      ON public.policy_categories(migrated_to_folder_id)
      WHERE migrated_to_folder_id IS NOT NULL;
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 8. Add helpful comments to new columns
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'club_policies') THEN
    EXECUTE 'COMMENT ON COLUMN public.club_policies.archived_at IS ''Timestamp when policy was archived. All policies archived during migration to PDF system on 2024-02-24.''';
    EXECUTE 'COMMENT ON COLUMN public.club_policies.archived_reason IS ''Reason for archiving. Default: "Migrated to PDF resource pages system"''';
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'club_policies' AND column_name = 'migrated_to_page_id') THEN
      EXECUTE 'COMMENT ON COLUMN public.club_policies.migrated_to_page_id IS ''If policy content was migrated to a PDF resource page, this references the new page. NULL means not yet migrated (manual re-upload recommended).''';
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'policy_categories') THEN
    EXECUTE 'COMMENT ON COLUMN public.policy_categories.archived_at IS ''Timestamp when category was archived. All categories archived during migration to folder system on 2024-02-24.''';
    EXECUTE 'COMMENT ON COLUMN public.policy_categories.archived_reason IS ''Reason for archiving. Default: "Migrated to resource_page_folders system"''';
    EXECUTE 'COMMENT ON COLUMN public.policy_categories.migrated_to_folder_id IS ''If category was migrated to a resource_page_folder, this references the new folder. Most categories not directly migrated - use "Policies" folder instead.''';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 9. Create view for archived policies reference (only when club_policies + resource_pages exist)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'club_policies')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resource_pages') THEN
    CREATE OR REPLACE VIEW archived_policies_reference AS
    SELECT
      cp.id,
      cp.content,
      cp.category,
      cp.created_at,
      cp.archived_at,
      cp.migrated_to_page_id,
      rp.title AS migrated_page_title,
      rp.pdf_file_url AS migrated_pdf_url
    FROM public.club_policies cp
    LEFT JOIN public.resource_pages rp ON cp.migrated_to_page_id = rp.id
    WHERE cp.archived_at IS NOT NULL
    ORDER BY cp.category NULLS LAST, cp.created_at DESC;
    COMMENT ON VIEW archived_policies_reference IS
      'Read-only view of archived policies with migration status. Use this to reference old policy content when creating PDF versions. Shows which policies have been migrated to PDF resource pages.';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 10–11. Final table comments (documentation)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'club_policies') THEN
    EXECUTE 'COMMENT ON TABLE public.club_policies IS ''DEPRECATED (2024-02-24): Replaced by resource_pages with page_type=''''pdf''''. Existing data archived but table remains functional during migration. DO NOT add new policies here - use resource_pages instead. After Phase 6 complete, add CHECK constraint to enforce.''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'policy_categories') THEN
    EXECUTE 'COMMENT ON TABLE public.policy_categories IS ''DEPRECATED (2024-02-24): Replaced by resource_page_folders. Existing data archived but table remains functional during migration. DO NOT add new categories here - use resource_page_folders instead. After Phase 6 complete, add CHECK constraint to enforce.''';
  END IF;
END $$;


-- ========== Migration: 20260225120000_daily_report_history_cafe_notes.sql ==========
-- Add optional cafe_notes to daily_report_history for Concierge shift reports.
-- Aggregator will merge AM/PM cafe_notes into daily_reports.cafe_notes.

ALTER TABLE public.daily_report_history
  ADD COLUMN IF NOT EXISTS cafe_notes text;

COMMENT ON COLUMN public.daily_report_history.cafe_notes IS 'Optional café notes from Concierge shift; merged into daily_reports.cafe_notes by aggregator';


-- ========== Migration: 20260226120000_disable_toast_backfill_in_overview.sql ==========
-- Remove Toast Backfill (through 08/01/24) from API Sync Overview and SyncStatusIndicator.
-- Backfill through 08/01/24 is complete; row remains in sync_schedule but is disabled.
--
-- If `supabase db push` fails because earlier migrations already exist on remote, run this
-- in Supabase Dashboard → SQL Editor, then: supabase migration repair 20260226120000 --status applied
UPDATE public.sync_schedule
SET is_enabled = false,
    updated_at = now()
WHERE sync_type = 'toast_backfill';


-- ========== Migration: 20260227000000_push_notifications_tables.sql ==========
-- =============================================
-- Push Notifications Tables
-- =============================================
-- Creates staff_push_subscriptions and notification_history
-- for Web Push subscription storage and delivery history.

-- =============================================
-- 1. CREATE TABLES
-- =============================================

-- Staff Web Push subscriptions (one row per device/browser per staff)
CREATE TABLE IF NOT EXISTS public.staff_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  device_info text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, endpoint)
);

-- Notification delivery history (for dedup and debugging)
CREATE TABLE IF NOT EXISTS public.notification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text,
  type text,
  success boolean DEFAULT true,
  error_message text,
  trigger_source text,
  user_marked_failed boolean DEFAULT false,
  sent_at timestamptz DEFAULT now()
);

-- =============================================
-- 2. INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_staff_push_subscriptions_staff_id
  ON public.staff_push_subscriptions(staff_id);

CREATE INDEX IF NOT EXISTS idx_notification_history_staff_sent
  ON public.notification_history(staff_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_history_trigger_sent
  ON public.notification_history(trigger_source, sent_at);

-- =============================================
-- 3. ENABLE RLS
-- =============================================

ALTER TABLE public.staff_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. RLS POLICIES
-- =============================================

-- staff_push_subscriptions: users manage their own rows only (service_role bypasses RLS)
CREATE POLICY "Users can select own push subscriptions"
  ON public.staff_push_subscriptions FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid());

CREATE POLICY "Users can insert own push subscriptions"
  ON public.staff_push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (staff_id = auth.uid());

CREATE POLICY "Users can update own push subscriptions"
  ON public.staff_push_subscriptions FOR UPDATE
  TO authenticated
  USING (staff_id = auth.uid());

CREATE POLICY "Users can delete own push subscriptions"
  ON public.staff_push_subscriptions FOR DELETE
  TO authenticated
  USING (staff_id = auth.uid());

-- notification_history: management can select all; staff can select own
CREATE POLICY "Management can select all notification history"
  ON public.notification_history FOR SELECT
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "Staff can select own notification history"
  ON public.notification_history FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid());

-- =============================================
-- 5. TRIGGERS
-- =============================================

DROP TRIGGER IF EXISTS set_staff_push_subscriptions_updated_at ON public.staff_push_subscriptions;
CREATE TRIGGER set_staff_push_subscriptions_updated_at
  BEFORE UPDATE ON public.staff_push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 6. REALTIME PUBLICATION
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'staff_push_subscriptions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_push_subscriptions;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notification_history'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_history;
    END IF;
  END IF;
END $$;

-- =============================================
-- 7. GRANT PERMISSIONS
-- =============================================

GRANT ALL ON public.staff_push_subscriptions TO service_role;
GRANT ALL ON public.notification_history TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_push_subscriptions TO authenticated;
GRANT SELECT ON public.notification_history TO authenticated;


-- ========== Migration: 20260227000001_notification_triggers.sql ==========
-- =============================================
-- Notification Triggers and Class Type Mappings
-- =============================================
-- Creates notification_triggers (when to send push notifications)
-- and class_type_mappings (arketa class name -> category for triggers).

-- =============================================
-- 1. CREATE TABLES
-- =============================================

-- Configurable triggers: event type + target dept + message + timing
CREATE TABLE IF NOT EXISTS public.notification_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN (
    'class_end_heated_room', 'class_end_high_roof', 'room_turnover', 'tour_alert'
  )),
  target_department text NOT NULL CHECK (target_department IN (
    'concierge', 'floater', 'cafe', 'all_foh', 'all_boh'
  )),
  message text NOT NULL,
  timing_description text,
  timing_window_minutes integer DEFAULT 5,
  filter_by_working boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Maps arketa class name patterns to categories used by triggers
CREATE TABLE IF NOT EXISTS public.class_type_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name_pattern text NOT NULL,
  class_category text NOT NULL CHECK (class_category IN (
    'heated_room', 'high_roof', 'standard'
  )),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_name_pattern)
);

-- =============================================
-- 2. INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_notification_triggers_event_active
  ON public.notification_triggers(event_type, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_class_type_mappings_category
  ON public.class_type_mappings(class_category);

-- =============================================
-- 3. ENABLE RLS
-- =============================================

ALTER TABLE public.notification_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_type_mappings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. RLS POLICIES
-- =============================================

DO $$
BEGIN
  -- notification_triggers: management full CRUD; others SELECT where is_active = true
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_triggers' AND policyname = 'Management can do all on notification_triggers') THEN
    CREATE POLICY "Management can do all on notification_triggers"
      ON public.notification_triggers FOR ALL
      TO authenticated
      USING (public.is_manager_or_admin(auth.uid()))
      WITH CHECK (public.is_manager_or_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_triggers' AND policyname = 'Others can select active notification_triggers') THEN
    CREATE POLICY "Others can select active notification_triggers"
      ON public.notification_triggers FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;
  -- class_type_mappings: management full CRUD; others SELECT
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'class_type_mappings' AND policyname = 'Management can do all on class_type_mappings') THEN
    CREATE POLICY "Management can do all on class_type_mappings"
      ON public.class_type_mappings FOR ALL
      TO authenticated
      USING (public.is_manager_or_admin(auth.uid()))
      WITH CHECK (public.is_manager_or_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'class_type_mappings' AND policyname = 'Others can select class_type_mappings') THEN
    CREATE POLICY "Others can select class_type_mappings"
      ON public.class_type_mappings FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- =============================================
-- 5. TRIGGERS
-- =============================================

DROP TRIGGER IF EXISTS set_notification_triggers_updated_at ON public.notification_triggers;
CREATE TRIGGER set_notification_triggers_updated_at
  BEFORE UPDATE ON public.notification_triggers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 6. REALTIME PUBLICATION
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notification_triggers'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_triggers;
    END IF;
  END IF;
END $$;

-- =============================================
-- 7. GRANT PERMISSIONS
-- =============================================

GRANT ALL ON public.notification_triggers TO service_role;
GRANT ALL ON public.class_type_mappings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_triggers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_type_mappings TO authenticated;

-- =============================================
-- 8. SEED DEFAULT CLASS TYPE MAPPINGS
-- =============================================

INSERT INTO public.class_type_mappings (class_name_pattern, class_category, notes)
VALUES
  ('Heated%', 'heated_room', 'Heated yoga/pilates classes'),
  ('Infra%', 'heated_room', 'Infrared classes'),
  ('High Roof%', 'high_roof', 'High Roof studio classes')
ON CONFLICT (class_name_pattern) DO NOTHING;


-- ========== Migration: 20260227000002_notification_types_expansion.sql ==========
-- =============================================
-- Notification Types Expansion
-- =============================================
-- Adds push_enabled master toggle to notification_preferences
-- and documents valid notification types for reference.

-- Add master push toggle per user
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS push_enabled boolean DEFAULT false;

-- Document valid notification types (for reference)
-- Types: qa_answered, qa_new_question, announcement, message, bug_report_update,
-- member_alert, class_turnover, mat_cleaning, account_approval_pending,
-- account_approved, account_rejected, resource_outdated, package_arrived,
-- room_turnover, tour_alert
COMMENT ON TABLE public.notification_preferences IS 'User notification preferences. Valid notification types: qa_answered, qa_new_question, announcement, message, bug_report_update, member_alert, class_turnover, mat_cleaning, account_approval_pending, account_approved, account_rejected, resource_outdated, package_arrived, room_turnover, tour_alert';


-- ========== Migration: 20260227120000_check_mat_cleaning_cron.sql ==========
-- =============================================
-- Schedule check-mat-cleaning edge function every 2 minutes
-- (Class end / room turnover / tour alert notifications)
-- =============================================
-- Requires: pg_cron and pg_net, and app.supabase_url / app.supabase_service_role_key
-- to be set (e.g. in Supabase Dashboard > Database > Settings).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cron') THEN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
      PERFORM cron.schedule(
        'check-mat-cleaning',
        '*/2 * * * *',
        $cron$
        SELECT net.http_post(
          url := current_setting('app.supabase_url', true) || '/functions/v1/check-mat-cleaning',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
          ),
          body := '{}'
        );
        $cron$
      );
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If settings or extensions are missing, skip; can be configured in Dashboard
    NULL;
END $$;


-- ########## PHASE 9: Primary role, user walkthrough state (requires Phase 8) ##########
-- ========== Migration: 20260228120000_add_primary_role.sql ==========
-- Add primary_role to profiles (nullable; when null, app uses highest-privilege role)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS primary_role app_role NULL;

-- Extend admin_get_all_users to return primary_role (must DROP first when changing return type)
DROP FUNCTION IF EXISTS public.admin_get_all_users();
CREATE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  onboarding_completed boolean,
  deactivated boolean,
  created_at timestamptz,
  roles app_role[],
  primary_role app_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.email,
    p.full_name,
    p.onboarding_completed,
    p.deactivated,
    p.created_at,
    COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::app_role[]) AS roles,
    p.primary_role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  GROUP BY p.user_id, p.email, p.full_name, p.onboarding_completed, p.deactivated, p.created_at, p.primary_role
  ORDER BY p.created_at DESC
$$;

-- Allow admin or manager to set a user's primary role (must be one of their assigned roles)
CREATE OR REPLACE FUNCTION public.admin_set_primary_role(_target_user_id uuid, _primary_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')) THEN
    RAISE EXCEPTION 'Access denied. Admin or Manager role required.';
  END IF;

  IF _primary_role IS NULL THEN
    UPDATE public.profiles SET primary_role = NULL WHERE user_id = _target_user_id;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _target_user_id AND role = _primary_role
  ) THEN
    RAISE EXCEPTION 'Primary role must be one of the user''s assigned roles.';
  END IF;

  UPDATE public.profiles SET primary_role = _primary_role WHERE user_id = _target_user_id;
END;
$$;

-- When roles are updated, clear primary_role if it is no longer in the new set
CREATE OR REPLACE FUNCTION public.admin_update_user_roles(_target_user_id uuid, _roles app_role[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _target_user_id;

  INSERT INTO public.user_roles (user_id, role)
  SELECT _target_user_id, unnest(_roles);

  UPDATE public.profiles
  SET primary_role = NULL
  WHERE user_id = _target_user_id
    AND primary_role IS NOT NULL
    AND NOT (primary_role = ANY(_roles));
END;
$$;


-- ========== Migration: 20260301120000_user_walkthrough_state.sql ==========
-- ============================================================================
-- Migration: User Walkthrough State
-- Version: 20260301120000
-- Description: Tracks per-user walkthrough completion/skip and page-specific
--              hints viewed, for first-time dashboard experience and replay.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_walkthrough_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  completed_at TIMESTAMPTZ NULL,
  skipped_at TIMESTAMPTZ NULL,
  viewed_page_hints TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_walkthrough_state_user_id
  ON public.user_walkthrough_state(user_id);

COMMENT ON TABLE public.user_walkthrough_state IS 'Tracks whether the user completed or skipped the app walkthrough and which page hints they have viewed.';
COMMENT ON COLUMN public.user_walkthrough_state.viewed_page_hints IS 'Array of page hint identifiers (e.g. route or slug) that the user has already seen.';

-- RLS: users can only read/insert/update their own row
ALTER TABLE public.user_walkthrough_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own walkthrough state"
  ON public.user_walkthrough_state FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own walkthrough state"
  ON public.user_walkthrough_state FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own walkthrough state"
  ON public.user_walkthrough_state FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_user_walkthrough_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_walkthrough_state_updated_at ON public.user_walkthrough_state;
CREATE TRIGGER user_walkthrough_state_updated_at
  BEFORE UPDATE ON public.user_walkthrough_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_walkthrough_state_updated_at();

-- Append a page hint to viewed_page_hints (idempotent: no duplicate hint ids)
CREATE OR REPLACE FUNCTION public.walkthrough_mark_hint_viewed(_hint_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_walkthrough_state
  SET
    viewed_page_hints = array_append(viewed_page_hints, _hint_id),
    updated_at = now()
  WHERE user_id = auth.uid()
    AND NOT (_hint_id = ANY(viewed_page_hints));

  -- If no row existed, insert one with just this hint (or merge on conflict)
  IF NOT FOUND THEN
    INSERT INTO public.user_walkthrough_state (user_id, viewed_page_hints)
    VALUES (auth.uid(), ARRAY[_hint_id])
    ON CONFLICT (user_id) DO UPDATE
    SET
      viewed_page_hints = CASE
        WHEN NOT (_hint_id = ANY(public.user_walkthrough_state.viewed_page_hints))
        THEN array_append(public.user_walkthrough_state.viewed_page_hints, _hint_id)
        ELSE public.user_walkthrough_state.viewed_page_hints
      END,
      updated_at = now();
  END IF;
END;
$$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

