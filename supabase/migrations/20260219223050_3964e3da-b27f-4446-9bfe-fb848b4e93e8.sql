-- Fix: 20260131000000_add_calendly_sync.sql (policy already existed)
DROP POLICY IF EXISTS "Managers can manage staging tours" ON scheduled_tours_staging;
CREATE POLICY "Managers can manage staging tours"
  ON scheduled_tours_staging FOR ALL
  USING (is_manager_or_admin(auth.uid()));