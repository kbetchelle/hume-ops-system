CREATE OR REPLACE FUNCTION public.notify_managers_new_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_id uuid;
BEGIN
  -- Only notify if status is pending
  IF NEW.approval_status = 'pending' AND NEW.onboarding_completed = true THEN
    -- Create notification for all managers, admins, and developers
    FOR target_id IN 
      SELECT DISTINCT ur.user_id
      FROM public.user_roles ur
      WHERE ur.role IN ('admin', 'manager', 'developer')
    LOOP
      INSERT INTO public.staff_notifications (
        user_id,
        type,
        title,
        body,
        data
      ) VALUES (
        target_id,
        'account_approval_pending',
        'New Account Pending Approval',
        NEW.full_name || ' (' || NEW.email || ') has signed up and needs account approval.',
        jsonb_build_object(
          'user_id', NEW.user_id,
          'email', NEW.email,
          'full_name', NEW.full_name
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;