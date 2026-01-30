-- Drop old columns and add new columns for arketa_clients
ALTER TABLE public.arketa_clients
  DROP COLUMN IF EXISTS first_name,
  DROP COLUMN IF EXISTS last_name,
  DROP COLUMN IF EXISTS full_name,
  DROP COLUMN IF EXISTS external_trainer_id,
  DROP COLUMN IF EXISTS avatar_url,
  DROP COLUMN IF EXISTS membership_tier,
  DROP COLUMN IF EXISTS join_date;

-- Rename existing columns to match new schema
ALTER TABLE public.arketa_clients RENAME COLUMN email TO client_email;
ALTER TABLE public.arketa_clients RENAME COLUMN phone TO client_phone;

-- Add new columns
ALTER TABLE public.arketa_clients
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS client_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS email_mkt_opt_in boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_mkt_opt_in boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS lifecycle_stage text;

-- Update arketa_clients_staging table
DROP TABLE IF EXISTS public.arketa_clients_staging;

CREATE TABLE public.arketa_clients_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_batch_id uuid NOT NULL,
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

-- Enable RLS
ALTER TABLE public.arketa_clients_staging ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policy
CREATE POLICY "Managers can manage arketa_clients_staging"
  ON public.arketa_clients_staging
  FOR ALL
  USING (is_manager_or_admin(auth.uid()));