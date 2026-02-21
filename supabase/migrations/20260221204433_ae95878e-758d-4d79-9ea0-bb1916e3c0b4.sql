
-- Rename table
ALTER TABLE public.staff_message_groups RENAME TO target_groups;

-- Add new columns
ALTER TABLE public.target_groups 
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS usage_context text[] DEFAULT '{}';

-- Rename the trigger function
CREATE OR REPLACE FUNCTION public.update_target_groups_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS update_staff_message_groups_updated_at ON public.target_groups;
CREATE TRIGGER update_target_groups_updated_at
  BEFORE UPDATE ON public.target_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_target_groups_updated_at();

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.target_groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.target_groups;
DROP POLICY IF EXISTS "Users can update groups they created" ON public.target_groups;
DROP POLICY IF EXISTS "Users can delete groups they created" ON public.target_groups;

-- New RLS: All authenticated can read
CREATE POLICY "Authenticated users can view all groups"
  ON public.target_groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admin/manager can insert
CREATE POLICY "Admins and managers can create groups"
  ON public.target_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

-- Only admin/manager can update
CREATE POLICY "Admins and managers can update groups"
  ON public.target_groups
  FOR UPDATE
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

-- Only admin/manager can delete
CREATE POLICY "Admins and managers can delete groups"
  ON public.target_groups
  FOR DELETE
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));
