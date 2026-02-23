-- Add priority_rank column to ai_writer_feedback
-- Higher rank = more important for model training context
ALTER TABLE public.ai_writer_feedback
ADD COLUMN priority_rank integer DEFAULT 0;

-- Index for efficient ranked queries
CREATE INDEX idx_ai_writer_feedback_rank ON public.ai_writer_feedback (rating, priority_rank DESC, created_at DESC);