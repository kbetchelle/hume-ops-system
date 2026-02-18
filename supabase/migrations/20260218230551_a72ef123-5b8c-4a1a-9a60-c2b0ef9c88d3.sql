-- Drop the UUID overload that conflicts with the text version
DROP FUNCTION IF EXISTS public.upsert_arketa_classes_from_staging(uuid);
