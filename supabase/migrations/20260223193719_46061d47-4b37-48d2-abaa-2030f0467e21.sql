-- Allow authenticated users to insert their own feedback
CREATE POLICY "Users can insert their own feedback"
ON public.ai_writer_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow service role (edge functions) to read all feedback
CREATE POLICY "Authenticated users can read feedback"
ON public.ai_writer_feedback
FOR SELECT
TO authenticated
USING (true);