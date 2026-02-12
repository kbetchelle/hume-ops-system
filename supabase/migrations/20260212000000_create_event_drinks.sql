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
CREATE POLICY "Cafe staff can view event drinks"
  ON public.event_drinks FOR SELECT
  TO authenticated
  USING (
    public.user_has_any_role(auth.uid(), ARRAY['cafe'::app_role, 'manager'::app_role, 'admin'::app_role])
  );

CREATE POLICY "Cafe staff can create event drinks"
  ON public.event_drinks FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_any_role(auth.uid(), ARRAY['cafe'::app_role, 'manager'::app_role, 'admin'::app_role])
  );

CREATE POLICY "Cafe staff can update event drinks"
  ON public.event_drinks FOR UPDATE
  TO authenticated
  USING (
    public.user_has_any_role(auth.uid(), ARRAY['cafe'::app_role, 'manager'::app_role, 'admin'::app_role])
  );

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
CREATE TRIGGER update_event_drinks_updated_at
  BEFORE UPDATE ON public.event_drinks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create private storage bucket for email thread files
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-drinks-files', 'event-drinks-files', false)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage RLS policies
CREATE POLICY "Cafe staff can upload event drink files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-drinks-files'
    AND public.user_has_any_role(auth.uid(), ARRAY['cafe'::app_role, 'manager'::app_role, 'admin'::app_role])
  );

CREATE POLICY "Cafe staff can view event drink files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'event-drinks-files'
    AND public.user_has_any_role(auth.uid(), ARRAY['cafe'::app_role, 'manager'::app_role, 'admin'::app_role])
  );

CREATE POLICY "Cafe staff can update event drink files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'event-drinks-files'
    AND public.user_has_any_role(auth.uid(), ARRAY['cafe'::app_role, 'manager'::app_role, 'admin'::app_role])
  );

CREATE POLICY "Managers can delete event drink files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-drinks-files'
    AND public.is_manager_or_admin(auth.uid())
  );
