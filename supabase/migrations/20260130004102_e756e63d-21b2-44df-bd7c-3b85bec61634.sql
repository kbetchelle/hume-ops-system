-- Add FK constraint from staff_shifts to sling_users
-- Using DEFERRABLE INITIALLY DEFERRED to allow for sync order flexibility
ALTER TABLE public.staff_shifts
  ADD CONSTRAINT fk_staff_shifts_sling_user
  FOREIGN KEY (sling_user_id)
  REFERENCES public.sling_users(sling_user_id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;