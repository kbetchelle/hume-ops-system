-- Add unique constraint on reservation_id for upsert support
ALTER TABLE public.arketa_reservations 
  DROP CONSTRAINT IF EXISTS arketa_reservations_reservation_id_unique;

ALTER TABLE public.arketa_reservations 
  ADD CONSTRAINT arketa_reservations_reservation_id_unique UNIQUE (reservation_id);
