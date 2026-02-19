-- ============================================================================
-- Migration: User Walkthrough State
-- Version: 20260301120000
-- Description: Tracks per-user walkthrough completion/skip and page-specific
--              hints viewed, for first-time dashboard experience and replay.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_walkthrough_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  completed_at TIMESTAMPTZ NULL,
  skipped_at TIMESTAMPTZ NULL,
  viewed_page_hints TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_walkthrough_state_user_id
  ON public.user_walkthrough_state(user_id);

COMMENT ON TABLE public.user_walkthrough_state IS 'Tracks whether the user completed or skipped the app walkthrough and which page hints they have viewed.';
COMMENT ON COLUMN public.user_walkthrough_state.viewed_page_hints IS 'Array of page hint identifiers (e.g. route or slug) that the user has already seen.';

-- RLS: users can only read/insert/update their own row
ALTER TABLE public.user_walkthrough_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own walkthrough state"
  ON public.user_walkthrough_state FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own walkthrough state"
  ON public.user_walkthrough_state FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own walkthrough state"
  ON public.user_walkthrough_state FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_user_walkthrough_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_walkthrough_state_updated_at ON public.user_walkthrough_state;
CREATE TRIGGER user_walkthrough_state_updated_at
  BEFORE UPDATE ON public.user_walkthrough_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_walkthrough_state_updated_at();

-- Append a page hint to viewed_page_hints (idempotent: no duplicate hint ids)
CREATE OR REPLACE FUNCTION public.walkthrough_mark_hint_viewed(_hint_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_walkthrough_state
  SET
    viewed_page_hints = array_append(viewed_page_hints, _hint_id),
    updated_at = now()
  WHERE user_id = auth.uid()
    AND NOT (_hint_id = ANY(viewed_page_hints));

  -- If no row existed, insert one with just this hint (or merge on conflict)
  IF NOT FOUND THEN
    INSERT INTO public.user_walkthrough_state (user_id, viewed_page_hints)
    VALUES (auth.uid(), ARRAY[_hint_id])
    ON CONFLICT (user_id) DO UPDATE
    SET
      viewed_page_hints = CASE
        WHEN NOT (_hint_id = ANY(public.user_walkthrough_state.viewed_page_hints))
        THEN array_append(public.user_walkthrough_state.viewed_page_hints, _hint_id)
        ELSE public.user_walkthrough_state.viewed_page_hints
      END,
      updated_at = now();
  END IF;
END;
$$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
