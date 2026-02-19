
CREATE OR REPLACE FUNCTION public.dismiss_pending_approval_notifications()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  -- When approval_status changes from 'pending' to approved/rejected, dismiss related notifications
  IF OLD.approval_status = 'pending' 
     AND NEW.approval_status IN ('auto_approved', 'manager_approved', 'rejected') THEN
    
    UPDATE public.staff_notifications
    SET dismissed_at = now(), is_read = true
    WHERE type = 'account_approval_pending'
      AND dismissed_at IS NULL
      AND data->>'user_id' = NEW.user_id::text;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER dismiss_approval_notifications_on_status_change
  AFTER UPDATE OF approval_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.dismiss_pending_approval_notifications();
