
CREATE OR REPLACE FUNCTION public.auto_mark_old_announcements_read()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.staff_announcement_reads (announcement_id, staff_id, read_at)
  SELECT sa.id, NEW.user_id, NOW()
  FROM public.staff_announcements sa
  WHERE sa.created_at < NEW.created_at
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_auto_mark_old_announcements_read
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_mark_old_announcements_read();
