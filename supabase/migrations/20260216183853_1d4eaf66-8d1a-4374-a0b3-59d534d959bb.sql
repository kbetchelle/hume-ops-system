
-- Remove experience_type and purchase_id from all arketa reservation tables
ALTER TABLE public.arketa_reservations DROP COLUMN IF EXISTS experience_type;
ALTER TABLE public.arketa_reservations DROP COLUMN IF EXISTS purchase_id;

ALTER TABLE public.arketa_reservations_staging DROP COLUMN IF EXISTS experience_type;
ALTER TABLE public.arketa_reservations_staging DROP COLUMN IF EXISTS purchase_id;

ALTER TABLE public.arketa_reservations_history DROP COLUMN IF EXISTS experience_type;
ALTER TABLE public.arketa_reservations_history DROP COLUMN IF EXISTS purchase_id;
