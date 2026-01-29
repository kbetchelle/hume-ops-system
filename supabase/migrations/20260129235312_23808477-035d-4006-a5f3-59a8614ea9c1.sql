-- Add missing columns to sync_schedule table
ALTER TABLE public.sync_schedule 
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS function_name TEXT;

-- Update display_name and function_name for existing records
UPDATE public.sync_schedule SET 
  display_name = CASE sync_type
    WHEN 'arketa_clients' THEN 'Arketa Clients'
    WHEN 'arketa_classes' THEN 'Arketa Classes'
    WHEN 'arketa_reservations' THEN 'Arketa Reservations'
    WHEN 'arketa_payments' THEN 'Arketa Payments'
    WHEN 'arketa_instructors' THEN 'Arketa Instructors'
    WHEN 'sling_users' THEN 'Sling Users'
    WHEN 'sling_shifts' THEN 'Sling Shifts'
    ELSE sync_type
  END,
  function_name = CASE sync_type
    WHEN 'arketa_clients' THEN 'sync-arketa-clients'
    WHEN 'arketa_classes' THEN 'sync-arketa-classes'
    WHEN 'arketa_reservations' THEN 'sync-arketa-reservations'
    WHEN 'arketa_payments' THEN 'sync-arketa-payments'
    WHEN 'arketa_instructors' THEN 'sync-arketa-instructors'
    WHEN 'sling_users' THEN 'sling-api'
    WHEN 'sling_shifts' THEN 'sling-api'
    ELSE 'unknown'
  END
WHERE display_name IS NULL OR function_name IS NULL;

-- Make columns NOT NULL after populating
ALTER TABLE public.sync_schedule 
  ALTER COLUMN display_name SET NOT NULL,
  ALTER COLUMN function_name SET NOT NULL;

-- Add check constraint for last_status if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sync_schedule_last_status_check'
  ) THEN
    ALTER TABLE public.sync_schedule 
      ADD CONSTRAINT sync_schedule_last_status_check 
      CHECK (last_status IN ('pending', 'running', 'success', 'failed', 'timeout'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sync_schedule_sync_type ON public.sync_schedule(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_schedule_next_run_at ON public.sync_schedule(next_run_at);

-- Add missing columns to api_credentials if they don't exist
ALTER TABLE public.api_credentials 
  ADD COLUMN IF NOT EXISTS token_type TEXT DEFAULT 'Bearer',
  ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMPTZ;