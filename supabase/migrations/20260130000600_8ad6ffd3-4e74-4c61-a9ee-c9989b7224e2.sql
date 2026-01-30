-- Add missing api_endpoints entries for backfill compatibility
INSERT INTO api_endpoints (api_name, endpoint_type, base_url, endpoint_path, rate_limit_per_min, is_active)
VALUES 
  ('arketa', 'payments', 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0', '/{partner_id}/purchases', 60, true),
  ('sling', 'shifts', 'https://api.getsling.com/v1', '/reports/roster', 100, true)
ON CONFLICT (api_name, endpoint_type) DO NOTHING;