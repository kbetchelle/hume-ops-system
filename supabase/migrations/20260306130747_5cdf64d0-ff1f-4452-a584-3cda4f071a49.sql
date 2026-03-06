CREATE POLICY "Cafe can delete own completions"
ON public.cafe_completions
FOR DELETE
TO authenticated
USING (
  auth.uid() = completed_by_id
  AND auth.uid() IN (
    SELECT user_roles.user_id
    FROM user_roles
    WHERE user_roles.role = 'cafe'::app_role
  )
);