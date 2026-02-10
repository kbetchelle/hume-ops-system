-- Daily schedule: disconnect from Sling, rename to daily_schedule, repurpose for Arketa classes + reservations.
-- See plan: daily_schedule Arketa Migration.

-- 1) Rename table (skip if already renamed or source table missing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_schedules') THEN
    ALTER TABLE public.daily_schedules RENAME TO daily_schedule;
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

-- 4) Add new columns
ALTER TABLE public.daily_schedule
  ADD COLUMN class_id text,
  ADD COLUMN start_time timestamptz,
  ADD COLUMN end_time timestamptz,
  ADD COLUMN class_name text,
  ADD COLUMN max_capacity integer,
  ADD COLUMN total_booked integer DEFAULT 0,
  ADD COLUMN instructor text,
  ADD COLUMN description text,
  ADD COLUMN updated_at timestamptz DEFAULT now(),
  ADD COLUMN canceled boolean DEFAULT false;

-- 5) Clear existing rows (Sling data no longer applicable), then add NOT NULL
TRUNCATE public.daily_schedule;

ALTER TABLE public.daily_schedule
  ALTER COLUMN class_id SET NOT NULL,
  ALTER COLUMN start_time SET NOT NULL,
  ALTER COLUMN class_name SET NOT NULL;

-- 6) Add unique constraint
ALTER TABLE public.daily_schedule
  ADD CONSTRAINT daily_schedule_schedule_date_class_id_key UNIQUE (schedule_date, class_id);

-- 7) Drop old RLS policies (names referenced daily_schedules)
DROP POLICY IF EXISTS "Managers can manage daily_schedules" ON public.daily_schedule;
DROP POLICY IF EXISTS "Concierges can view daily_schedules" ON public.daily_schedule;

-- 8) Create new RLS policies
CREATE POLICY "Managers can manage daily_schedule"
  ON public.daily_schedule FOR ALL
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Concierges can view daily_schedule"
  ON public.daily_schedule FOR SELECT
  USING (user_has_role(auth.uid(), 'concierge'));

-- 9) Drop old indexes and create new ones
DROP INDEX IF EXISTS public.idx_daily_schedules_date;
DROP INDEX IF EXISTS public.idx_daily_schedules_user;

CREATE INDEX idx_daily_schedule_date ON public.daily_schedule(schedule_date);
CREATE INDEX idx_daily_schedule_class_id ON public.daily_schedule(class_id);

-- 10) updated_at trigger
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

CREATE TRIGGER trigger_refresh_daily_schedule_on_reservations_insert
  AFTER INSERT ON public.arketa_reservations_history
  REFERENCING NEW TABLE AS new_t
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_daily_schedule_on_reservations_insert();

CREATE TRIGGER trigger_refresh_daily_schedule_on_reservations_update
  AFTER UPDATE ON public.arketa_reservations_history
  REFERENCING OLD TABLE AS old_t NEW TABLE AS new_t
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_daily_schedule_on_reservations_update();

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
