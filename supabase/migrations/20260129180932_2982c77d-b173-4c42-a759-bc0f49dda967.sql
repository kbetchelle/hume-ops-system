-- API endpoint configuration (database-driven URLs)
CREATE TABLE api_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name text NOT NULL,
  endpoint_type text NOT NULL,
  base_url text NOT NULL,
  endpoint_path text NOT NULL,
  max_date_range_days int,
  rate_limit_per_min int,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(api_name, endpoint_type)
);

-- API sync status tracking
CREATE TABLE api_sync_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name text UNIQUE NOT NULL,
  last_sync_at timestamptz,
  last_sync_success boolean,
  last_error_message text,
  last_records_processed int DEFAULT 0,
  last_records_inserted int DEFAULT 0,
  sync_frequency_minutes int DEFAULT 60,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comprehensive API logging
CREATE TABLE api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name text NOT NULL,
  endpoint text NOT NULL,
  request_method text DEFAULT 'POST',
  sync_success boolean NOT NULL,
  duration_ms int,
  records_processed int DEFAULT 0,
  records_inserted int DEFAULT 0,
  response_status int,
  response_body jsonb,
  raw_response text,
  error_message text,
  triggered_by text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

-- System alerts for API failures
CREATE TABLE system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  api_name text,
  severity text DEFAULT 'warning',
  message text NOT NULL,
  details jsonb,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by text,
  auto_resolve_on_sync boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_endpoints
CREATE POLICY "Managers can manage api_endpoints"
  ON api_endpoints FOR ALL
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Authenticated users can view api_endpoints"
  ON api_endpoints FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for api_sync_status
CREATE POLICY "Managers can manage api_sync_status"
  ON api_sync_status FOR ALL
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Authenticated users can view api_sync_status"
  ON api_sync_status FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for api_logs (managers only)
CREATE POLICY "Managers can view api_logs"
  ON api_logs FOR SELECT
  USING (is_manager_or_admin(auth.uid()));

CREATE POLICY "Managers can insert api_logs"
  ON api_logs FOR INSERT
  WITH CHECK (is_manager_or_admin(auth.uid()));

-- RLS Policies for system_alerts (managers only)
CREATE POLICY "Managers can manage system_alerts"
  ON system_alerts FOR ALL
  USING (is_manager_or_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_api_endpoints_api_name ON api_endpoints(api_name);
CREATE INDEX idx_api_logs_api_name ON api_logs(api_name);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at DESC);
CREATE INDEX idx_system_alerts_api_name ON system_alerts(api_name);
CREATE INDEX idx_system_alerts_is_resolved ON system_alerts(is_resolved);
CREATE INDEX idx_system_alerts_severity ON system_alerts(severity);

-- Trigger for updated_at on api_sync_status
CREATE TRIGGER update_api_sync_status_updated_at
  BEFORE UPDATE ON api_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default API configurations
INSERT INTO api_endpoints (api_name, endpoint_type, base_url, endpoint_path, rate_limit_per_min) VALUES
  ('arketa', 'classes', 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0', '/{partner_id}/classes', 60),
  ('arketa', 'reservations', 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0', '/{partner_id}/classes/{class_id}/reservations', 60),
  ('arketa', 'purchases', 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0', '/{partner_id}/purchases', 60),
  ('arketa', 'clients', 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0', '/{partner_id}/clients', 60),
  ('sling', 'users', 'https://api.getsling.com/v1', '/users', 100),
  ('sling', 'groups', 'https://api.getsling.com/v1', '/groups', 100),
  ('sling', 'roster', 'https://api.getsling.com/v1', '/reports/roster', 100),
  ('sling', 'timesheets', 'https://api.getsling.com/v1', '/reports/timesheets', 100),
  ('toast', 'orders', 'https://ws-api.toasttab.com', '/orders/v2/ordersBulk', 30),
  ('toast', 'auth', 'https://ws-api.toasttab.com', '/authentication/v1/authentication/login', 10),
  ('calendly', 'events', 'https://api.calendly.com/v2', '/scheduled_events', 60);

INSERT INTO api_sync_status (api_name, sync_frequency_minutes) VALUES
  ('arketa', 30),
  ('sling', 15),
  ('toast', 60),
  ('calendly', 30);