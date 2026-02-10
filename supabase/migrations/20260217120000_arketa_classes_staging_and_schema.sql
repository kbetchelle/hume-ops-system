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

CREATE TABLE public.arketa_classes_staging (
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

CREATE INDEX idx_arketa_classes_staging_sync_batch_id ON public.arketa_classes_staging(sync_batch_id);
CREATE INDEX idx_arketa_classes_staging_class_date ON public.arketa_classes_staging(class_date);

ALTER TABLE public.arketa_classes_staging ENABLE ROW LEVEL SECURITY;

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
