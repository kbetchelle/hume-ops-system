-- Assign the 4 uncategorized templates to FLOATER role
-- Migration created: 2026-02-02

-- Ensure shift_time column exists (schema may have shift_type from older migrations)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'checklist_templates' AND column_name = 'shift_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'checklist_templates' AND column_name = 'shift_time'
  ) THEN
    ALTER TABLE public.checklist_templates RENAME COLUMN shift_type TO shift_time;
  END IF;
END $$;

-- Add shift_time if missing (for schemas that never had shift_type)
ALTER TABLE public.checklist_templates ADD COLUMN IF NOT EXISTS shift_time TEXT;

-- Temporarily drop unique constraint to allow multiple floater templates
-- (Migration 000002 merges them; 000003 drops this constraint permanently)
ALTER TABLE public.checklist_templates DROP CONSTRAINT IF EXISTS checklist_templates_role_shift_type_key;
ALTER TABLE public.checklist_templates DROP CONSTRAINT IF EXISTS checklist_templates_role_shift_time_key;

-- Insert or update FLOATER templates
-- These templates had placeholder UUIDs and need proper role/shift assignment

-- FLOATER Opening AM Weekday (5:40 AM start)
INSERT INTO public.checklist_templates (id, name, role, shift_time, is_active, created_at)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'Floater Opening - AM Weekday',
  'floater',
  'AM',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  shift_time = EXCLUDED.shift_time,
  is_active = EXCLUDED.is_active;

-- FLOATER Opening AM Weekend (6:40 AM start)
INSERT INTO public.checklist_templates (id, name, role, shift_time, is_active, created_at)
VALUES (
  'a3333333-3333-3333-3333-333333333333',
  'Floater Opening - AM Weekend',
  'floater',
  'AM',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  shift_time = EXCLUDED.shift_time,
  is_active = EXCLUDED.is_active;

-- FLOATER Closing PM Full (8:30 PM end)
INSERT INTO public.checklist_templates (id, name, role, shift_time, is_active, created_at)
VALUES (
  'a2222222-2222-2222-2222-222222222222',
  'Floater Closing - PM Full',
  'floater',
  'PM',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  shift_time = EXCLUDED.shift_time,
  is_active = EXCLUDED.is_active;

-- FLOATER Closing PM Early (6:30 PM end)
INSERT INTO public.checklist_templates (id, name, role, shift_time, is_active, created_at)
VALUES (
  'a4444444-4444-4444-4444-444444444444',
  'Floater Closing - PM Early',
  'floater',
  'PM',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  shift_time = EXCLUDED.shift_time,
  is_active = EXCLUDED.is_active;

-- All templates required by 20260202000003_import_csv_metadata (CSV references these IDs)
INSERT INTO public.checklist_templates (id, name, role, shift_time, is_active, created_at)
VALUES
  ('92f77f28-e8fd-4cb0-91da-750ce8b57ed1', 'Concierge Opening AM', 'concierge', 'AM', true, now()),
  ('f6d03214-8486-4339-a5bc-97535d2fa0ee', 'Concierge Closing PM', 'concierge', 'PM', true, now()),
  ('55c2e572-0853-4d29-99e4-5b8a5686a61a', 'BOH Spa AM', 'male_spa_attendant', 'AM', true, now()),
  ('36b5dc1d-67a7-4a10-9740-a2ac7395f3d6', 'BOH Spa PM', 'male_spa_attendant', 'PM', true, now()),
  ('439b53bd-d394-4b05-8564-69b65c96c1c7', 'Cafe Opening AM', 'cafe', 'AM', true, now()),
  ('11514e89-ab6e-4bdc-812c-a61f430f0e1f', 'Cafe Closing PM', 'cafe', 'PM', true, now()),
  ('203b8aff-35a3-4091-b3ab-34d4c7b917a1', 'Concierge Weekend AM', 'concierge', 'AM', true, now()),
  ('4a32322b-2d85-467d-b0c1-bea7267d060e', 'Concierge Weekend PM', 'concierge', 'PM', true, now()),
  ('a0a505be-f800-4fc4-87f9-d3603061705b', 'BOH Female Spa AM', 'female_spa_attendant', 'AM', true, now()),
  ('a7c8bdda-a06e-4a65-bf58-a90fa673ae53', 'BOH Female Spa PM', 'female_spa_attendant', 'PM', true, now()),
  ('a8ae8176-624e-499f-910f-5136194f68b7', 'BOH Male Spa AM', 'male_spa_attendant', 'AM', true, now()),
  ('a8f354c8-9c53-4c00-8988-d1eb81ab545b', 'BOH Male Spa PM', 'male_spa_attendant', 'PM', true, now()),
  ('c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a', 'Cafe Weekend AM', 'cafe', 'AM', true, now()),
  ('cdd9e53a-e618-4000-8a1e-dfd3413592be', 'Cafe Weekend PM', 'cafe', 'PM', true, now()),
  ('e961c03d-6dca-426b-ab2a-87505f6cfaf6', 'FOH AM', 'concierge', 'AM', true, now()),
  ('ecfbdc24-b68c-4647-b23f-16474e2e198f', 'FOH PM', 'concierge', 'PM', true, now()),
  ('f169c325-e872-4d68-b957-7b35ac3f9add', 'BOH Floater PM', 'floater', 'PM', true, now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  shift_time = EXCLUDED.shift_time,
  is_active = EXCLUDED.is_active;

-- Add comment to track these as placeholder templates
COMMENT ON TABLE public.checklist_templates IS 
  'Checklist templates assigned to roles and shift types. Templates with placeholder UUIDs (a1111111, a2222222, a3333333, a4444444) are FLOATER role checklists.';
