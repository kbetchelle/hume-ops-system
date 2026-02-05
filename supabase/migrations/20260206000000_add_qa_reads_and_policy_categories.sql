-- staff_qa_reads: track which Q&A questions managers have viewed
CREATE TABLE IF NOT EXISTS public.staff_qa_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qa_id uuid NOT NULL REFERENCES public.staff_qa(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(qa_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_qa_reads_user_id ON public.staff_qa_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_qa_reads_qa_id ON public.staff_qa_reads(qa_id);

ALTER TABLE public.staff_qa_reads ENABLE ROW LEVEL SECURITY;

-- Users manage their own reads (SELECT + INSERT for own user_id)
CREATE POLICY "Users manage own reads"
  ON public.staff_qa_reads
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Managers can view all reads
CREATE POLICY "Managers can view all reads"
  ON public.staff_qa_reads
  FOR SELECT
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

-- policy_categories: manage policy groups/categories
CREATE TABLE IF NOT EXISTS public.policy_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_policy_categories_sort ON public.policy_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_policy_categories_active ON public.policy_categories(is_active);

ALTER TABLE public.policy_categories ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active categories
CREATE POLICY "Authenticated read active categories"
  ON public.policy_categories
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Managers can manage all categories
CREATE POLICY "Managers manage policy categories"
  ON public.policy_categories
  FOR ALL
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()))
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

-- Trigger for updated_at on policy_categories
CREATE TRIGGER update_policy_categories_updated_at
  BEFORE UPDATE ON public.policy_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.staff_qa_reads IS 'Tracks which staff Q&A questions managers have read';
COMMENT ON TABLE public.policy_categories IS 'Policy groups/categories for club_policies';
