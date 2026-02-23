-- Allow admin/manager to delete feedback entries
CREATE POLICY "Admins can delete feedback"
ON public.ai_writer_feedback
FOR DELETE
TO authenticated
USING (public.is_manager_or_admin(auth.uid()));