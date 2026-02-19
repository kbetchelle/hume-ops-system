
CREATE TABLE public.ai_writer_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rating text NOT NULL CHECK (rating IN ('positive', 'negative')),
  feedback_text text,
  ai_input text NOT NULL,
  ai_output text NOT NULL,
  ai_mode text NOT NULL CHECK (ai_mode IN ('compose', 'polish')),
  template_guide_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_writer_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
ON public.ai_writer_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers and admins can read all feedback"
ON public.ai_writer_feedback
FOR SELECT
TO authenticated
USING (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "Users can read own feedback"
ON public.ai_writer_feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
