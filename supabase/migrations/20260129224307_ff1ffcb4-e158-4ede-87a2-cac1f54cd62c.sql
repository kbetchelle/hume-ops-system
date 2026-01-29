-- Create arketa_classes table
CREATE TABLE public.arketa_classes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id text NOT NULL UNIQUE,
  name text NOT NULL,
  start_time timestamptz NOT NULL,
  duration_minutes integer,
  capacity integer,
  booked_count integer DEFAULT 0,
  waitlist_count integer DEFAULT 0,
  status text,
  is_cancelled boolean DEFAULT false,
  room_name text,
  instructor_name text,
  raw_data jsonb,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for arketa_classes
CREATE INDEX idx_arketa_classes_start_time ON public.arketa_classes(start_time);
CREATE INDEX idx_arketa_classes_external_id ON public.arketa_classes(external_id);

-- Enable RLS on arketa_classes
ALTER TABLE public.arketa_classes ENABLE ROW LEVEL SECURITY;

-- RLS policies for arketa_classes
CREATE POLICY "Authenticated users can view arketa_classes"
  ON public.arketa_classes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage arketa_classes"
  ON public.arketa_classes
  FOR ALL
  USING (is_manager_or_admin(auth.uid()));

-- Create arketa_reservations table
CREATE TABLE public.arketa_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id text NOT NULL UNIQUE,
  class_id text NOT NULL,
  client_id text,
  client_name text,
  client_email text,
  status text,
  checked_in boolean DEFAULT false,
  checked_in_at timestamptz,
  raw_data jsonb,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for arketa_reservations
CREATE INDEX idx_arketa_reservations_class_id ON public.arketa_reservations(class_id);
CREATE INDEX idx_arketa_reservations_client_id ON public.arketa_reservations(client_id);
CREATE INDEX idx_arketa_reservations_external_id ON public.arketa_reservations(external_id);

-- Enable RLS on arketa_reservations
ALTER TABLE public.arketa_reservations ENABLE ROW LEVEL SECURITY;

-- RLS policies for arketa_reservations
CREATE POLICY "Authenticated users can view arketa_reservations"
  ON public.arketa_reservations
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage arketa_reservations"
  ON public.arketa_reservations
  FOR ALL
  USING (is_manager_or_admin(auth.uid()));

-- Create arketa_payments table
CREATE TABLE public.arketa_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id text NOT NULL UNIQUE,
  client_id text,
  amount decimal(10,2),
  payment_type text,
  status text,
  payment_date timestamptz,
  notes text,
  raw_data jsonb,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for arketa_payments
CREATE INDEX idx_arketa_payments_client_id ON public.arketa_payments(client_id);
CREATE INDEX idx_arketa_payments_payment_date ON public.arketa_payments(payment_date);
CREATE INDEX idx_arketa_payments_external_id ON public.arketa_payments(external_id);

-- Enable RLS on arketa_payments
ALTER TABLE public.arketa_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for arketa_payments
CREATE POLICY "Authenticated users can view arketa_payments"
  ON public.arketa_payments
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage arketa_payments"
  ON public.arketa_payments
  FOR ALL
  USING (is_manager_or_admin(auth.uid()));

-- Create arketa_instructors table
CREATE TABLE public.arketa_instructors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  email text,
  phone text,
  is_active boolean DEFAULT true,
  raw_data jsonb,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for arketa_instructors
CREATE INDEX idx_arketa_instructors_email ON public.arketa_instructors(email);
CREATE INDEX idx_arketa_instructors_external_id ON public.arketa_instructors(external_id);

-- Enable RLS on arketa_instructors
ALTER TABLE public.arketa_instructors ENABLE ROW LEVEL SECURITY;

-- RLS policies for arketa_instructors
CREATE POLICY "Authenticated users can view arketa_instructors"
  ON public.arketa_instructors
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage arketa_instructors"
  ON public.arketa_instructors
  FOR ALL
  USING (is_manager_or_admin(auth.uid()));

-- Add api_sync_status entries for arketa
INSERT INTO public.api_sync_status (api_name, is_enabled, sync_frequency_minutes)
VALUES 
  ('arketa_classes', true, 15),
  ('arketa_reservations', true, 10),
  ('arketa_payments', true, 30),
  ('arketa_instructors', true, 60)
ON CONFLICT (api_name) DO NOTHING;