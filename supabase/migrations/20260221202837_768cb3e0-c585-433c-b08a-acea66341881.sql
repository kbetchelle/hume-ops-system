
-- Function: check for sling users scheduled in next 7 days without a linked account
CREATE OR REPLACE FUNCTION public.notify_unlinked_scheduled_sling_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  manager_id uuid;
  sling_rec record;
BEGIN
  -- Find distinct sling_user_ids on the schedule in the next 7 days
  -- that do NOT have a linked profile (no account)
  FOR sling_rec IN
    SELECT DISTINCT ss.sling_user_id, ss.user_name
    FROM staff_shifts ss
    WHERE ss.shift_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
      AND ss.sling_user_id IS NOT NULL
      -- No sling_users row linked to a profile
      AND NOT EXISTS (
        SELECT 1 FROM sling_users su
        JOIN profiles p ON p.sling_id = su.id
        WHERE su.sling_user_id = ss.sling_user_id
      )
      -- Also not linked via linked_staff_id
      AND NOT EXISTS (
        SELECT 1 FROM sling_users su
        WHERE su.sling_user_id = ss.sling_user_id
          AND su.linked_staff_id IS NOT NULL
      )
  LOOP
    -- For each manager/admin, create a notification if one doesn't already exist (undismissed)
    FOR manager_id IN
      SELECT DISTINCT ur.user_id
      FROM user_roles ur
      WHERE ur.role IN ('admin', 'manager')
    LOOP
      -- Skip if an active (undismissed) notification already exists for this sling user
      IF NOT EXISTS (
        SELECT 1 FROM staff_notifications sn
        WHERE sn.user_id = manager_id
          AND sn.type = 'unlinked_sling_scheduled'
          AND sn.dismissed_at IS NULL
          AND sn.data->>'sling_user_id' = sling_rec.sling_user_id::text
      ) THEN
        INSERT INTO staff_notifications (user_id, type, title, body, data)
        VALUES (
          manager_id,
          'unlinked_sling_scheduled',
          'Scheduled Staff Without Account',
          sling_rec.user_name || ' is on the schedule but does not have a staff account.',
          jsonb_build_object(
            'sling_user_id', sling_rec.sling_user_id,
            'user_name', sling_rec.user_name
          )
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;
