-- Add DELETE policy for boh_completions (matching INSERT policy roles)
CREATE POLICY "BoH staff can delete own completions"
ON public.boh_completions
FOR DELETE
TO authenticated
USING (
  auth.uid() = completed_by_id
  AND auth.uid() IN (
    SELECT user_roles.user_id
    FROM user_roles
    WHERE user_roles.role = ANY (ARRAY['floater'::app_role, 'male_spa_attendant'::app_role, 'female_spa_attendant'::app_role])
  )
);

-- Add DELETE policy for concierge_completions (matching INSERT policy roles)
CREATE POLICY "Concierge can delete own completions"
ON public.concierge_completions
FOR DELETE
TO authenticated
USING (
  auth.uid() = completed_by_id
  AND auth.uid() IN (
    SELECT user_roles.user_id
    FROM user_roles
    WHERE user_roles.role = 'concierge'::app_role
  )
);