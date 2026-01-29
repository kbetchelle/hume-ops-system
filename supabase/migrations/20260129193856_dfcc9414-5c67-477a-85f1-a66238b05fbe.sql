-- Checklist templates (shift-aware version)
CREATE TABLE IF NOT EXISTS checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  shift_type text NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, shift_type)
);

-- Checklist template items
CREATE TABLE IF NOT EXISTS checklist_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES checklist_templates(id) ON DELETE CASCADE,
  item_text text NOT NULL,
  sort_order int DEFAULT 0,
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Checklist template completions (with soft delete)
CREATE TABLE IF NOT EXISTS checklist_template_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES checklist_template_items(id) ON DELETE CASCADE,
  template_id uuid REFERENCES checklist_templates(id) ON DELETE CASCADE,
  completion_date date NOT NULL,
  completed_by_id uuid,
  completed_by text,
  completed_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(item_id, completion_date)
);

-- Shift reports
CREATE TABLE IF NOT EXISTS shift_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date NOT NULL,
  shift_type text NOT NULL,
  submitted_by_id uuid,
  submitted_by text,
  summary text,
  incidents text,
  handoff_notes text,
  weather text,
  tour_notes text,
  member_feedback text,
  facility_issues text,
  form_data jsonb,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(report_date, shift_type)
);

-- Staff announcements
CREATE TABLE IF NOT EXISTS staff_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  announcement_type text DEFAULT 'alert',
  priority text DEFAULT 'normal',
  target_departments text[],
  week_start_date date,
  photo_url text,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Staff announcement reads
CREATE TABLE IF NOT EXISTS staff_announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid REFERENCES staff_announcements(id) ON DELETE CASCADE,
  staff_id uuid,
  read_at timestamptz DEFAULT now(),
  UNIQUE(announcement_id, staff_id)
);

-- Staff messages
CREATE TABLE IF NOT EXISTS staff_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid,
  sender_name text,
  recipient_ids uuid[],
  subject text,
  content text NOT NULL,
  is_sent boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Staff message reads
CREATE TABLE IF NOT EXISTS staff_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES staff_messages(id) ON DELETE CASCADE,
  staff_id uuid,
  read_at timestamptz DEFAULT now(),
  UNIQUE(message_id, staff_id)
);

-- Enable RLS on all new tables
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_template_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_message_reads ENABLE ROW LEVEL SECURITY;

-- RLS policies for checklist_templates
CREATE POLICY "Managers can manage checklist templates" ON checklist_templates
  FOR ALL USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Staff can view active checklist templates" ON checklist_templates
  FOR SELECT USING (is_active = true);

-- RLS policies for checklist_template_items
CREATE POLICY "Managers can manage checklist template items" ON checklist_template_items
  FOR ALL USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Staff can view checklist template items" ON checklist_template_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM checklist_templates ct 
    WHERE ct.id = checklist_template_items.template_id AND ct.is_active = true
  ));

-- RLS policies for checklist_template_completions
CREATE POLICY "Managers can manage all completions" ON checklist_template_completions
  FOR ALL USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Staff can view completions" ON checklist_template_completions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create their own completions" ON checklist_template_completions
  FOR INSERT WITH CHECK (completed_by_id = auth.uid());

CREATE POLICY "Staff can update their own completions" ON checklist_template_completions
  FOR UPDATE USING (completed_by_id = auth.uid());

-- RLS policies for shift_reports
CREATE POLICY "Managers can manage shift reports" ON shift_reports
  FOR ALL USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Staff can view shift reports" ON shift_reports
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can create shift reports" ON shift_reports
  FOR INSERT WITH CHECK (submitted_by_id = auth.uid());

CREATE POLICY "Staff can update their own shift reports" ON shift_reports
  FOR UPDATE USING (submitted_by_id = auth.uid());

-- RLS policies for staff_announcements
CREATE POLICY "Managers can manage staff announcements" ON staff_announcements
  FOR ALL USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Staff can view active announcements" ON staff_announcements
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- RLS policies for staff_announcement_reads
CREATE POLICY "Staff can manage their own reads" ON staff_announcement_reads
  FOR ALL USING (staff_id = auth.uid());

-- RLS policies for staff_messages
CREATE POLICY "Users can view messages they sent or received" ON staff_messages
  FOR SELECT USING (sender_id = auth.uid() OR auth.uid() = ANY(recipient_ids));

CREATE POLICY "Users can send messages" ON staff_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- RLS policies for staff_message_reads
CREATE POLICY "Users can manage their own message reads" ON staff_message_reads
  FOR ALL USING (staff_id = auth.uid());