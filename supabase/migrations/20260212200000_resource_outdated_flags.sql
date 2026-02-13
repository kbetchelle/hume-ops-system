-- ============================================================================
-- Resource Outdated Flags + Inbox Reads
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Tables
-- --------------------------------------------------------------------------

-- resource_outdated_flags: staff-reported flags for outdated resources.
-- Uses a polymorphic pattern (resource_type + resource_id) with no FK
-- constraint because the referenced row can live in one of 4 tables.
CREATE TABLE public.resource_outdated_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic resource reference (4 possible target tables)
  resource_type text NOT NULL CHECK (resource_type IN (
    'quick_link_group', 'quick_link_item', 'resource_page', 'club_policy'
  )),
  resource_id uuid NOT NULL,
  resource_label text NOT NULL,  -- human-readable name stored at flag time

  -- Who flagged and why
  flagged_by_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flagged_by_name text NOT NULL,
  note text NOT NULL,  -- mandatory explanation

  -- Resolution tracking
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dismissed', 'resolved')),
  resolved_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_by_name text,
  resolved_at timestamptz,
  resolution_note text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- inbox_reads: generalised read-tracking for the management inbox.
-- Replaces the per-feature staff_qa_reads pattern with a single table that
-- supports multiple item types (qa, flag, shift_note).
CREATE TABLE public.inbox_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('qa', 'flag', 'shift_note')),
  item_id uuid NOT NULL,
  read_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

-- --------------------------------------------------------------------------
-- 2. Enable RLS
-- --------------------------------------------------------------------------

ALTER TABLE public.resource_outdated_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_reads              ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- 3. RLS Policies — resource_outdated_flags
-- --------------------------------------------------------------------------

-- All authenticated users can read flags (needed for "Under Review" badges)
CREATE POLICY "Authenticated can read flags"
  ON public.resource_outdated_flags
  FOR SELECT
  TO authenticated
  USING (true);

-- Any authenticated user can create a flag on their own behalf
CREATE POLICY "Authenticated can create flags"
  ON public.resource_outdated_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (flagged_by_id = auth.uid());

-- Managers/admins can update flags (resolve or dismiss)
CREATE POLICY "Managers can update flags"
  ON public.resource_outdated_flags
  FOR UPDATE
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

-- Managers/admins can delete flags
CREATE POLICY "Managers can delete flags"
  ON public.resource_outdated_flags
  FOR DELETE
  TO authenticated
  USING (public.is_manager_or_admin(auth.uid()));

-- --------------------------------------------------------------------------
-- 4. RLS Policies — inbox_reads
-- --------------------------------------------------------------------------

-- Users manage their own inbox read markers
CREATE POLICY "Users manage own inbox reads"
  ON public.inbox_reads
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- 5. Indexes
-- --------------------------------------------------------------------------

-- Fast lookup for "Under Review" badge rendering on resource pages
CREATE INDEX idx_resource_flags_resource
  ON public.resource_outdated_flags (resource_type, resource_id)
  WHERE status = 'pending';

-- Management inbox query — pending flags sorted newest-first
CREATE INDEX idx_resource_flags_status_created
  ON public.resource_outdated_flags (status, created_at DESC);

-- Inbox reads lookup by user
CREATE INDEX idx_inbox_reads_user
  ON public.inbox_reads (user_id, item_type);

-- --------------------------------------------------------------------------
-- 6. Triggers
-- --------------------------------------------------------------------------

CREATE TRIGGER update_resource_outdated_flags_updated_at
  BEFORE UPDATE ON public.resource_outdated_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- --------------------------------------------------------------------------
-- 7. Data Migration — copy existing staff_qa_reads into inbox_reads
-- --------------------------------------------------------------------------

INSERT INTO public.inbox_reads (user_id, item_type, item_id, read_at)
SELECT user_id, 'qa', qa_id, read_at
FROM public.staff_qa_reads
ON CONFLICT (user_id, item_type, item_id) DO NOTHING;

-- --------------------------------------------------------------------------
-- 8. Comments
-- --------------------------------------------------------------------------

COMMENT ON TABLE public.resource_outdated_flags IS 'Staff-reported flags indicating a resource may contain outdated information';
COMMENT ON TABLE public.inbox_reads IS 'Tracks which management inbox items a user has read (qa, flag, shift_note)';
