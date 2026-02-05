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

    CREATE POLICY "Users can view submissions"
      ON public.checklist_shift_submissions FOR SELECT
      USING (
        auth.uid() IN (
          SELECT user_id FROM user_roles
          WHERE role IN ('concierge', 'floater', 'male_spa_attendant', 'female_spa_attendant', 'cafe', 'manager', 'admin')
        )
      );

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
