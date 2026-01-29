-- Sling users (promoted from staging)
CREATE TABLE sling_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sling_user_id int UNIQUE NOT NULL,
  first_name text,
  last_name text,
  email text,
  positions text[],
  is_active boolean DEFAULT true,
  linked_staff_id uuid,
  sling_created_at timestamptz,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Daily schedule (aggregated from sling shifts)
CREATE TABLE daily_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_date date NOT NULL,
  sling_user_id int NOT NULL,
  staff_id uuid,
  staff_name text,
  position text,
  shift_start timestamptz NOT NULL,
  shift_end timestamptz NOT NULL,
  location text,
  is_currently_working boolean DEFAULT false,
  last_synced_at timestamptz DEFAULT now(),
  UNIQUE(schedule_date, sling_user_id, shift_start)
);

-- Daily reports (aggregated metrics)
CREATE TABLE daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date UNIQUE NOT NULL,
  total_gym_checkins int DEFAULT 0,
  total_class_checkins int DEFAULT 0,
  total_reservations int DEFAULT 0,
  gross_sales_arketa numeric(10,2) DEFAULT 0,
  cafe_net_sales numeric(10,2) DEFAULT 0,
  cafe_gross_sales numeric(10,2) DEFAULT 0,
  cafe_order_count int DEFAULT 0,
  total_sales numeric(10,2) DEFAULT 0,
  raw_data jsonb,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Member check-ins (from Arketa reservations)
CREATE TABLE member_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_date date NOT NULL,
  checkin_time timestamptz NOT NULL,
  arketa_client_id text,
  member_name text,
  member_email text,
  checkin_type text,
  class_name text,
  created_at timestamptz DEFAULT now()
);

-- Class schedule (from Arketa classes)
CREATE TABLE class_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_date date NOT NULL,
  arketa_class_id text NOT NULL,
  class_name text NOT NULL,
  instructor_name text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  capacity int,
  signups int DEFAULT 0,
  checkins int DEFAULT 0,
  location text,
  last_synced_at timestamptz DEFAULT now(),
  UNIQUE(class_date, arketa_class_id)
);

-- Scheduled tours (from Calendly)
CREATE TABLE scheduled_tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_date date NOT NULL,
  calendly_event_id text UNIQUE NOT NULL,
  event_type text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  guest_name text,
  guest_email text,
  guest_phone text,
  status text DEFAULT 'active',
  notes text,
  assigned_to uuid,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE sling_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tours ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sling_users (managers only)
CREATE POLICY "Managers can manage sling_users"
  ON sling_users FOR ALL
  USING (is_manager_or_admin(auth.uid()));

-- RLS Policies for daily_schedules
CREATE POLICY "Managers can manage daily_schedules"
  ON daily_schedules FOR ALL
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Concierges can view daily_schedules"
  ON daily_schedules FOR SELECT
  USING (user_has_role(auth.uid(), 'concierge'));

-- RLS Policies for daily_reports
CREATE POLICY "Managers can manage daily_reports"
  ON daily_reports FOR ALL
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Concierges can view daily_reports"
  ON daily_reports FOR SELECT
  USING (user_has_role(auth.uid(), 'concierge'));

-- RLS Policies for member_checkins
CREATE POLICY "Managers can manage member_checkins"
  ON member_checkins FOR ALL
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Trainers can view assigned member checkins"
  ON member_checkins FOR SELECT
  USING (is_trainer(auth.uid()));

-- RLS Policies for class_schedule
CREATE POLICY "Managers can manage class_schedule"
  ON class_schedule FOR ALL
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Concierges can view class_schedule"
  ON class_schedule FOR SELECT
  USING (user_has_role(auth.uid(), 'concierge'));

-- RLS Policies for scheduled_tours
CREATE POLICY "Managers can manage scheduled_tours"
  ON scheduled_tours FOR ALL
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Concierges can view scheduled_tours"
  ON scheduled_tours FOR SELECT
  USING (user_has_role(auth.uid(), 'concierge'));

-- Create performance indexes
CREATE INDEX idx_sling_users_email ON sling_users(email);
CREATE INDEX idx_daily_schedules_date ON daily_schedules(schedule_date);
CREATE INDEX idx_daily_schedules_user ON daily_schedules(sling_user_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);
CREATE INDEX idx_member_checkins_date ON member_checkins(checkin_date);
CREATE INDEX idx_member_checkins_client ON member_checkins(arketa_client_id);
CREATE INDEX idx_class_schedule_date ON class_schedule(class_date);
CREATE INDEX idx_class_schedule_time ON class_schedule(start_time);
CREATE INDEX idx_scheduled_tours_date ON scheduled_tours(tour_date);
CREATE INDEX idx_scheduled_tours_status ON scheduled_tours(status);