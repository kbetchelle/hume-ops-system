-- Make booking_id nullable so CSV imports don't fail on empty values
ALTER TABLE public.arketa_reservations ALTER COLUMN booking_id DROP NOT NULL;