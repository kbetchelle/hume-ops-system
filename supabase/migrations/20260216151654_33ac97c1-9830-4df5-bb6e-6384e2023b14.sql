
-- Add archived_at timestamp to lost_and_found
ALTER TABLE public.lost_and_found ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;

-- Set archived_at for already claimed/disposed items
UPDATE public.lost_and_found 
SET archived_at = COALESCE(claimed_date::timestamptz, created_at)
WHERE status IN ('claimed', 'disposed') AND archived_at IS NULL;

-- Create function to permanently delete archived items older than 14 days
CREATE OR REPLACE FUNCTION public.cleanup_archived_lost_and_found()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Queue photo deletions first
  INSERT INTO storage_deletion_queue (bucket_name, file_path)
  SELECT 'lost-and-found-photos', regexp_replace(photo_url, '^.*/lost-and-found-photos/', '')
  FROM lost_and_found
  WHERE archived_at IS NOT NULL
    AND archived_at < now() - INTERVAL '14 days'
    AND photo_url IS NOT NULL;

  -- Delete the records
  DELETE FROM lost_and_found
  WHERE archived_at IS NOT NULL
    AND archived_at < now() - INTERVAL '14 days';
END;
$$;
