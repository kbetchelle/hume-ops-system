
CREATE TABLE IF NOT EXISTS public.daily_schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id text,
  schedule_date date NOT NULL,
  start_time timestamptz,
  end_time timestamptz,
  class_name text,
  max_capacity integer,
  total_booked integer DEFAULT 0,
  instructor text,
  description text,
  canceled boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_schedule_date ON public.daily_schedule(schedule_date);

ALTER TABLE public.daily_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON public.daily_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service role full access" ON public.daily_schedule FOR ALL TO service_role USING (true);

NOTIFY pgrst, 'reload schema';
