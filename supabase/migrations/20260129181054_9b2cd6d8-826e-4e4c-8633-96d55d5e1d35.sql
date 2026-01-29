-- Sling staging (staff scheduling)
CREATE TABLE sling_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sling_user_id int NOT NULL,
  first_name text,
  last_name text,
  email text,
  positions text[],
  is_active boolean DEFAULT true,
  sling_created_at timestamptz,
  sync_batch_id uuid NOT NULL,
  staged_at timestamptz DEFAULT now(),
  UNIQUE(sling_user_id, sync_batch_id)
);

-- Sling shifts staging
CREATE TABLE sling_shifts_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id int NOT NULL,
  sling_user_id int NOT NULL,
  user_name text,
  position_id int,
  position_name text,
  location_id int,
  location_name text,
  shift_date date NOT NULL,
  shift_start timestamptz NOT NULL,
  shift_end timestamptz NOT NULL,
  status text,
  sync_batch_id uuid NOT NULL,
  staged_at timestamptz DEFAULT now(),
  UNIQUE(shift_id, sync_batch_id)
);

-- Toast staging (cafe sales)
CREATE TABLE toast_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_date date NOT NULL,
  net_sales numeric(10,2) DEFAULT 0,
  gross_sales numeric(10,2) DEFAULT 0,
  order_count int DEFAULT 0,
  raw_data jsonb,
  sync_batch_id uuid NOT NULL,
  staged_at timestamptz DEFAULT now(),
  UNIQUE(business_date, sync_batch_id)
);

-- Arketa classes staging
CREATE TABLE arketa_classes_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arketa_class_id text NOT NULL,
  class_name text NOT NULL,
  instructor_name text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  capacity int,
  signups int DEFAULT 0,
  location text,
  sync_batch_id uuid NOT NULL,
  staged_at timestamptz DEFAULT now(),
  UNIQUE(arketa_class_id, sync_batch_id)
);

-- Arketa reservations staging
CREATE TABLE arketa_reservations_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id text NOT NULL,
  arketa_class_id text NOT NULL,
  client_id text,
  client_name text,
  client_email text,
  status text,
  checked_in_at timestamptz,
  sync_batch_id uuid NOT NULL,
  staged_at timestamptz DEFAULT now(),
  UNIQUE(reservation_id, sync_batch_id)
);

-- Arketa clients staging
CREATE TABLE arketa_clients_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arketa_client_id text NOT NULL,
  first_name text,
  last_name text,
  email text,
  phone text,
  membership_type text,
  membership_status text,
  join_date date,
  raw_data jsonb,
  sync_batch_id uuid NOT NULL,
  staged_at timestamptz DEFAULT now(),
  UNIQUE(arketa_client_id, sync_batch_id)
);

-- Calendly staging (tour bookings)
CREATE TABLE calendly_events_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendly_event_id text NOT NULL,
  event_type text,
  event_name text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  invitee_name text,
  invitee_email text,
  invitee_phone text,
  status text,
  location text,
  notes text,
  raw_data jsonb,
  sync_batch_id uuid NOT NULL,
  staged_at timestamptz DEFAULT now(),
  UNIQUE(calendly_event_id, sync_batch_id)
);

-- Enable RLS on all staging tables
ALTER TABLE sling_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE sling_shifts_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE toast_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE arketa_classes_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE arketa_reservations_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE arketa_clients_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendly_events_staging ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staging tables (managers only)
CREATE POLICY "Managers can manage sling_staging"
  ON sling_staging FOR ALL
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Managers can manage sling_shifts_staging"
  ON sling_shifts_staging FOR ALL
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Managers can manage toast_staging"
  ON toast_staging FOR ALL
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Managers can manage arketa_classes_staging"
  ON arketa_classes_staging FOR ALL
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Managers can manage arketa_reservations_staging"
  ON arketa_reservations_staging FOR ALL
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Managers can manage arketa_clients_staging"
  ON arketa_clients_staging FOR ALL
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Managers can manage calendly_events_staging"
  ON calendly_events_staging FOR ALL
  USING (is_manager_or_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_sling_staging_batch ON sling_staging(sync_batch_id);
CREATE INDEX idx_sling_staging_user ON sling_staging(sling_user_id);
CREATE INDEX idx_sling_shifts_staging_batch ON sling_shifts_staging(sync_batch_id);
CREATE INDEX idx_sling_shifts_staging_date ON sling_shifts_staging(shift_date);
CREATE INDEX idx_toast_staging_batch ON toast_staging(sync_batch_id);
CREATE INDEX idx_toast_staging_date ON toast_staging(business_date);
CREATE INDEX idx_arketa_classes_staging_batch ON arketa_classes_staging(sync_batch_id);
CREATE INDEX idx_arketa_classes_staging_time ON arketa_classes_staging(start_time);
CREATE INDEX idx_arketa_reservations_staging_batch ON arketa_reservations_staging(sync_batch_id);
CREATE INDEX idx_arketa_reservations_staging_class ON arketa_reservations_staging(arketa_class_id);
CREATE INDEX idx_arketa_clients_staging_batch ON arketa_clients_staging(sync_batch_id);
CREATE INDEX idx_calendly_events_staging_batch ON calendly_events_staging(sync_batch_id);
CREATE INDEX idx_calendly_events_staging_time ON calendly_events_staging(start_time);