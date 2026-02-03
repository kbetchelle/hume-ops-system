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
CREATE INDEX idx_cafe_checklists_active ON cafe_checklists(is_active, shift_time, is_weekend);
CREATE INDEX idx_cafe_items_checklist ON cafe_checklist_items(checklist_id, sort_order);
CREATE INDEX idx_cafe_completions_date ON cafe_completions(completion_date, shift_time);
CREATE INDEX idx_cafe_completions_user ON cafe_completions(completed_by_id, completion_date);

-- RLS Policies
ALTER TABLE cafe_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_completions ENABLE ROW LEVEL SECURITY;

-- Managers can do everything
CREATE POLICY "Managers full access to cafe checklists"
  ON cafe_checklists FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('manager', 'admin')));

CREATE POLICY "Managers full access to cafe items"
  ON cafe_checklist_items FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('manager', 'admin')));

-- Cafe staff can view checklists and items
CREATE POLICY "Cafe can view checklists"
  ON cafe_checklists FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'cafe'));

CREATE POLICY "Cafe can view items"
  ON cafe_checklist_items FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'cafe'));

-- Cafe staff can manage their own completions
CREATE POLICY "Cafe can view completions"
  ON cafe_completions FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('cafe', 'manager', 'admin')));

CREATE POLICY "Cafe can insert completions"
  ON cafe_completions FOR INSERT
  WITH CHECK (
    auth.uid() = completed_by_id AND
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'cafe')
  );

CREATE POLICY "Cafe can update own completions"
  ON cafe_completions FOR UPDATE
  USING (
    auth.uid() = completed_by_id AND
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'cafe')
  );

-- ============================================================================
-- Migration Complete
-- ============================================================================
