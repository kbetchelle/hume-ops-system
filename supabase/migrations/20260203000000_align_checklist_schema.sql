-- ============================================================================
-- Migration: Align Checklist Schema with Technical Documentation
-- Version: 20260203000000
-- Description: Comprehensive schema update for checklist system
-- ============================================================================

-- ============================================================================
-- 1. UPDATE checklist_templates TABLE
-- ============================================================================

-- Rename checklists to checklist_templates if needed
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'checklists'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'checklist_templates'
  ) THEN
    ALTER TABLE checklists RENAME TO checklist_templates;
  END IF;
END $$;

-- Add new columns
ALTER TABLE checklist_templates ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE checklist_templates ADD COLUMN IF NOT EXISTS position TEXT;

-- Migrate data: map role to department
UPDATE checklist_templates SET department = 
  CASE 
    WHEN role IN ('concierge') THEN 'Concierge'
    WHEN role IN ('floater') THEN 'FOH'
    WHEN role IN ('male_spa_attendant', 'female_spa_attendant') THEN 'BOH'
    ELSE 'FOH'
  END
WHERE department IS NULL;

-- Set position for specific roles
UPDATE checklist_templates SET position = 
  CASE 
    WHEN role = 'male_spa_attendant' THEN 'Male Spa Attendant'
    WHEN role = 'female_spa_attendant' THEN 'Female Spa Attendant'
    WHEN role = 'floater' THEN 'Floater'
    ELSE NULL
  END
WHERE position IS NULL;

-- Rename shift_type to shift_time
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_templates' AND column_name = 'shift_type'
  ) THEN
    ALTER TABLE checklist_templates RENAME COLUMN shift_type TO shift_time;
  END IF;
END $$;

-- Drop old constraint if exists
ALTER TABLE checklist_templates DROP CONSTRAINT IF EXISTS checklist_templates_role_shift_type_key;

-- Add new unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'checklist_templates_dept_shift_pos_key'
  ) THEN
    ALTER TABLE checklist_templates ADD CONSTRAINT checklist_templates_dept_shift_pos_key 
      UNIQUE(department, shift_time, position);
  END IF;
END $$;

-- Mark role column as deprecated (keep for backward compatibility)
ALTER TABLE checklist_templates ALTER COLUMN role DROP NOT NULL;
COMMENT ON COLUMN checklist_templates.role IS 'DEPRECATED: Use department and position instead';

-- ============================================================================
-- 2. UPDATE checklist_completions TABLE
-- ============================================================================

-- Rename checklist_item_id to item_id if needed
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_completions' AND column_name = 'checklist_item_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_completions' AND column_name = 'item_id'
  ) THEN
    ALTER TABLE checklist_completions RENAME COLUMN checklist_item_id TO item_id;
  END IF;
END $$;

-- Add item_id column if it doesn't exist at all
ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS item_id UUID;

-- Rename user_id to completed_by_id if needed for clarity
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_completions' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_completions' AND column_name = 'completed_by_id'
  ) THEN
    ALTER TABLE checklist_completions RENAME COLUMN user_id TO completed_by_id;
  END IF;
END $$;

-- Add template_id column if not exists
ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS template_id UUID;

-- Add completed_by column if not exists
ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS completed_by TEXT;

-- Add shift_time column if not exists
ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS shift_time TEXT DEFAULT 'AM';

-- Add new columns for structured data
ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS note_text TEXT;
ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS signature_data TEXT;
ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Migrate existing data from completion_value (if column exists and contains photo URLs)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklist_completions' AND column_name = 'completion_value'
  ) THEN
    UPDATE checklist_completions 
    SET photo_url = completion_value 
    WHERE completion_value IS NOT NULL 
      AND (completion_value LIKE 'https://%' OR completion_value LIKE 'http://%')
      AND photo_url IS NULL;
  END IF;
END $$;

-- Drop old unique constraints (both possible names)
ALTER TABLE checklist_completions DROP CONSTRAINT IF EXISTS checklist_completions_item_id_completion_date_key;
ALTER TABLE checklist_completions DROP CONSTRAINT IF EXISTS checklist_completions_checklist_item_id_completion_date_key;
ALTER TABLE checklist_completions DROP CONSTRAINT IF EXISTS checklist_completions_user_id_checklist_item_id_completion_dat_key;

