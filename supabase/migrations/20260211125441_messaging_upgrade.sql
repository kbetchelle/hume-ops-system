-- =============================================
-- Messaging System Upgrade Migration
-- =============================================
-- This migration upgrades the staff messaging system with:
-- - Group conversations and threading
-- - Reactions and read receipts
-- - Drafts and scheduled messages
-- - Archive functionality

-- =============================================
-- 1. ALTER EXISTING TABLES
-- =============================================

-- Add new columns to staff_messages
ALTER TABLE staff_messages
ADD COLUMN IF NOT EXISTS recipient_departments text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_urgent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS group_id uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS group_name text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS thread_id uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES staff_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS scheduled_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS edited_at timestamptz DEFAULT NULL;

-- Add indexes to staff_messages
CREATE INDEX IF NOT EXISTS idx_staff_messages_thread_id ON staff_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_staff_messages_group_id ON staff_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_staff_messages_recipient_ids ON staff_messages USING GIN(recipient_ids);
CREATE INDEX IF NOT EXISTS idx_staff_messages_scheduled ON staff_messages(scheduled_at) WHERE is_sent = false;

-- Add new columns to staff_message_reads
ALTER TABLE staff_message_reads
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Add index to staff_message_reads
CREATE INDEX IF NOT EXISTS idx_staff_message_reads_archived ON staff_message_reads(staff_id, is_archived);

-- Add unique constraint if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'staff_message_reads_message_id_staff_id_key'
  ) THEN
    ALTER TABLE staff_message_reads 
    ADD CONSTRAINT staff_message_reads_message_id_staff_id_key 
    UNIQUE (message_id, staff_id);
  END IF;
END $$;

-- =============================================
-- 2. CREATE NEW TABLES
-- =============================================

-- Staff message reactions
CREATE TABLE IF NOT EXISTS staff_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES staff_messages(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_name text NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, staff_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_staff_message_reactions_message ON staff_message_reactions(message_id);

-- Staff message groups
CREATE TABLE IF NOT EXISTS staff_message_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  member_ids uuid[] NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_message_groups_created_by ON staff_message_groups(created_by);

-- Staff message drafts
CREATE TABLE IF NOT EXISTS staff_message_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text,
  content text,
  recipient_staff_ids uuid[],
  recipient_departments text[],
  group_id uuid REFERENCES staff_message_groups(id) ON DELETE SET NULL,
  is_urgent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_message_drafts_staff_id ON staff_message_drafts(staff_id);

-- =============================================
-- 3. ENABLE RLS ON NEW TABLES
-- =============================================

ALTER TABLE staff_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_message_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_message_drafts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. RLS POLICIES
-- =============================================

-- Policies for staff_message_reactions
CREATE POLICY "Users can view reactions on their messages"
  ON staff_message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_messages 
      WHERE staff_messages.id = staff_message_reactions.message_id
      AND (staff_messages.sender_id = auth.uid() OR auth.uid() = ANY(staff_messages.recipient_ids))
    )
  );

CREATE POLICY "Users can add reactions to messages they can see"
  ON staff_message_reactions FOR INSERT
  WITH CHECK (
    staff_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM staff_messages 
      WHERE staff_messages.id = staff_message_reactions.message_id
      AND (staff_messages.sender_id = auth.uid() OR auth.uid() = ANY(staff_messages.recipient_ids))
    )
  );

CREATE POLICY "Users can delete their own reactions"
  ON staff_message_reactions FOR DELETE
  USING (staff_id = auth.uid());

-- Policies for staff_message_groups
CREATE POLICY "Users can view groups they belong to"
  ON staff_message_groups FOR SELECT
  USING (auth.uid() = ANY(member_ids) OR created_by = auth.uid());

CREATE POLICY "Users can create groups"
  ON staff_message_groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update groups they created"
  ON staff_message_groups FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete groups they created"
  ON staff_message_groups FOR DELETE
  USING (created_by = auth.uid());

-- Policies for staff_message_drafts
CREATE POLICY "Users can manage their own drafts"
  ON staff_message_drafts FOR ALL
  USING (staff_id = auth.uid());

-- =============================================
-- 5. TRIGGERS
-- =============================================

-- Trigger to update updated_at on staff_message_groups
CREATE OR REPLACE FUNCTION update_staff_message_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_staff_message_groups_updated_at ON staff_message_groups;
CREATE TRIGGER trigger_update_staff_message_groups_updated_at
  BEFORE UPDATE ON staff_message_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_message_groups_updated_at();

-- Trigger to update updated_at on staff_message_drafts
CREATE OR REPLACE FUNCTION update_staff_message_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_staff_message_drafts_updated_at ON staff_message_drafts;
CREATE TRIGGER trigger_update_staff_message_drafts_updated_at
  BEFORE UPDATE ON staff_message_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_message_drafts_updated_at();

-- =============================================
-- 6. SCHEDULED MESSAGES FUNCTION
-- =============================================

-- Function to process scheduled messages
CREATE OR REPLACE FUNCTION process_scheduled_messages()
RETURNS void AS $$
BEGIN
  -- Update messages that are scheduled to be sent now
  UPDATE staff_messages
  SET is_sent = true
  WHERE scheduled_at IS NOT NULL
    AND scheduled_at <= now()
    AND is_sent = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: pg_cron setup requires extension and configuration
-- This would typically be done via Supabase dashboard or separate setup:
-- SELECT cron.schedule('process-scheduled-messages', '* * * * *', 'SELECT process_scheduled_messages()');

-- =============================================
-- 7. REALTIME PUBLICATION
-- =============================================

-- Add tables to realtime publication (if supabase_realtime exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Add staff_messages if not already included
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'staff_messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE staff_messages;
    END IF;

    -- Add staff_message_reads if not already included
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'staff_message_reads'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE staff_message_reads;
    END IF;

    -- Add staff_message_reactions
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'staff_message_reactions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE staff_message_reactions;
    END IF;
  END IF;
END $$;

-- =============================================
-- 8. GRANT PERMISSIONS
-- =============================================

-- Service role has full access
GRANT ALL ON staff_message_reactions TO service_role;
GRANT ALL ON staff_message_groups TO service_role;
GRANT ALL ON staff_message_drafts TO service_role;

-- Authenticated users have conditional access via RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_message_reactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_message_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_message_drafts TO authenticated;
