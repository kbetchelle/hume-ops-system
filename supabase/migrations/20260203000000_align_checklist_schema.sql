-- ============================================================================
-- Migration: Align Checklist Schema with Technical Documentation
-- Version: 20260203000000
-- Description: Comprehensive schema update for checklist system
-- ============================================================================

-- ============================================================================
-- 1. UPDATE checklists TABLE (skip if table was already dropped by deprecate migration)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checklists') THEN
    -- Add new columns to checklists table
    ALTER TABLE checklists ADD COLUMN IF NOT EXISTS department TEXT;
    ALTER TABLE checklists ADD COLUMN IF NOT EXISTS position TEXT;

    -- Migrate data: map role to department (use role::text to avoid enum cast before cafe is added)
    UPDATE checklists SET department = 
      CASE 
        WHEN role::text = 'concierge' THEN 'Concierge'
        WHEN role::text IN ('floater', 'male_spa_attendant', 'female_spa_attendant') THEN 'BOH'
        WHEN role::text = 'cafe' THEN 'Cafe'
        ELSE 'FOH'
      END
    WHERE department IS NULL;

    -- Set position for specific roles within BOH (use role::text to avoid enum cast)
    UPDATE checklists SET position = 
      CASE 
        WHEN role::text = 'male_spa_attendant' THEN 'Male Spa Attendant'
        WHEN role::text = 'female_spa_attendant' THEN 'Female Spa Attendant'
        WHEN role::text = 'floater' THEN 'Floater'
        ELSE NULL
      END
    WHERE position IS NULL;

    -- Rename shift_type to shift_time
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'checklists' AND column_name = 'shift_type'
    ) THEN
      ALTER TABLE checklists RENAME COLUMN shift_type TO shift_time;
    END IF;

    -- Drop old constraints if they exist
    ALTER TABLE checklists DROP CONSTRAINT IF EXISTS checklist_templates_role_shift_type_key;
    ALTER TABLE checklists DROP CONSTRAINT IF EXISTS checklists_role_shift_type_key;
    ALTER TABLE checklists DROP CONSTRAINT IF EXISTS checklists_dept_shift_pos_key;

    -- Remove duplicate checklists before adding unique constraint
    DELETE FROM checklists a
    USING checklists b
    WHERE a.id > b.id
      AND COALESCE(a.department, '') = COALESCE(b.department, '')
      AND COALESCE(a.shift_time, '') = COALESCE(b.shift_time, '')
      AND COALESCE(a.position, '') = COALESCE(b.position, '')
      AND COALESCE(a.is_weekend, false) = COALESCE(b.is_weekend, false);

    -- Add new unique constraint (includes is_weekend to distinguish weekday/weekend checklists)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'checklists_dept_shift_pos_weekend_key'
    ) THEN
      ALTER TABLE checklists ADD CONSTRAINT checklists_dept_shift_pos_weekend_key 
        UNIQUE(department, shift_time, position, is_weekend);
    END IF;

    -- Mark role column as deprecated (keep for backward compatibility)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'checklists' AND column_name = 'role'
    ) THEN
      ALTER TABLE checklists ALTER COLUMN role DROP NOT NULL;
    END IF;

    COMMENT ON COLUMN checklists.role IS 'DEPRECATED: Use department and position instead';
  ELSE
    RAISE NOTICE 'Skipping checklists updates - table does not exist (may have been dropped by deprecate_old_checklist_tables)';
  END IF;
END $$;

-- ============================================================================
-- 1.5 UPDATE checklist_items TABLE (skip if tables were dropped)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checklist_items') THEN
    -- Ensure checklist_items has correct foreign key column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'checklist_items' AND column_name = 'template_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'checklist_items' AND column_name = 'checklist_id'
    ) THEN
      ALTER TABLE checklist_items RENAME COLUMN template_id TO checklist_id;
    END IF;

    ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS checklist_id UUID;

    -- Add FK only if checklists exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checklists') THEN
      ALTER TABLE checklist_items DROP CONSTRAINT IF EXISTS checklist_items_template_id_fkey;
      ALTER TABLE checklist_items DROP CONSTRAINT IF EXISTS checklist_items_checklist_id_fkey;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'checklist_items_checklist_id_fkey'
      ) THEN
        ALTER TABLE checklist_items 
          ADD CONSTRAINT checklist_items_checklist_id_fkey 
          FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 2. UPDATE checklist_completions TABLE (skip if table was dropped)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='checklist_completions') THEN
    RAISE NOTICE 'Skipping checklist_completions - table does not exist';
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name = 'checklist_completions' AND column_name = 'checklist_item_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name = 'checklist_completions' AND column_name = 'item_id'
  ) THEN
    ALTER TABLE checklist_completions RENAME COLUMN checklist_item_id TO item_id;
  END IF;
END $$;

-- Add item_id column if it doesn't exist at all (guarded - only runs if table exists from prior DO)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='checklist_completions') THEN
    ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS item_id UUID;
  END IF; END $$;

-- Rename user_id to completed_by_id (and subsequent alters - guarded)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='checklist_completions') THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name = 'checklist_completions' AND column_name = 'user_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name = 'checklist_completions' AND column_name = 'completed_by_id') THEN
    ALTER TABLE checklist_completions RENAME COLUMN user_id TO completed_by_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name = 'checklist_completions' AND column_name = 'template_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name = 'checklist_completions' AND column_name = 'checklist_id') THEN
    ALTER TABLE checklist_completions RENAME COLUMN template_id TO checklist_id;
  END IF;
  ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS checklist_id UUID;
  ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS completed_by TEXT;
  ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS shift_time TEXT DEFAULT 'AM';
  ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS photo_url TEXT;
  ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS note_text TEXT;
  ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS signature_data TEXT;
  ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
  ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
