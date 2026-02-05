
-- Add unique constraint on reservation_id so we can use it directly as the upsert key
CREATE UNIQUE INDEX IF NOT EXISTS arketa_reservations_reservation_id_key ON public.arketa_reservations (reservation_id);
