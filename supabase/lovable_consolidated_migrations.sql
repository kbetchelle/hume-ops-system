
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

-- 1. Create enum for object category (idempotent: skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'lost_and_found_category') THEN
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
  END IF;
END $$;

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

-- Backfill class_id from arketa_class_id where class_id is null (only if arketa_class_id column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'arketa_reservations_staging' AND column_name = 'arketa_class_id'
  ) THEN
    UPDATE public.arketa_reservations_staging SET class_id = arketa_class_id WHERE class_id IS NULL AND arketa_class_id IS NOT NULL;
  END IF;
END $$;

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
  ON public.arketa_reservations_history FOR ALL USING (public.is_manager_or_admin(auth.uid()));

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

-- Backfill payment_id/source_endpoint from existing arketa_payment_id where missing (only if arketa_payment_id column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'arketa_payments_staging' AND column_name = 'arketa_payment_id'
  ) THEN
    UPDATE public.arketa_payments_staging SET payment_id = arketa_payment_id WHERE payment_id IS NULL AND arketa_payment_id IS NOT NULL;
  END IF;
END $$;
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
  ON public.arketa_payments_history FOR ALL USING (public.is_manager_or_admin(auth.uid()));

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

-- Add to realtime only if not already in publication (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'historical_backfill_progress'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.historical_backfill_progress;
    END IF;
  END IF;
END $$;

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

-- 1) Do not truncate: preserve existing Lovable data. Schema changes below are additive/drop-only and idempotent.
-- (Removed: TRUNCATE of arketa_reservations, arketa_reservations_history, arketa_reservations_staging)

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

-- Unique constraint for upserts (replaces external_id); idempotent
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'arketa_reservations_reservation_class_unique') THEN
    ALTER TABLE public.arketa_reservations
      ADD CONSTRAINT arketa_reservations_reservation_class_unique UNIQUE (reservation_id, class_id);
  END IF;
END $$;

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
DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.staff_message_groups;
CREATE POLICY "Users can view groups they belong to"
  ON public.staff_message_groups FOR SELECT
  USING (auth.uid() = ANY(member_ids) OR created_by = auth.uid());

DROP POLICY IF EXISTS "Users can create groups" ON public.staff_message_groups;
CREATE POLICY "Users can create groups"
  ON public.staff_message_groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update groups they created" ON public.staff_message_groups;
CREATE POLICY "Users can update groups they created"
  ON public.staff_message_groups FOR UPDATE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete groups they created" ON public.staff_message_groups;
CREATE POLICY "Users can delete groups they created"
  ON public.staff_message_groups FOR DELETE
  USING (created_by = auth.uid());

-- Policies for staff_message_drafts
DROP POLICY IF EXISTS "Users can manage their own drafts" ON public.staff_message_drafts;
CREATE POLICY "Users can manage their own drafts"
  ON public.staff_message_drafts FOR ALL
  USING (staff_id = auth.uid());

-- =============================================
-- 5. TRIGGERS
-- =============================================

-- Trigger to update updated_at on staff_message_groups
CREATE OR REPLACE FUNCTION public.update_staff_message_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_staff_message_groups_updated_at ON public.staff_message_groups;
CREATE TRIGGER trigger_update_staff_message_groups_updated_at
  BEFORE UPDATE ON public.staff_message_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_staff_message_groups_updated_at();

-- Trigger to update updated_at on staff_message_drafts
CREATE OR REPLACE FUNCTION public.update_staff_message_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_staff_message_drafts_updated_at ON public.staff_message_drafts;
CREATE TRIGGER trigger_update_staff_message_drafts_updated_at
  BEFORE UPDATE ON public.staff_message_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_staff_message_drafts_updated_at();

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

-- Add tables to realtime publication (idempotent: only if supabase_realtime exists and table not already in publication)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'staff_messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_messages;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'staff_message_reads'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_message_reads;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'staff_message_reactions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_message_reactions;
    END IF;
  END IF;
END $$;

-- =============================================
-- 8. GRANT PERMISSIONS
-- =============================================

-- Service role has full access
GRANT ALL ON staff_message_reactions TO service_role;
GRANT ALL ON public.staff_message_groups TO service_role;
GRANT ALL ON public.staff_message_drafts TO service_role;

-- Authenticated users have conditional access via RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_message_reactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_message_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_message_drafts TO authenticated;


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
  USING (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Managers can update approval requests" ON public.account_approval_requests;
CREATE POLICY "Managers can update approval requests"
  ON public.account_approval_requests FOR UPDATE
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

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
  IF NOT public.is_manager_or_admin(auth.uid()) THEN
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
  IF NOT public.is_manager_or_admin(auth.uid()) THEN
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
  IF NOT public.is_manager_or_admin(auth.uid()) THEN
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
EXECUTE FUNCTION public.update_updated_at_column();

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
  -- Only seed when table is empty (idempotent re-run)
  IF (SELECT COUNT(*) FROM public.quick_link_groups) > 0 THEN
    RETURN;
  END IF;

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

-- 2. Add foreign key constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_drinks_created_by_fkey') THEN
    ALTER TABLE public.event_drinks
      ADD CONSTRAINT event_drinks_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;
END $$;

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
      USING (public.is_manager_or_admin(auth.uid()));
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

-- 2) Drop existing unique constraint on external_id and add unique (external_id, class_date); idempotent
ALTER TABLE public.arketa_classes DROP CONSTRAINT IF EXISTS arketa_classes_external_id_key;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'arketa_classes_external_id_class_date_key') THEN
    ALTER TABLE public.arketa_classes
      ADD CONSTRAINT arketa_classes_external_id_class_date_key UNIQUE (external_id, class_date);
  END IF;
