-- =============================================
-- Import historical event drinks data
-- =============================================
-- Source: event_drinks-export-2026-02-11_19-57-11.csv
-- Transforms:
--   notes        → additional_notes
--   photoshoot   false/true → NULL/'Yes'
--   menu_printed false/true → NULL/'Yes'
--   staff JSON   ["a","b"] → postgres array '{"a","b"}'

INSERT INTO public.event_drinks (
  id, event_name, event_type, event_type_notes, drink_name, event_date,
  staff, supplies_ordered, supplies_ordered_at,
  photoshoot, photoshoot_at, menu_printed, menu_printed_at,
  staff_notified, staff_notified_at,
  needs_followup, recipe, food, supplies_needed, additional_notes,
  is_archived, created_by, created_at, updated_at
) VALUES

-- 1. Book Launch Brunch w/ Tomas El Rayes
(
  'f80e4607-b3d0-4b9e-a45b-c0350c4a793c',
  'Book Launch Brunch w/ Tomas El Rayes',
  'Saturday Social', NULL,
  'N/A',
  '2026-02-28',
  '{}',
  false, NULL,
  NULL, NULL,
  NULL, NULL,
  false, NULL,
  false,
  NULL, NULL, NULL, NULL,
  false, 'Unknown',
  '2026-01-09 19:48:16.858026+00',
  '2026-01-09 19:49:06.736+00'
),

-- 2. NOYZ – Apple Blossom Matcha
(
  'c3af1a69-e68c-4368-bada-d1155d559916',
  'NOYZ',
  'Saturday Social', NULL,
  'Apple Blossom Matcha',
  '2026-02-07',
  '{}',
  false, NULL,
  NULL, NULL,
  NULL, NULL,
  false, NULL,
  false,
  NULL, NULL, NULL,
  E'1. ONLY HUMAN:\nVANILLA BEAN / AMBROXAN / CEDARWOOD\n\n2. DETOUR:\nGARDENIA BLOOM / APPLE BLOSSOM / SKIN MUSK',
  false, 'Unknown',
  '2026-01-09 19:42:22.036184+00',
  '2026-01-18 02:03:18.764+00'
),

-- 3. Biogena One – Free Add-In (archived)
(
  '3380295e-c9d5-4e06-a619-e2df41575afc',
  'Biogena One',
  'Saturday Social', NULL,
  'Free Add-In',
  '2025-01-10',
  '{"Skye","Charlie","Chris"}',
  false, NULL,
  NULL, NULL,
  NULL, NULL,
  false, NULL,
  false,
  'Free Biogena One powder supplement add-in to any drink purchase',
  NULL, NULL, NULL,
  true, 'Unknown',
  '2026-01-09 19:22:11.632828+00',
  '2026-01-10 20:44:33.413+00'
),

-- 4. Shrtlst – Tropical Recharge
(
  '2ebc67aa-6851-4649-bf8e-36955e3333fe',
  'Shrtlst',
  'Saturday Social', NULL,
  'Tropical Recharge',
  '2026-01-24',
  '{"Chris","Skye","Charlie"}',
  false, NULL,
  NULL, NULL,
  NULL, NULL,
  false, NULL,
  false,
  'They are going with our traditional recharge smoothie to mimic their clouds/ in the air theme. They are bringing their own branded cups.',
  NULL, NULL, NULL,
  false, 'Unknown',
  '2026-01-08 23:58:43.485859+00',
  '2026-01-09 19:22:59.575+00'
),

-- 5. DUO Training Workshop – Complimentary Bites (archived)
(
  'c1117f30-12b4-4a7b-8866-3edb312bbea9',
  'DUO Training Workshop',
  'Other', 'HUME Workshop/ Hang',
  'Complimentary Bites',
  '2026-01-11',
  '{"Chris","Charlie"}',
  true, '2026-01-09',
  NULL, NULL,
  'Yes', '2026-01-09',
  false, NULL,
  false,
  'prep black drip coffee (complimentary) to workshop attendees 10am',
  E'prep light bites from cafe / Gjusta (overnight oats, chia pudding, smoothie samples 2x flavors) for 11:00am\nGjusta items will be divided up into little espresso portion cups\nSmoothie samples in 8 oz cups\nSmoothies: cacao powder and olive oil glow?',
  E'mini spoons (Skye)\nCafe signage (abbey)',
  NULL,
  true, 'Unknown',
  '2026-01-09 00:17:00.695663+00',
  '2026-01-13 20:45:13.85+00'
),

-- 6. Momentum – Free add-in
(
  '13c2221b-f5dd-4784-a962-69085d299c02',
  'Momentum',
  'Saturday Social', NULL,
  'Free add-in',
  '2026-01-17',
  '{"Skye","Chris","Charlie"}',
  false, NULL,
  NULL, NULL,
  NULL, NULL,
  false, NULL,
  false,
  NULL, NULL, NULL,
  E'1 free scoop to any drink',
  false, 'Unknown',
  '2026-01-09 19:33:33.319916+00',
  '2026-01-13 23:08:51.14+00'
),

-- 7. Magna Sat Social – Tropical Magna Smoothie
(
  'a3e7b6b7-0881-43be-a483-0450a2da8c2a',
  'Magna Sat Social',
  'Saturday Social', NULL,
  'Tropical Magna Smoothie',
  '2026-01-31',
  '{"Skye","Charlie","Chris"}',
  false, NULL,
  NULL, NULL,
  NULL, NULL,
  false, NULL,
  false,
  NULL, NULL, NULL,
  'First 30 purchases of Magna Tropical Smoothie get free Magna sample pack.',
  false, 'Unknown',
  '2026-01-09 19:30:25.421364+00',
  '2026-01-13 23:22:19.013+00'
),

-- 8. Half Past 8
(
  'aeeee6a6-310a-46c7-9953-960f1ef0af2d',
  'Half Past 8',
  'Saturday Social', NULL,
  'NA',
  '2026-02-21',
  '{}',
  false, NULL,
  NULL, NULL,
  NULL, NULL,
  false, NULL,
  false,
  NULL, NULL, NULL, NULL,
  false, 'Unknown',
  '2026-01-09 19:46:37.003443+00',
  '2026-01-09 19:46:37.003443+00'
)

ON CONFLICT (id) DO NOTHING;
