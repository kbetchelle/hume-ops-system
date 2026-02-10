-- Add staff_announcement_type enum and migrate staff_announcements.announcement_type
-- Values: 'announcement' (replaces 'alert'), 'weekly_update'
-- Drop default first so the type change can run, then set the new default.

CREATE TYPE public.staff_announcement_type AS ENUM ('announcement', 'weekly_update');

ALTER TABLE public.staff_announcements
  ALTER COLUMN announcement_type DROP DEFAULT;

ALTER TABLE public.staff_announcements
  ALTER COLUMN announcement_type TYPE public.staff_announcement_type
  USING (
    CASE
      WHEN announcement_type::text = 'weekly_update' THEN 'weekly_update'::public.staff_announcement_type
      ELSE 'announcement'::public.staff_announcement_type
    END
  );

ALTER TABLE public.staff_announcements
  ALTER COLUMN announcement_type SET DEFAULT 'announcement'::public.staff_announcement_type;
