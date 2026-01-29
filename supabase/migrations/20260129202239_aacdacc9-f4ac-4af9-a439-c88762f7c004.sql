-- Response templates table
CREATE TABLE IF NOT EXISTS public.response_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Quick links table
CREATE TABLE IF NOT EXISTS public.quick_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  icon text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Lost and found table
CREATE TABLE IF NOT EXISTS public.lost_and_found (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  location_found text,
  date_found date DEFAULT CURRENT_DATE,
  found_by_id uuid,
  found_by_name text,
  status text DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'claimed', 'disposed')),
  claimed_by text,
  claimed_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Staff documents table
CREATE TABLE IF NOT EXISTS public.staff_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size int DEFAULT 0,
  target_roles text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  uploaded_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_and_found ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for response_templates
CREATE POLICY "Authenticated users can read active templates"
  ON public.response_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage templates"
  ON public.response_templates FOR ALL
  USING (public.is_manager_or_admin(auth.uid()));

-- RLS Policies for quick_links
CREATE POLICY "Authenticated users can read active links"
  ON public.quick_links FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage quick links"
  ON public.quick_links FOR ALL
  USING (public.is_manager_or_admin(auth.uid()));

-- RLS Policies for lost_and_found
CREATE POLICY "Authenticated users can read lost and found"
  ON public.lost_and_found FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can insert lost and found items"
  ON public.lost_and_found FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Staff can update lost and found items"
  ON public.lost_and_found FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can delete lost and found items"
  ON public.lost_and_found FOR DELETE
  USING (public.is_manager_or_admin(auth.uid()));

-- RLS Policies for staff_documents
CREATE POLICY "Authenticated users can read staff documents"
  ON public.staff_documents FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage staff documents"
  ON public.staff_documents FOR ALL
  USING (public.is_manager_or_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_response_templates_category ON public.response_templates(category);
CREATE INDEX IF NOT EXISTS idx_quick_links_category ON public.quick_links(category);
CREATE INDEX IF NOT EXISTS idx_lost_and_found_status ON public.lost_and_found(status);
CREATE INDEX IF NOT EXISTS idx_staff_documents_category ON public.staff_documents(category);

-- Insert sample response templates
INSERT INTO public.response_templates (category, title, content, tags) VALUES
('Membership Inquiries', 'Membership Options Overview', 'Thank you for your interest in joining HUME! We offer several membership tiers:\n\n• Essential - Basic gym access\n• Premium - Full facility access including spa\n• Elite - All-inclusive with personal training sessions\n\nWould you like to schedule a tour to learn more about our facilities?', ARRAY['membership', 'pricing', 'tiers']),
('Guest Passes', 'Guest Pass Policy', 'Members are entitled to bring guests with prior arrangement. Guest passes are $25 per visit. Please note:\n\n• Guests must sign a waiver\n• Guests must be accompanied by the member\n• Maximum 2 guests per member per day\n\nWould you like to arrange a guest visit?', ARRAY['guest', 'visitor', 'pass']),
('Facility Questions', 'Hours of Operation', 'HUME is open:\n\nMonday - Friday: 5:00 AM - 10:00 PM\nSaturday: 6:00 AM - 8:00 PM\nSunday: 7:00 AM - 6:00 PM\n\nHoliday hours may vary. Please check our app for the most current schedule.', ARRAY['hours', 'schedule', 'open', 'closed']),
('Complaints', 'Complaint Acknowledgment', 'Thank you for bringing this to our attention. We take all member feedback seriously and are committed to resolving this matter promptly.\n\nI have forwarded your concerns to our management team, and someone will follow up with you within 24 hours.\n\nWe appreciate your patience and continued membership.', ARRAY['complaint', 'issue', 'problem', 'feedback']),
('General', 'Thank You Response', 'Thank you for reaching out to HUME! We appreciate your inquiry.\n\nIf you have any additional questions, please don''t hesitate to contact us or visit our concierge desk.\n\nBest regards,\nThe HUME Team', ARRAY['thanks', 'general', 'acknowledgment']);

-- Insert sample quick links
INSERT INTO public.quick_links (category, title, url, icon, sort_order) VALUES
('Booking Systems', 'Arketa Dashboard', 'https://arketa.co/dashboard', 'calendar', 1),
('Booking Systems', 'Class Schedule', 'https://arketa.co/schedule', 'clock', 2),
('Member Lookup', 'Member Database', 'https://arketa.co/members', 'users', 3),
('Internal Tools', 'Staff Portal', 'https://portal.hume.club', 'building', 4),
('Emergency', 'Emergency Procedures', 'https://docs.hume.club/emergency', 'alert-triangle', 5);