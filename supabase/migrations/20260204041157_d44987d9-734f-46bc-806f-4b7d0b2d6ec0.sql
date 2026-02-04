-- Add DELETE policy for page_dev_status table
CREATE POLICY "Admins and managers can delete page status"
ON public.page_dev_status
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = ANY (ARRAY['admin'::app_role, 'manager'::app_role])
  )
);