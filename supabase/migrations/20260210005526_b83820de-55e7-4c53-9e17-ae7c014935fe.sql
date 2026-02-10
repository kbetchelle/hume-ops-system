-- Widen valid_api_source to include arketa, sling, toast. Skip if backfill_jobs does not exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'backfill_jobs') THEN
    ALTER TABLE public.backfill_jobs DROP CONSTRAINT IF EXISTS valid_api_source;
    ALTER TABLE public.backfill_jobs ADD CONSTRAINT valid_api_source CHECK (api_source = ANY (ARRAY['arketa'::text, 'sling'::text, 'toast'::text]));
  END IF;
END $$;