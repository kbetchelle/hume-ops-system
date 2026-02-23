-- Seed mastercard client visits for Lovable local / dev environment.
-- Uses fixed UUIDs and ON CONFLICT DO NOTHING so the migration is idempotent (safe to re-run).

INSERT INTO public.mastercard_visits (
  id,
  visit_date,
  start_time,
  end_time,
  client_name,
  client_email,
  client_phone,
  mastercard_tier,
  number_of_guests,
  visit_purpose,
  status
) VALUES
  (
    'a1b2c3d4-0001-4000-8000-000000000001'::uuid,
    CURRENT_DATE,
    (CURRENT_DATE + TIME '10:00') AT TIME ZONE 'UTC',
    (CURRENT_DATE + TIME '12:00') AT TIME ZONE 'UTC',
    'Jane Smith',
    'jane.smith@example.com',
    '+1 555-0101',
    'Black Card',
    2,
    'Property tour and amenities experience',
    'scheduled'
  ),
  (
    'a1b2c3d4-0002-4000-8000-000000000002'::uuid,
    CURRENT_DATE,
    (CURRENT_DATE + TIME '14:30') AT TIME ZONE 'UTC',
    (CURRENT_DATE + TIME '16:00') AT TIME ZONE 'UTC',
    'Alex Johnson',
    'alex.j@example.com',
    NULL,
    'Platinum',
    1,
    'Lounge access and meeting',
    'scheduled'
  ),
  (
    'a1b2c3d4-0003-4000-8000-000000000003'::uuid,
    CURRENT_DATE + INTERVAL '1 day',
    (CURRENT_DATE + INTERVAL '1 day' + TIME '09:00') AT TIME ZONE 'UTC',
    (CURRENT_DATE + INTERVAL '1 day' + TIME '11:00') AT TIME ZONE 'UTC',
    'Maria Garcia',
    'maria.garcia@example.com',
    '+1 555-0103',
    'World Elite',
    4,
    'Family visit and facility tour',
    'scheduled'
  ),
  (
    'a1b2c3d4-0004-4000-8000-000000000004'::uuid,
    CURRENT_DATE - INTERVAL '1 day',
    (CURRENT_DATE - INTERVAL '1 day' + TIME '15:00') AT TIME ZONE 'UTC',
    (CURRENT_DATE - INTERVAL '1 day' + TIME '17:00') AT TIME ZONE 'UTC',
    'David Lee',
    'd.lee@example.com',
    NULL,
    'Black Card',
    0,
    'Completed site visit',
    'completed'
  )
ON CONFLICT (id) DO NOTHING;