END $$;

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
  USING (public.is_manager_or_admin(auth.uid()));

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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'staff_announcement_type') THEN
    CREATE TYPE public.staff_announcement_type AS ENUM ('announcement', 'weekly_update');
  END IF;
END $$;

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
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at trigger for user_preferences
CREATE OR REPLACE FUNCTION public.update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_preferences_updated_at();

-- 3. Enable Supabase Realtime on bug_reports for live updates (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bug_reports'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.bug_reports;
    END IF;
  END IF;
END $$;

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

-- 7. Enable Realtime on staff_notifications (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'staff_notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_notifications;
    END IF;
  END IF;
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
DROP POLICY IF EXISTS "authenticated_users_read_all_quick_link_groups" ON public.quick_link_groups;
CREATE POLICY "authenticated_users_read_all_quick_link_groups"
  ON public.quick_link_groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Quick link items: allow all authenticated users to read
DROP POLICY IF EXISTS "authenticated_users_read_all_quick_link_items" ON public.quick_link_items;
CREATE POLICY "authenticated_users_read_all_quick_link_items"
  ON public.quick_link_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Resource pages: allow all authenticated users to read published pages
DROP POLICY IF EXISTS "authenticated_users_read_published_resource_pages" ON public.resource_pages;
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
-- 3. Add FK from resource_pages.folder_id -> resource_page_folders (idempotent)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_resource_pages_folder') THEN
    ALTER TABLE public.resource_pages
      ADD CONSTRAINT fk_resource_pages_folder
      FOREIGN KEY (folder_id) REFERENCES public.resource_page_folders(id) ON DELETE SET NULL;
  END IF;
END $$;

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
DROP POLICY IF EXISTS "Authenticated users can upload package photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload package photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'package-photos');

DROP POLICY IF EXISTS "Anyone can view package photos" ON storage.objects;
CREATE POLICY "Anyone can view package photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'package-photos');

DROP POLICY IF EXISTS "Authenticated users can update their uploaded photos" ON storage.objects;
CREATE POLICY "Authenticated users can update their uploaded photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'package-photos')
  WITH CHECK (bucket_id = 'package-photos');

DROP POLICY IF EXISTS "Admins can delete package photos" ON storage.objects;
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
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to clean up archived packages after 30 days
CREATE OR REPLACE FUNCTION public.cleanup_archived_packages()
RETURNS void AS $$
BEGIN
  -- Hard delete packages archived 30+ days ago
  DELETE FROM public.packages 
  WHERE status = 'archived' 
    AND archived_at < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Queue package photos for deletion when packages are deleted
CREATE OR REPLACE FUNCTION public.queue_package_photo_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue main location photo
  IF OLD.location_photo_url IS NOT NULL THEN
    INSERT INTO public.storage_deletion_queue (bucket_name, file_path)
    VALUES ('package-photos', regexp_replace(OLD.location_photo_url, '^.*/package-photos/', ''));
  END IF;
  
  -- Queue history photos
  INSERT INTO public.storage_deletion_queue (bucket_name, file_path)
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
  EXECUTE FUNCTION public.queue_package_photo_deletion();

-- RLS Policies for packages table
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view all packages" ON public.packages;
CREATE POLICY "Authenticated users can view all packages"
  ON public.packages FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert packages" ON public.packages;
CREATE POLICY "Authenticated users can insert packages"
  ON public.packages FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update packages" ON public.packages;
CREATE POLICY "Authenticated users can update packages"
  ON public.packages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can delete packages" ON public.packages;
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

DROP POLICY IF EXISTS "Authenticated users can view package history" ON public.package_location_history;
CREATE POLICY "Authenticated users can view package history"
  ON public.package_location_history FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert package history" ON public.package_location_history;
CREATE POLICY "Authenticated users can insert package history"
  ON public.package_location_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can delete package history" ON public.package_location_history;
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

CREATE OR REPLACE FUNCTION public.extract_pdf_search_text()
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
  EXECUTE FUNCTION public.extract_pdf_search_text();

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

COMMENT ON FUNCTION public.extract_pdf_search_text() IS
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
DROP POLICY IF EXISTS "Users can select own push subscriptions" ON public.staff_push_subscriptions;
CREATE POLICY "Users can select own push subscriptions"
  ON public.staff_push_subscriptions FOR SELECT
  TO authenticated
  USING (staff_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.staff_push_subscriptions;
CREATE POLICY "Users can insert own push subscriptions"
  ON public.staff_push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (staff_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own push subscriptions" ON public.staff_push_subscriptions;
CREATE POLICY "Users can update own push subscriptions"
  ON public.staff_push_subscriptions FOR UPDATE
  TO authenticated
  USING (staff_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.staff_push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions"
  ON public.staff_push_subscriptions FOR DELETE
  TO authenticated
  USING (staff_id = auth.uid());

-- notification_history: management can select all; staff can select own
DROP POLICY IF EXISTS "Management can select all notification history" ON public.notification_history;
CREATE POLICY "Management can select all notification history"
  ON public.notification_history FOR SELECT
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Staff can select own notification history" ON public.notification_history;
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

DROP POLICY IF EXISTS "Users can view own walkthrough state" ON public.user_walkthrough_state;
CREATE POLICY "Users can view own walkthrough state"
  ON public.user_walkthrough_state FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own walkthrough state" ON public.user_walkthrough_state;
CREATE POLICY "Users can insert own walkthrough state"
  ON public.user_walkthrough_state FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own walkthrough state" ON public.user_walkthrough_state;
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

