-- Drop orphaned announcements tables (consolidate on staff_announcements)
-- Tables public.announcements and public.announcement_reads are only used by
-- CommunicationsPage/useAnnouncements; we refactor the app to use staff_announcements only.
-- CASCADE drops any FK from staff_announcement_comments (or others) that incorrectly
-- reference announcements; we then re-add the correct FK to staff_announcements.

DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
DROP TABLE IF EXISTS public.announcement_reads;
DROP TABLE IF EXISTS public.announcements CASCADE;

-- Ensure staff_announcement_comments references staff_announcements (CASCADE may have removed the wrong FK)
ALTER TABLE public.staff_announcement_comments
  DROP CONSTRAINT IF EXISTS staff_announcement_comments_announcement_id_fkey;
ALTER TABLE public.staff_announcement_comments
  ADD CONSTRAINT staff_announcement_comments_announcement_id_fkey
  FOREIGN KEY (announcement_id) REFERENCES public.staff_announcements(id) ON DELETE CASCADE;
