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
