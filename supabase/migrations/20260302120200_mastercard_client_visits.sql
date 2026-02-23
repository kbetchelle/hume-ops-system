-- Mastercard client visits (VIP visitors, managed by admin/manager; concierge can view)
CREATE TABLE IF NOT EXISTS public.mastercard_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_date date NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  client_name text,
  client_email text,
  client_phone text,
  mastercard_tier text,
  number_of_guests int DEFAULT 0,
  assigned_concierge uuid REFERENCES auth.users(id),
  service_preferences text,
  special_requests text,
  visit_purpose text,
  notes text,
  status text DEFAULT 'scheduled',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mastercard_visits_visit_date ON public.mastercard_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_mastercard_visits_status ON public.mastercard_visits(status);
CREATE INDEX IF NOT EXISTS idx_mastercard_visits_start_time ON public.mastercard_visits(start_time);

ALTER TABLE public.mastercard_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can manage mastercard_visits"
  ON public.mastercard_visits FOR ALL
  USING (is_manager_or_admin(auth.uid()))
  WITH CHECK (is_manager_or_admin(auth.uid()));

CREATE POLICY "Concierges can view mastercard_visits"
  ON public.mastercard_visits FOR SELECT
  USING (user_has_role(auth.uid(), 'concierge'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mastercard_visits TO authenticated;
GRANT ALL ON public.mastercard_visits TO service_role;
