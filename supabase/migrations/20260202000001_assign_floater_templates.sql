-- Assign the 4 uncategorized templates to FLOATER role
-- Migration created: 2026-02-02

-- Insert or update FLOATER templates
-- These templates had placeholder UUIDs and need proper role/shift assignment

-- FLOATER Opening AM Weekday (5:40 AM start)
INSERT INTO public.checklist_templates (id, name, role, shift_type, is_active, created_at)
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
  shift_type = EXCLUDED.shift_type,
  is_active = EXCLUDED.is_active;

-- FLOATER Opening AM Weekend (6:40 AM start)
INSERT INTO public.checklist_templates (id, name, role, shift_type, is_active, created_at)
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
  shift_type = EXCLUDED.shift_type,
  is_active = EXCLUDED.is_active;

-- FLOATER Closing PM Full (8:30 PM end)
INSERT INTO public.checklist_templates (id, name, role, shift_type, is_active, created_at)
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
  shift_type = EXCLUDED.shift_type,
  is_active = EXCLUDED.is_active;

-- FLOATER Closing PM Early (6:30 PM end)
INSERT INTO public.checklist_templates (id, name, role, shift_type, is_active, created_at)
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
  shift_type = EXCLUDED.shift_type,
  is_active = EXCLUDED.is_active;

-- Add comment to track these as placeholder templates
COMMENT ON TABLE public.checklist_templates IS 
  'Checklist templates assigned to roles and shift types. Templates with placeholder UUIDs (a1111111, a2222222, a3333333, a4444444) are FLOATER role checklists.';
