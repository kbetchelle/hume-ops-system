-- ============================================================================
-- Migration: Create Back of House (BoH) Checklist Tables
-- Version: 20260204000001
-- Description: Creates role-specific tables for BoH checklists (floater, male_spa_attendant, female_spa_attendant)
-- ============================================================================

-- BoH Checklists Table
CREATE TABLE IF NOT EXISTS boh_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  role_type TEXT NOT NULL CHECK (role_type IN ('floater', 'male_spa_attendant', 'female_spa_attendant')),
  shift_time TEXT NOT NULL CHECK (shift_time IN ('AM', 'PM')),
  is_weekend BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(title, shift_time, is_weekend, role_type)
);

-- BoH Checklist Items Table
CREATE TABLE IF NOT EXISTS boh_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID REFERENCES boh_checklists(id) ON DELETE CASCADE,
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

-- BoH Completions Table
CREATE TABLE IF NOT EXISTS boh_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES boh_checklist_items(id) ON DELETE CASCADE,
  checklist_id UUID REFERENCES boh_checklists(id) ON DELETE CASCADE,
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
CREATE INDEX idx_boh_checklists_active ON boh_checklists(is_active, shift_time, is_weekend, role_type);
CREATE INDEX idx_boh_items_checklist ON boh_checklist_items(checklist_id, sort_order);
CREATE INDEX idx_boh_completions_date ON boh_completions(completion_date, shift_time);
CREATE INDEX idx_boh_completions_user ON boh_completions(completed_by_id, completion_date);

-- RLS Policies
ALTER TABLE boh_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE boh_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE boh_completions ENABLE ROW LEVEL SECURITY;

-- Managers can do everything
CREATE POLICY "Managers full access to boh checklists"
  ON boh_checklists FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('manager', 'admin')));

CREATE POLICY "Managers full access to boh items"
  ON boh_checklist_items FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('manager', 'admin')));

-- BoH staff can view checklists and items
CREATE POLICY "BoH staff can view checklists"
  ON boh_checklists FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('floater', 'male_spa_attendant', 'female_spa_attendant')));

CREATE POLICY "BoH staff can view items"
  ON boh_checklist_items FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('floater', 'male_spa_attendant', 'female_spa_attendant')));

-- BoH staff can manage their own completions
CREATE POLICY "BoH staff can view completions"
  ON boh_completions FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('floater', 'male_spa_attendant', 'female_spa_attendant', 'manager', 'admin')));

CREATE POLICY "BoH staff can insert completions"
  ON boh_completions FOR INSERT
  WITH CHECK (
    auth.uid() = completed_by_id AND
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('floater', 'male_spa_attendant', 'female_spa_attendant'))
  );

CREATE POLICY "BoH staff can update own completions"
  ON boh_completions FOR UPDATE
  USING (
    auth.uid() = completed_by_id AND
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('floater', 'male_spa_attendant', 'female_spa_attendant'))
  );

-- ============================================================================
-- Migration Complete
-- ============================================================================
