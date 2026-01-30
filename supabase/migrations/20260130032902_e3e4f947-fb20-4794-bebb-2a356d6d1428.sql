-- Arketa Clients Staging (already exists, but ensure schema matches)
CREATE TABLE IF NOT EXISTS arketa_clients_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_batch_id uuid NOT NULL,
  cursor_position text,
  staged_at timestamptz DEFAULT now(),
  arketa_client_id text NOT NULL,
  client_name text,
  client_email text,
  client_phone text,
  client_tags text[] DEFAULT '{}',
  custom_fields jsonb DEFAULT '{}',
  referrer text,
  email_mkt_opt_in boolean DEFAULT false,
  sms_mkt_opt_in boolean DEFAULT false,
  date_of_birth date,
  lifecycle_stage text,
  raw_data jsonb
);

-- Add cursor_position column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'arketa_clients_staging' AND column_name = 'cursor_position'
  ) THEN
    ALTER TABLE arketa_clients_staging ADD COLUMN cursor_position text;
  END IF;
END $$;

-- Arketa Classes Staging (already exists, but add missing columns)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'arketa_classes_staging' AND column_name = 'cursor_position'
  ) THEN
    ALTER TABLE arketa_classes_staging ADD COLUMN cursor_position text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'arketa_classes_staging' AND column_name = 'description'
  ) THEN
    ALTER TABLE arketa_classes_staging ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'arketa_classes_staging' AND column_name = 'instructor_id'
  ) THEN
    ALTER TABLE arketa_classes_staging ADD COLUMN instructor_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'arketa_classes_staging' AND column_name = 'enrolled'
  ) THEN
    ALTER TABLE arketa_classes_staging ADD COLUMN enrolled integer;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'arketa_classes_staging' AND column_name = 'status'
  ) THEN
    ALTER TABLE arketa_classes_staging ADD COLUMN status text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'arketa_classes_staging' AND column_name = 'raw_data'
  ) THEN
    ALTER TABLE arketa_classes_staging ADD COLUMN raw_data jsonb;
  END IF;
END $$;

-- Arketa Reservations Staging (already exists, but add missing columns)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'arketa_reservations_staging' AND column_name = 'cursor_position'
  ) THEN
    ALTER TABLE arketa_reservations_staging ADD COLUMN cursor_position text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'arketa_reservations_staging' AND column_name = 'arketa_reservation_id'
  ) THEN
    ALTER TABLE arketa_reservations_staging ADD COLUMN arketa_reservation_id text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'arketa_reservations_staging' AND column_name = 'checked_in'
  ) THEN
    ALTER TABLE arketa_reservations_staging ADD COLUMN checked_in boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'arketa_reservations_staging' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE arketa_reservations_staging ADD COLUMN created_at timestamptz;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'arketa_reservations_staging' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE arketa_reservations_staging ADD COLUMN cancelled_at timestamptz;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'arketa_reservations_staging' AND column_name = 'raw_data'
  ) THEN
    ALTER TABLE arketa_reservations_staging ADD COLUMN raw_data jsonb;
  END IF;
END $$;

-- Arketa Payments Staging (create new table)
CREATE TABLE IF NOT EXISTS arketa_payments_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_batch_id uuid NOT NULL,
  cursor_position text,
  staged_at timestamptz DEFAULT now(),
  arketa_payment_id text NOT NULL,
  client_id text,
  amount numeric,
  currency text DEFAULT 'USD',
  status text,
  payment_type text,
  description text,
  created_at timestamptz,
  raw_data jsonb
);

-- Arketa Instructors Staging (create new table)
CREATE TABLE IF NOT EXISTS arketa_instructors_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_batch_id uuid NOT NULL,
  cursor_position text,
  staged_at timestamptz DEFAULT now(),
  arketa_instructor_id text NOT NULL,
  first_name text,
  last_name text,
  email text,
  role text,
  active boolean DEFAULT true,
  raw_data jsonb
);

-- Sling Shifts Staging (already exists, but add missing columns)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sling_shifts_staging' AND column_name = 'cursor_position'
  ) THEN
    ALTER TABLE sling_shifts_staging ADD COLUMN cursor_position text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sling_shifts_staging' AND column_name = 'employee_name'
  ) THEN
    ALTER TABLE sling_shifts_staging ADD COLUMN employee_name text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sling_shifts_staging' AND column_name = 'location'
  ) THEN
    ALTER TABLE sling_shifts_staging ADD COLUMN location text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sling_shifts_staging' AND column_name = 'raw_data'
  ) THEN
    ALTER TABLE sling_shifts_staging ADD COLUMN raw_data jsonb;
  END IF;
END $$;

-- Add indexes for efficient batch operations
CREATE INDEX IF NOT EXISTS idx_clients_staging_batch ON arketa_clients_staging(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_classes_staging_batch ON arketa_classes_staging(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_reservations_staging_batch ON arketa_reservations_staging(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_payments_staging_batch ON arketa_payments_staging(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_instructors_staging_batch ON arketa_instructors_staging(sync_batch_id);
CREATE INDEX IF NOT EXISTS idx_shifts_staging_batch ON sling_shifts_staging(sync_batch_id);

-- Enable RLS on new staging tables
ALTER TABLE arketa_payments_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE arketa_instructors_staging ENABLE ROW LEVEL SECURITY;

-- RLS policies for new staging tables
CREATE POLICY "Managers can manage arketa_payments_staging"
  ON arketa_payments_staging FOR ALL
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Managers can manage arketa_instructors_staging"
  ON arketa_instructors_staging FOR ALL
  USING (is_manager_or_admin(auth.uid()));