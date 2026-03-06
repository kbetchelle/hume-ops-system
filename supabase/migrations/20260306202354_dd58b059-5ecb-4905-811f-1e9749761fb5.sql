
-- Fix 2: Allow concierges to delete their own draft reports
CREATE POLICY "Concierges can delete their own draft reports"
ON public.daily_report_history
FOR DELETE
TO authenticated
USING (
  user_has_role(auth.uid(), 'concierge'::app_role)
  AND staff_user_id = auth.uid()
  AND status = 'draft'
);

-- Fix 3: Allow concierges to update their own reports regardless of status
DROP POLICY IF EXISTS "Concierges can update their own reports" ON public.daily_report_history;
CREATE POLICY "Concierges can update their own reports"
ON public.daily_report_history
FOR UPDATE
TO authenticated
USING (
  user_has_role(auth.uid(), 'concierge'::app_role)
  AND staff_user_id = auth.uid()
)
WITH CHECK (
  user_has_role(auth.uid(), 'concierge'::app_role)
  AND staff_user_id = auth.uid()
);
