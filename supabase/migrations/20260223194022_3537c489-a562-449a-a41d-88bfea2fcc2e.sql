-- Allow admin/manager to update priority_rank
CREATE POLICY "Admins can update feedback rank"
ON public.ai_writer_feedback
FOR UPDATE
TO authenticated
USING (public.is_manager_or_admin(auth.uid()))
WITH CHECK (public.is_manager_or_admin(auth.uid()));