-- Add new unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'checklist_completions_item_date_shift_key'
  ) THEN
    ALTER TABLE checklist_completions 
      ADD CONSTRAINT checklist_completions_item_date_shift_key 
      UNIQUE(item_id, completion_date, shift_time);
  END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- FK to checklist_templates (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checklist_templates') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'checklist_completions_template_id_fkey'
    ) THEN
      ALTER TABLE checklist_completions 
        ADD CONSTRAINT checklist_completions_template_id_fkey 
        FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  -- FK to checklist_items (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checklist_items') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'checklist_completions_item_id_fkey'
    ) THEN
      ALTER TABLE checklist_completions 
        ADD CONSTRAINT checklist_completions_item_id_fkey 
        FOREIGN KEY (item_id) REFERENCES checklist_items(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_completions_template ON checklist_completions(template_id);
CREATE INDEX IF NOT EXISTS idx_completions_item ON checklist_completions(item_id);
CREATE INDEX IF NOT EXISTS idx_completions_submitted ON checklist_completions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_completions_shift ON checklist_completions(shift_time);
CREATE INDEX IF NOT EXISTS idx_completions_date ON checklist_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_completions_deleted ON checklist_completions(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- 3. CREATE checklist_comments TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS checklist_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES checklist_templates(id) ON DELETE CASCADE,
  item_id UUID REFERENCES checklist_items(id) ON DELETE CASCADE,
  completion_id UUID REFERENCES checklist_completions(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  staff_id UUID,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  completion_date DATE NOT NULL,
  shift_time TEXT NOT NULL,
  CONSTRAINT checklist_comments_target_check 
    CHECK (template_id IS NOT NULL OR item_id IS NOT NULL OR completion_id IS NOT NULL)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_comments_template ON checklist_comments(template_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_comments_item ON checklist_comments(item_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_comments_completion ON checklist_comments(completion_id);
CREATE INDEX IF NOT EXISTS idx_comments_shift ON checklist_comments(completion_date, shift_time);

-- Enable RLS
ALTER TABLE checklist_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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
  WITH CHECK (auth.uid() = staff_id);

-- ============================================================================
-- 4. CREATE checklist_shift_submissions TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS checklist_shift_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_date DATE NOT NULL,
  shift_time TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT,
  submitted_by TEXT NOT NULL,
  submitted_by_id UUID,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_tasks INTEGER NOT NULL,
  completed_tasks INTEGER NOT NULL,
  notes TEXT,
  UNIQUE(completion_date, shift_time, department, position)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_shift_submissions_date ON checklist_shift_submissions(completion_date);
CREATE INDEX IF NOT EXISTS idx_shift_submissions_dept ON checklist_shift_submissions(department, shift_time);
CREATE INDEX IF NOT EXISTS idx_shift_submissions_submitted ON checklist_shift_submissions(submitted_at);

-- Enable RLS
ALTER TABLE checklist_shift_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view submissions" ON checklist_shift_submissions;
CREATE POLICY "Users can view submissions"
  ON checklist_shift_submissions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create submissions" ON checklist_shift_submissions;
CREATE POLICY "Users can create submissions"
  ON checklist_shift_submissions FOR INSERT
  WITH CHECK (auth.uid() = submitted_by_id);

-- ============================================================================
-- 5. CREATE storage_deletion_queue TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS storage_deletion_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for pending deletions
CREATE INDEX IF NOT EXISTS idx_deletion_queue_pending ON storage_deletion_queue(scheduled_at) 
  WHERE processed_at IS NULL;

-- ============================================================================
-- 6. CREATE TRIGGER FUNCTIONS FOR PHOTO CLEANUP
-- ============================================================================

-- Function to queue photo deletion when completion is deleted
CREATE OR REPLACE FUNCTION queue_photo_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.photo_url IS NOT NULL THEN
    INSERT INTO storage_deletion_queue (bucket_name, file_path)
    VALUES (
      'checklist-photos', 
      regexp_replace(OLD.photo_url, '^.*/checklist-photos/', '')
    );
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger on hard delete
DROP TRIGGER IF EXISTS trigger_queue_photo_on_delete ON checklist_completions;
CREATE TRIGGER trigger_queue_photo_on_delete
  BEFORE DELETE ON checklist_completions
  FOR EACH ROW
  EXECUTE FUNCTION queue_photo_deletion();

-- Function to cleanup old completions (14 day retention)
CREATE OR REPLACE FUNCTION cleanup_old_completions()
RETURNS void AS $$
BEGIN
  -- Queue photos for deletion from records older than 14 days
  INSERT INTO storage_deletion_queue (bucket_name, file_path)
  SELECT 'checklist-photos', regexp_replace(photo_url, '^.*/checklist-photos/', '')
  FROM checklist_completions
  WHERE completion_date < CURRENT_DATE - INTERVAL '14 days'
    AND photo_url IS NOT NULL
    AND deleted_at IS NULL;
  
  -- Soft delete old completions
  UPDATE checklist_completions
  SET deleted_at = now()
  WHERE completion_date < CURRENT_DATE - INTERVAL '14 days'
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. ADD COMMENTS TO DOCUMENT CHANGES
-- ============================================================================

COMMENT ON TABLE checklist_comments IS 'Comments on checklist shifts, items, or specific completions';
COMMENT ON TABLE checklist_shift_submissions IS 'Records of manual and automatic shift submissions';
COMMENT ON TABLE storage_deletion_queue IS 'Queue for scheduled deletion of storage files (14-day retention)';
COMMENT ON COLUMN checklist_templates.department IS 'Department: FOH, BOH, or Concierge';
COMMENT ON COLUMN checklist_templates.position IS 'Specific position within department (e.g., Floater, Male Spa Attendant)';
COMMENT ON COLUMN checklist_completions.shift_time IS 'Shift time: AM or PM';
COMMENT ON COLUMN checklist_completions.photo_url IS 'Public URL to uploaded photo in storage';
COMMENT ON COLUMN checklist_completions.note_text IS 'Text note or comment for completion';
COMMENT ON COLUMN checklist_completions.signature_data IS 'Digital signature data (if applicable)';
COMMENT ON COLUMN checklist_completions.submitted_at IS 'Timestamp when shift was submitted';
COMMENT ON COLUMN checklist_completions.deleted_at IS 'Soft delete timestamp (14-day retention)';

-- ============================================================================
-- Migration Complete
-- ============================================================================