END $$;

-- Migrate data, constraints, FKs, indexes (guarded)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='checklist_completions') THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name = 'checklist_completions' AND column_name = 'completion_value') THEN
    UPDATE checklist_completions SET photo_url = completion_value 
    WHERE completion_value IS NOT NULL AND (completion_value LIKE 'https://%' OR completion_value LIKE 'http://%') AND photo_url IS NULL;
  END IF;
  ALTER TABLE checklist_completions DROP CONSTRAINT IF EXISTS checklist_completions_item_id_completion_date_key;
  ALTER TABLE checklist_completions DROP CONSTRAINT IF EXISTS checklist_completions_checklist_item_id_completion_date_key;
  ALTER TABLE checklist_completions DROP CONSTRAINT IF EXISTS checklist_completions_user_id_checklist_item_id_completion_dat_key;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'checklist_completions_item_date_shift_key') THEN
    ALTER TABLE checklist_completions ADD CONSTRAINT checklist_completions_item_date_shift_key UNIQUE(item_id, completion_date, shift_time);
  END IF;
  ALTER TABLE checklist_completions DROP CONSTRAINT IF EXISTS checklist_completions_template_id_fkey;
  ALTER TABLE checklist_completions DROP CONSTRAINT IF EXISTS checklist_completions_checklist_id_fkey;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name = 'checklists') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'checklist_completions_checklist_id_fkey') THEN
    ALTER TABLE checklist_completions ADD CONSTRAINT checklist_completions_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name = 'checklist_items') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'checklist_completions_item_id_fkey') THEN
    ALTER TABLE checklist_completions ADD CONSTRAINT checklist_completions_item_id_fkey FOREIGN KEY (item_id) REFERENCES checklist_items(id) ON DELETE CASCADE;
  END IF;
  CREATE INDEX IF NOT EXISTS idx_completions_checklist ON checklist_completions(checklist_id);
  CREATE INDEX IF NOT EXISTS idx_completions_item ON checklist_completions(item_id);
  CREATE INDEX IF NOT EXISTS idx_completions_submitted ON checklist_completions(submitted_at);
  CREATE INDEX IF NOT EXISTS idx_completions_shift ON checklist_completions(shift_time);
  CREATE INDEX IF NOT EXISTS idx_completions_date ON checklist_completions(completion_date);
  CREATE INDEX IF NOT EXISTS idx_completions_deleted ON checklist_completions(deleted_at) WHERE deleted_at IS NULL;
END $$;

-- ============================================================================
-- 3. CREATE checklist_comments TABLE (skip if checklists was dropped)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='checklists') THEN
    CREATE TABLE IF NOT EXISTS checklist_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      checklist_id UUID REFERENCES checklists(id) ON DELETE CASCADE,
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
        CHECK (checklist_id IS NOT NULL OR item_id IS NOT NULL OR completion_id IS NOT NULL)
    );
    CREATE INDEX IF NOT EXISTS idx_comments_checklist ON checklist_comments(checklist_id, completion_date);
    CREATE INDEX IF NOT EXISTS idx_comments_item ON checklist_comments(item_id, completion_date);
    CREATE INDEX IF NOT EXISTS idx_comments_completion ON checklist_comments(completion_id);
    CREATE INDEX IF NOT EXISTS idx_comments_shift ON checklist_comments(completion_date, shift_time);
    ALTER TABLE checklist_comments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view non-private comments" ON checklist_comments;
    CREATE POLICY "Users can view non-private comments" ON checklist_comments FOR SELECT
      USING (NOT is_private OR auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ('manager', 'admin')));
    DROP POLICY IF EXISTS "Users can create comments" ON checklist_comments;
    CREATE POLICY "Users can create comments" ON checklist_comments FOR INSERT WITH CHECK (auth.uid() = staff_id);
  ELSE
    RAISE NOTICE 'Skipping checklist_comments - checklists table does not exist';
  END IF;
END $$;

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

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='checklist_comments') THEN
    COMMENT ON TABLE checklist_comments IS 'Comments on checklist shifts, items, or specific completions';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='checklists') THEN
    COMMENT ON COLUMN checklists.department IS 'Department: FOH, BOH, or Concierge';
    COMMENT ON COLUMN checklists.position IS 'Specific position within department (e.g., Floater, Male Spa Attendant)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='checklist_completions') THEN
    COMMENT ON COLUMN checklist_completions.shift_time IS 'Shift time: AM or PM';
    COMMENT ON COLUMN checklist_completions.photo_url IS 'Public URL to uploaded photo in storage';
    COMMENT ON COLUMN checklist_completions.note_text IS 'Text note or comment for completion';
    COMMENT ON COLUMN checklist_completions.signature_data IS 'Digital signature data (if applicable)';
    COMMENT ON COLUMN checklist_completions.submitted_at IS 'Timestamp when shift was submitted';
    COMMENT ON COLUMN checklist_completions.deleted_at IS 'Soft delete timestamp (14-day retention)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='checklist_shift_submissions') THEN
    COMMENT ON TABLE checklist_shift_submissions IS 'Records of manual and automatic shift submissions';
  END IF;
END $$;
COMMENT ON TABLE storage_deletion_queue IS 'Queue for scheduled deletion of storage files (14-day retention)';

-- ============================================================================
-- Migration Complete
-- ============================================================================
