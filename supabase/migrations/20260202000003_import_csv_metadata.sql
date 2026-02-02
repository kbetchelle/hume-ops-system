-- Import CSV metadata to checklist_template_items
-- Migration created: 2026-02-02
-- This migration updates all checklist items with task_type, time_hint, category, and other metadata from CSV export

-- IMPORTANT: Run this migration AFTER:
-- 1. 20260202000000_add_checklist_item_metadata.sql
-- 2. 20260202000001_assign_floater_templates.sql
-- 3. 20260202000002_merge_duplicate_floater_templates.sql

BEGIN;


-- Item: efc66f4f-008c-41d5-acbe-31e0731e12b6 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'efc66f4f-008c-41d5-acbe-31e0731e12b6',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  '6 AM – 7 AM',
  '6 AM – 7 AM',
  0,
  'checkbox',
  '5:30 AM - 6:00 AM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 15369d33-849a-4e5c-a280-83757ad3e8fe (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '15369d33-849a-4e5c-a280-83757ad3e8fe',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Submit opener checklist & review daily notes',
  'Submit opener checklist & review daily notes',
  4,
  'checkbox',
  '6:00 AM - 7:00 AM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e17a4c7a-4713-40c6-9fea-a928e3693521 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e17a4c7a-4713-40c6-9fea-a928e3693521',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Open Cardio Room Curtains',
  'Open Cardio Room Curtains',
  8,
  'photo',
  '7:00 AM - 8:00 AM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3370f102-9246-46a6-841f-8b5ebe720824 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3370f102-9246-46a6-841f-8b5ebe720824',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Walkthrough',
  'Walkthrough',
  9,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 56ec305a-99be-4e7c-87fe-38777d5a4850 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '56ec305a-99be-4e7c-87fe-38777d5a4850',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Tidy Stretch Area 2 & surrounding equipment',
  'Tidy Stretch Area 2 & surrounding equipment',
  10,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 39082cd1-1102-4a9d-b501-1560b22be05a (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '39082cd1-1102-4a9d-b501-1560b22be05a',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Restock towels on 2nd floor & in cardio room',
  'Restock towels on 2nd floor & in cardio room',
  11,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f7d6d772-4ed9-4870-b67a-908def2b2abe (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f7d6d772-4ed9-4870-b67a-908def2b2abe',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Check women''s spa – water, towels, open closed shower doors, restock vanity as needed',
  'Check women''s spa – water, towels, open closed shower doors, restock vanity as needed',
  12,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: fef266eb-7032-4455-9061-6735cefdcc95 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'fef266eb-7032-4455-9061-6735cefdcc95',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Check Men''s Spa – water, towels, open closed shower doors, restock vanity as needed',
  'Check Men''s Spa – water, towels, open closed shower doors, restock vanity as needed',
  13,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3cfdc157-aa51-4147-8b39-a70753e957ac (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3cfdc157-aa51-4147-8b39-a70753e957ac',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  '7:30 AM – turn on Cafe Music',
  '7:30 AM – turn on Cafe Music',
  14,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'red',
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 62c2b49f-e3c5-48b0-8c02-3b0519660da3 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '62c2b49f-e3c5-48b0-8c02-3b0519660da3',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Walkthrough: cardio room towels, stretch areas, left side of gym, 2nd floor towels',
  'Walkthrough: cardio room towels, stretch areas, left side of gym, 2nd floor towels',
  17,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4c3bca76-182d-4617-be0a-01af62ed4b44 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4c3bca76-182d-4617-be0a-01af62ed4b44',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Refill Men''s Spa Water & restock cups',
  'Refill Men''s Spa Water & restock cups',
  18,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4b1a3b51-b943-4568-b04c-f2ccd6e4eb9f (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4b1a3b51-b943-4568-b04c-f2ccd6e4eb9f',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Refill Women''s Spa Water & restock cups',
  'Refill Women''s Spa Water & restock cups',
  19,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 250ff00c-562c-4c43-9e2d-f7528c3724d2 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '250ff00c-562c-4c43-9e2d-f7528c3724d2',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Ask Carlos if he wants coffee',
  'Ask Carlos if he wants coffee',
  24,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1862cb30-7b58-4e95-8f1c-4057e00191ce (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1862cb30-7b58-4e95-8f1c-4057e00191ce',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Walkthrough: 2nd floor towels, recovery room (batteries, boots), roof',
  'Walkthrough: 2nd floor towels, recovery room (batteries, boots), roof',
  25,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a02ef6c8-a2e2-40f0-9ccb-702c582bd8bc (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a02ef6c8-a2e2-40f0-9ccb-702c582bd8bc',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Check that compression boots are tidy & batteries are fully charged or charging',
  'Check that compression boots are tidy & batteries are fully charged or charging',
  26,
  'photo',
  '9:00 AM - 10:00 AM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a6f9951c-9b7a-465c-96b9-2cafd60b029a (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a6f9951c-9b7a-465c-96b9-2cafd60b029a',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Check linen baskets in private recovery room. If full, bring to front desk and inform BOH',
  'Check linen baskets in private recovery room. If full, bring to front desk and inform BOH',
  27,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 91fa221b-28f3-44d9-a32b-7f3858035e92 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '91fa221b-28f3-44d9-a32b-7f3858035e92',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Rooftop: Check for dirty towels & overall tidiness',
  'Rooftop: Check for dirty towels & overall tidiness',
  28,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8aa4b0f7-b087-4913-8764-8bafab8dd881 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8aa4b0f7-b087-4913-8764-8bafab8dd881',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Check Men''s Spa – water, towels, showers, amenities',
  'Check Men''s Spa – water, towels, showers, amenities',
  29,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0c4c8f1f-3d7a-4cdb-ab7a-af5a079f4517 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0c4c8f1f-3d7a-4cdb-ab7a-af5a079f4517',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Check Women''s Spa – water, towels, showers, amenities',
  'Check Women''s Spa – water, towels, showers, amenities',
  30,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 59c6f294-64c1-46c7-ba91-5e14de6288fe (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '59c6f294-64c1-46c7-ba91-5e14de6288fe',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Walkthrough - all',
  'Walkthrough - all',
  34,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5229c3e3-fe21-416d-9cd8-b535bed18398 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5229c3e3-fe21-416d-9cd8-b535bed18398',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Check Men''s Spa – water, towels, floors, amenities',
  'Check Men''s Spa – water, towels, floors, amenities',
  35,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f002df7d-84fa-4a4b-9a5b-afe3f0019161 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f002df7d-84fa-4a4b-9a5b-afe3f0019161',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Check Women''s Spa – water, towels, floors, amenities',
  'Check Women''s Spa – water, towels, floors, amenities',
  36,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 788918a7-5133-41f3-91c9-beba21d846d9 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '788918a7-5133-41f3-91c9-beba21d846d9',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Walkthrough',
  'Walkthrough',
  39,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 18d12e54-7f25-4788-9b4b-46fb056614d5 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '18d12e54-7f25-4788-9b4b-46fb056614d5',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Check Women''s spa – towels, amenities, floors, refill spa water & restock cups',
  'Check Women''s spa – towels, amenities, floors, refill spa water & restock cups',
  40,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c9f9a94c-ddad-4fcc-b89d-dd17680fb022 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c9f9a94c-ddad-4fcc-b89d-dd17680fb022',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Check messages: emails & arketa',
  'Check messages: emails & arketa',
  6,
  'checkbox',
  '6:00 AM - 7:00 AM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9c7375ff-5c68-4300-ac6d-f444b7ee0c80 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9c7375ff-5c68-4300-ac6d-f444b7ee0c80',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  '7:50 Reset Rooftop Music to Gym Nu (Spotify) - Tuesday, Thursday, Friday',
  '7:50 Reset Rooftop Music to Gym Nu (Spotify) - Tuesday, Thursday, Friday',
  15,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: cc2a9e88-83f5-4998-9180-6b4e2f63616b (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'cc2a9e88-83f5-4998-9180-6b4e2f63616b',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Breaks MUST be started BY 10:20 AM at the latest. Avoid break time from 9:45-10:15. Please sign if understood. Signature 1',
  'Breaks MUST be started BY 10:20 AM at the latest. Avoid break time from 9:45-10:15. Please sign if understood. Signature 1',
  1,
  'signature',
  '6:00 AM - 7:00 AM',
  NULL,
  'gray',
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1679a85b-809a-4d66-b148-db37455d384c (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1679a85b-809a-4d66-b148-db37455d384c',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Breaks MUST be started BY 10:20 AM at the latest. Avoid break time from 9:45-10:15. Please sign if understood. Signature 2',
  'Breaks MUST be started BY 10:20 AM at the latest. Avoid break time from 9:45-10:15. Please sign if understood. Signature 2',
  2,
  'signature',
  '6:00 AM - 7:00 AM',
  NULL,
  'gray',
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 52d3426c-53ff-444c-9948-392ad601e1a6 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '52d3426c-53ff-444c-9948-392ad601e1a6',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  '8:20 - 8:50: Break 1. Signature of who took break',
  '8:20 - 8:50: Break 1. Signature of who took break',
  20,
  'signature',
  '8:00 AM - 9:00 AM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 34fbe44a-ac99-451f-a960-c05bf32a9136 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '34fbe44a-ac99-451f-a960-c05bf32a9136',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Restock all towel pyramids in women''s spa (1 pyramid on each vanity of small towels with a base of 5; 1 medium towel pyramid on cabinets with base of 5)',
  'Restock all towel pyramids in women''s spa (1 pyramid on each vanity of small towels with a base of 5; 1 medium towel pyramid on cabinets with base of 5)',
  41,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d93fe53a-dcbd-4223-ba31-00967fe61fa6 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd93fe53a-dcbd-4223-ba31-00967fe61fa6',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Check Men''s Spa – water, towels, floors, amenities, refill spa water & restock cups',
  'Check Men''s Spa – water, towels, floors, amenities, refill spa water & restock cups',
  42,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 94702ffa-db14-49bd-876e-e7550b087150 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '94702ffa-db14-49bd-876e-e7550b087150',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Restock all towel pyramids in men''s spa (medium towels, base of 4)',
  'Restock all towel pyramids in men''s spa (medium towels, base of 4)',
  43,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8abef57f-0592-48a6-b880-cbe5f07dd7df (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8abef57f-0592-48a6-b880-cbe5f07dd7df',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Restock towel pyramids on 2nd floor',
  'Restock towel pyramids on 2nd floor',
  44,
  'photo',
  '11:00 AM - 12:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0e2d58a3-bfa8-427b-a48f-91916f9dc4ec (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0e2d58a3-bfa8-427b-a48f-91916f9dc4ec',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Restock towel pyramids in cardio room',
  'Restock towel pyramids in cardio room',
  45,
  'photo',
  '11:00 AM - 12:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0d7d7e8d-9540-4a76-bca2-dac3eccba55d (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0d7d7e8d-9540-4a76-bca2-dac3eccba55d',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Walkthrough',
  'Walkthrough',
  47,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5cc94338-f59f-4110-889a-0161c8040571 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5cc94338-f59f-4110-889a-0161c8040571',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Check paper towels & toilet paper in Men''s Spa & refill spa water',
  'Check paper towels & toilet paper in Men''s Spa & refill spa water',
  48,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 49aad5fd-aa00-479f-bd0a-48e76f09962f (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '49aad5fd-aa00-479f-bd0a-48e76f09962f',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Check temperature of both cold plunges in men''s spa & record here. Let BOH know to add ice if needed',
  'Check temperature of both cold plunges in men''s spa & record here. Let BOH know to add ice if needed',
  49,
  'short_entry',
  '12:00 PM - 1:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ad932d41-6aa8-431e-9d46-49fe4ba2355d (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ad932d41-6aa8-431e-9d46-49fe4ba2355d',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Check paper towels & toilet paper in Women''s Spa & refill spa water',
  'Check paper towels & toilet paper in Women''s Spa & refill spa water',
  50,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: bf0d8f4a-e163-4a4e-9ffc-9875b11fd6f5 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'bf0d8f4a-e163-4a4e-9ffc-9875b11fd6f5',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Check temperature of both cold plunges in women''s spa & record here. Let BOH know to add ice if needed',
  'Check temperature of both cold plunges in women''s spa & record here. Let BOH know to add ice if needed',
  51,
  'short_entry',
  '12:00 PM - 1:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 61561e61-fa28-481b-9816-0cba141ddb3c (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '61561e61-fa28-481b-9816-0cba141ddb3c',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Restock towel pyramids on 2nd floor & in cardio room',
  'Restock towel pyramids on 2nd floor & in cardio room',
  52,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 791dc574-9576-41e6-8c03-9f294f9adf38 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '791dc574-9576-41e6-8c03-9f294f9adf38',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'WEEKLY TASK: Mon-check lmnt & cymbiotika | Tue-lost clothes | Wed-water bottles dates | Thu-guest/member policy cards | Fri-oxygen masks/disposable sheets',
  'WEEKLY TASK: Mon-check lmnt & cymbiotika | Tue-lost clothes | Wed-water bottles dates | Thu-guest/member policy cards | Fri-oxygen masks/disposable sheets',
  53,
  'multiple_choice',
  '12:00 PM - 1:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 18d315f4-4daa-412f-9830-8e018d4d4e1a (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '18d315f4-4daa-412f-9830-8e018d4d4e1a',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Complete final walkthrough',
  'Complete final walkthrough',
  55,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 22e9858a-c542-4dbc-a416-384a2b86f920 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '22e9858a-c542-4dbc-a416-384a2b86f920',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Ensure all items are answered on Daily Notes',
  'Ensure all items are answered on Daily Notes',
  57,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'green',
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3f864a5d-f16b-4359-8d2a-e25849ef8ac7 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3f864a5d-f16b-4359-8d2a-e25849ef8ac7',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Check Men''s Spa Water & restock cups, roll towels, check for tidiness, and open all unoccupied shower doors to aerate',
  'Check Men''s Spa Water & restock cups, roll towels, check for tidiness, and open all unoccupied shower doors to aerate',
  5,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'purple',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 83faba7b-bb5d-4275-b5f4-c3b90ba6faed (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '83faba7b-bb5d-4275-b5f4-c3b90ba6faed',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Reset Sauna timer in men''s spa',
  'Reset Sauna timer in men''s spa',
  6,
  'photo',
  '2:00 PM - 3:00 PM',
  NULL,
  'purple',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6871b3a3-e1ea-45f7-9ec0-4c1b11dbb001 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6871b3a3-e1ea-45f7-9ec0-4c1b11dbb001',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Check Women''s Spa Water & restock cups, roll towels, check for tidiness, and open all unoccupied shower doors to aerate',
  'Check Women''s Spa Water & restock cups, roll towels, check for tidiness, and open all unoccupied shower doors to aerate',
  7,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'purple',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1f870d24-7c46-4a60-8f9b-62a7662f51d9 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1f870d24-7c46-4a60-8f9b-62a7662f51d9',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Reset Sauna timer in women''s spa',
  'Reset Sauna timer in women''s spa',
  8,
  'photo',
  '2:00 PM - 3:00 PM',
  NULL,
  'purple',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: fa37a022-b218-4a92-a27d-1b91ca8add33 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'fa37a022-b218-4a92-a27d-1b91ca8add33',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Walkthrough - Tidy Stretch Area 2 & surrounding equipment',
  'Walkthrough - Tidy Stretch Area 2 & surrounding equipment',
  9,
  'yes_no',
  '2:00 PM - 3:00 PM',
  NULL,
  'purple',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 287004e9-a9c0-48f3-948a-a7e18c4e46c5 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '287004e9-a9c0-48f3-948a-a7e18c4e46c5',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Restock towel pyramids on 2nd floor & cardio room',
  'Restock towel pyramids on 2nd floor & cardio room',
  10,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'purple',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: cc192ff3-7cef-4c5e-968f-d266c0a2733d (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'cc192ff3-7cef-4c5e-968f-d266c0a2733d',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'WEEKLY TASK: Mon-dust retail shelves | Tue-lost clothes from BOH | Wed-pillow cases behind HBOT | Thu-dust retail shelves | Fri-restock office supplies',
  'WEEKLY TASK: Mon-dust retail shelves | Tue-lost clothes from BOH | Wed-pillow cases behind HBOT | Thu-dust retail shelves | Fri-restock office supplies',
  11,
  'multiple_choice',
  '2:00 PM - 3:00 PM',
  NULL,
  'purple',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8086f4d1-422e-4294-8cda-3b6311dc7768 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8086f4d1-422e-4294-8cda-3b6311dc7768',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Check Men''s Spa',
  'Check Men''s Spa',
  14,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'yellow',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1b8b1186-6eae-4ac0-b5e0-73bc9ddc4af9 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1b8b1186-6eae-4ac0-b5e0-73bc9ddc4af9',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Check temperature of men''s cold tubs. If not cold enough, top off ice.',
  'Check temperature of men''s cold tubs. If not cold enough, top off ice.',
  15,
  'short_entry',
  '3:00 PM - 4:00 PM',
  NULL,
  'yellow',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 393fe6f7-e4f9-49eb-80f4-feef05709577 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '393fe6f7-e4f9-49eb-80f4-feef05709577',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Check Women''s Spa',
  'Check Women''s Spa',
  16,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'yellow',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3f221524-89ef-48df-a0ae-4f62701fbcbd (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3f221524-89ef-48df-a0ae-4f62701fbcbd',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Check temperature of women''s cold plunges',
  'Check temperature of women''s cold plunges',
  17,
  'short_entry',
  '3:00 PM - 4:00 PM',
  NULL,
  'yellow',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4df58bd2-646f-405c-9452-325aabb7108c (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4df58bd2-646f-405c-9452-325aabb7108c',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Check recovery room – boots are tidy & deflated, all recovery tools are charged or charging',
  'Check recovery room – boots are tidy & deflated, all recovery tools are charged or charging',
  18,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'yellow',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4d19a684-fdfe-494b-83ee-4533ee5fe9c6 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4d19a684-fdfe-494b-83ee-4533ee5fe9c6',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  '4 - 4:30: Break 1',
  '4 - 4:30: Break 1',
  20,
  'signature',
  '4:00 PM - 5:00 PM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: aa486618-c827-4f87-b4aa-b6a7b02a1ff7 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'aa486618-c827-4f87-b4aa-b6a7b02a1ff7',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Walkthrough: Cardio room towels, stretch area 1, tidy left side of gym, 2nd floor towels',
  'Walkthrough: Cardio room towels, stretch area 1, tidy left side of gym, 2nd floor towels',
  13,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'yellow',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c41e7478-91f6-4f77-ae47-65087a373867 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c41e7478-91f6-4f77-ae47-65087a373867',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Walkthrough: 2nd floor towels, tidy main gym floor',
  'Walkthrough: 2nd floor towels, tidy main gym floor',
  21,
  'yes_no',
  '4:00 PM - 5:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4a5941ca-a32c-4d5d-b28d-f318e396f33d (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4a5941ca-a32c-4d5d-b28d-f318e396f33d',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Top off men''s spa water & check spa',
  'Top off men''s spa water & check spa',
  23,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: eb077bed-9a02-48e0-8509-9c9093608836 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'eb077bed-9a02-48e0-8509-9c9093608836',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  '5 PM Reset Rooftop Music to Gym Nu (Spotify) - Thursday',
  '5 PM Reset Rooftop Music to Gym Nu (Spotify) - Thursday',
  25,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d3fd22d5-e68d-4631-8f8c-7d08120ffeb6 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd3fd22d5-e68d-4631-8f8c-7d08120ffeb6',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Walkthrough: tidy gym floor as needed. Restock towels on 2nd floor & cardio room.',
  'Walkthrough: tidy gym floor as needed. Restock towels on 2nd floor & cardio room.',
  27,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 706bc2ad-e18a-48bb-87e3-8b3f1f2af55d (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '706bc2ad-e18a-48bb-87e3-8b3f1f2af55d',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Check rooftop for tidiness',
  'Check rooftop for tidiness',
  28,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3921ac55-4b3a-4ed9-ad79-58b9199e490b (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3921ac55-4b3a-4ed9-ad79-58b9199e490b',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Check Men''s spa after 5:30 rush (restock, spa water refresh, help dry floor as needed, close lockers, put away dirty towels)',
  'Check Men''s spa after 5:30 rush (restock, spa water refresh, help dry floor as needed, close lockers, put away dirty towels)',
  29,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 05a28c8c-4345-4e48-aa7e-78b31d32bc6a (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '05a28c8c-4345-4e48-aa7e-78b31d32bc6a',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Check Women''s spa after 5:30 rush (restock, spa water refresh, close lockers, put away dirty towels)',
  'Check Women''s spa after 5:30 rush (restock, spa water refresh, close lockers, put away dirty towels)',
  30,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 919346d4-3321-4cad-84d9-120ab405c451 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '919346d4-3321-4cad-84d9-120ab405c451',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  '5:50 close cardio room curtains',
  '5:50 close cardio room curtains',
  31,
  'photo',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: cd616ff0-88b8-47cc-9cec-31e01a1f1f95 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'cd616ff0-88b8-47cc-9cec-31e01a1f1f95',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Walkthrough: recovery room (batteries, boots, check bathroom supplies), main gym floor (both sides), stretch area 2',
  'Walkthrough: recovery room (batteries, boots, check bathroom supplies), main gym floor (both sides), stretch area 2',
  33,
  'checkbox',
  '6:00 PM - 7:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 947d704d-8b76-4110-ab26-3fbdb5435370 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '947d704d-8b76-4110-ab26-3fbdb5435370',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Check Men''s Spa – water, towels, floors, showers',
  'Check Men''s Spa – water, towels, floors, showers',
  34,
  'checkbox',
  '6:00 PM - 7:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4b9b46e8-474b-4ec1-920b-5921ab1f02f8 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4b9b46e8-474b-4ec1-920b-5921ab1f02f8',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Check Women''s Spa – water, floors, towels, showers, close lockers',
  'Check Women''s Spa – water, floors, towels, showers, close lockers',
  35,
  'checkbox',
  '6:00 PM - 7:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b97aa4c1-bb38-46be-95c1-81b526c29fab (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b97aa4c1-bb38-46be-95c1-81b526c29fab',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Restock 2nd floor towels & cardio room',
  'Restock 2nd floor towels & cardio room',
  36,
  'checkbox',
  '6:00 PM - 7:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4eb12e2b-3e2e-48b3-89ac-260da4eae5c4 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4eb12e2b-3e2e-48b3-89ac-260da4eae5c4',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  '6 PM Reset Rooftop Music to Gym Nu (Spotify) - Tuesday',
  '6 PM Reset Rooftop Music to Gym Nu (Spotify) - Tuesday',
  37,
  'checkbox',
  '6:00 PM - 7:00 PM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a52b1113-9862-4ef9-b274-a474d5eb5f30 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a52b1113-9862-4ef9-b274-a474d5eb5f30',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Walkthrough',
  'Walkthrough',
  39,
  'checkbox',
  '7:00 PM - 8:00 PM',
  NULL,
  'yellow',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 097d2685-ad2e-4818-89ad-0c87e04b7c92 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '097d2685-ad2e-4818-89ad-0c87e04b7c92',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Check Men''s Spa',
  'Check Men''s Spa',
  40,
  'checkbox',
  '7:00 PM - 8:00 PM',
  NULL,
  'yellow',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e1b133c8-f58a-45a4-be65-10737d7fbeee (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e1b133c8-f58a-45a4-be65-10737d7fbeee',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Check Women''s Spa',
  'Check Women''s Spa',
  41,
  'checkbox',
  '7:00 PM - 8:00 PM',
  NULL,
  'yellow',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4e8e90f7-792e-4349-b700-9d79de95a751 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4e8e90f7-792e-4349-b700-9d79de95a751',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Finish Weekly task if not completed',
  'Finish Weekly task if not completed',
  42,
  'checkbox',
  '7:00 PM - 8:00 PM',
  NULL,
  'yellow',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b84a69db-d622-4838-839a-a836c00c9338 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b84a69db-d622-4838-839a-a836c00c9338',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  '8 PM: Begin Closing Checklist',
  '8 PM: Begin Closing Checklist',
  43,
  'checkbox',
  '8:00 PM - 9:00 PM',
  NULL,
  'blue',
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 269a3a1b-1086-418f-9369-ab7e5d7bfa26 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '269a3a1b-1086-418f-9369-ab7e5d7bfa26',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  '7:00 AM: submit opener checklist & review daily notes',
  '7:00 AM: submit opener checklist & review daily notes',
  0,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6cb3bbbc-23e8-46f7-95e9-930af1d4f125 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6cb3bbbc-23e8-46f7-95e9-930af1d4f125',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Put out IV sign',
  'Put out IV sign',
  3,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2cf17c7c-f043-44f7-a4dd-614d3775ff39 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2cf17c7c-f043-44f7-a4dd-614d3775ff39',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Review appointments, classes, and events for the day',
  'Review appointments, classes, and events for the day',
  4,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 01a36526-0b4c-46e6-aa99-c6229063ba47 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '01a36526-0b4c-46e6-aa99-c6229063ba47',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Walkthrough',
  'Walkthrough',
  6,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6f5e1014-c1ac-4bf2-b135-ef59e62fc1e1 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6f5e1014-c1ac-4bf2-b135-ef59e62fc1e1',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Tidy Stretch Areas & surrounding equipment',
  'Tidy Stretch Areas & surrounding equipment',
  7,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 74724580-07e3-4dca-8895-3c88f0e66b6a (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '74724580-07e3-4dca-8895-3c88f0e66b6a',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Restock towels on 2nd floor',
  'Restock towels on 2nd floor',
  8,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 42c40abb-7d44-4cb9-a3d9-8c6ff79d9c9e (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '42c40abb-7d44-4cb9-a3d9-8c6ff79d9c9e',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Check Men''s Spa - water, towels, squeegee floors if needed',
  'Check Men''s Spa - water, towels, squeegee floors if needed',
  9,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e69ef06d-412f-42f6-8149-f673745acb91 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e69ef06d-412f-42f6-8149-f673745acb91',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  '8:30 AM - turn on Cafe Music',
  '8:30 AM - turn on Cafe Music',
  10,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'red',
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 46fcb5ac-bbd9-4888-a6b0-67f554079336 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '46fcb5ac-bbd9-4888-a6b0-67f554079336',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Check Women''s Spa - spa water, towels, amenities, open shower doors, check toilet paper, check paper towels',
  'Check Women''s Spa - spa water, towels, amenities, open shower doors, check toilet paper, check paper towels',
  13,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 12d79ec8-20aa-4d7f-885f-ebc9ebf27ba2 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '12d79ec8-20aa-4d7f-885f-ebc9ebf27ba2',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Walkthrough',
  'Walkthrough',
  16,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ead8de0b-fbd5-4a04-aed9-e4182c2aad8e (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ead8de0b-fbd5-4a04-aed9-e4182c2aad8e',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Check recovery room for tidiness',
  'Check recovery room for tidiness',
  17,
  'photo',
  '10:00 AM - 11:00 AM',
  NULL,
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 968b8d20-4aa2-4de9-a902-231df04ca429 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '968b8d20-4aa2-4de9-a902-231df04ca429',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Check rooftop for tidiness',
  'Check rooftop for tidiness',
  18,
  'photo',
  '10:00 AM - 11:00 AM',
  NULL,
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0641d4fd-a417-4d04-8e8a-7d22ac647887 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0641d4fd-a417-4d04-8e8a-7d22ac647887',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Check Men''s Spa - water, towels, paper towels and toilet paper, amenities, squeegee floors if needed',
  'Check Men''s Spa - water, towels, paper towels and toilet paper, amenities, squeegee floors if needed',
  19,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 749ce1f2-9c79-48ca-a0ca-0b9533a3ef44 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '749ce1f2-9c79-48ca-a0ca-0b9533a3ef44',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  '4:45 PM – 5:15 Break 2',
  '4:45 PM – 5:15 Break 2',
  24,
  'signature',
  '4:00 PM - 5:00 PM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 949518f8-cbd8-4fe3-bb60-606efd7ec728 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '949518f8-cbd8-4fe3-bb60-606efd7ec728',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Breaks MUST be started BY 11:20 AM at the latest. Avoid break time from 9:45-10:15. Please sign if understood. Signature 1',
  'Breaks MUST be started BY 11:20 AM at the latest. Avoid break time from 9:45-10:15. Please sign if understood. Signature 1',
  1,
  'signature',
  '7:00 AM - 8:00 AM',
  NULL,
  'gray',
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 93bba249-cb05-46ae-9ce9-755c9a6d2f71 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '93bba249-cb05-46ae-9ce9-755c9a6d2f71',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Breaks MUST be started BY 11:20 AM at the latest. Avoid break time from 9:45-10:15. Please sign if understood. Signature 2',
  'Breaks MUST be started BY 11:20 AM at the latest. Avoid break time from 9:45-10:15. Please sign if understood. Signature 2',
  2,
  'signature',
  '7:00 AM - 8:00 AM',
  NULL,
  'gray',
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7f3da03e-8b74-48c7-b713-07d7f8926235 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7f3da03e-8b74-48c7-b713-07d7f8926235',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  '8:40-9:10 AM: Break 1',
  '8:40-9:10 AM: Break 1',
  11,
  'signature',
  '8:00 AM - 9:00 AM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 986ba1cc-3ee8-4beb-bf36-c01da97429c8 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '986ba1cc-3ee8-4beb-bf36-c01da97429c8',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  '9:30-10 AM: Break 2',
  '9:30-10 AM: Break 2',
  14,
  'signature',
  '9:00 AM - 10:00 AM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 35db4a86-a372-444a-9dce-81a65721abc5 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '35db4a86-a372-444a-9dce-81a65721abc5',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Top off women''s spa water & check spa',
  'Top off women''s spa water & check spa',
  22,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4089b0bd-8ffb-4893-83a0-c4d0c1bc58ef (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4089b0bd-8ffb-4893-83a0-c4d0c1bc58ef',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Check Women''s Spa - water, floors, towels, amenities',
  'Check Women''s Spa - water, floors, towels, amenities',
  20,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a786ed36-b462-48bd-b65b-9aea2ba42b7d (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a786ed36-b462-48bd-b65b-9aea2ba42b7d',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  '10:55 AM: Reset high roof music to Gym Nu',
  '10:55 AM: Reset high roof music to Gym Nu',
  21,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e27fd1ef-9151-4801-bd15-747da41b20a5 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e27fd1ef-9151-4801-bd15-747da41b20a5',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Check in everyone signed up for any workshop or saturday social (check events)',
  'Check in everyone signed up for any workshop or saturday social (check events)',
  23,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 657b7f4f-6173-49b5-9f48-828c547e3688 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '657b7f4f-6173-49b5-9f48-828c547e3688',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Walkthrough',
  'Walkthrough',
  24,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: bc7d4278-7f21-4a89-899f-d62c4f42af9e (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'bc7d4278-7f21-4a89-899f-d62c4f42af9e',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Check Men''s Spa - water, towels',
  'Check Men''s Spa - water, towels',
  25,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9bfa3e45-8ef1-4aa7-a131-fe9166cc2890 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9bfa3e45-8ef1-4aa7-a131-fe9166cc2890',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Check Women''s Spa - water, towels',
  'Check Women''s Spa - water, towels',
  26,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


COMMIT;
BEGIN;


-- Item: 63b91f37-cc53-4647-b1a6-b9aa74ee014c (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '63b91f37-cc53-4647-b1a6-b9aa74ee014c',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Walkthrough',
  'Walkthrough',
  28,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8d0cb30d-4977-4ab3-9a0d-9f1cc5501cd3 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8d0cb30d-4977-4ab3-9a0d-9f1cc5501cd3',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Cardio Room Towels',
  'Cardio Room Towels',
  29,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 06fe7687-8639-4725-aca7-467235aa7e43 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '06fe7687-8639-4725-aca7-467235aa7e43',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Check & Tidy Rooftop',
  'Check & Tidy Rooftop',
  30,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8da196ed-172b-4ad0-9c18-ddf9a64e1fca (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8da196ed-172b-4ad0-9c18-ddf9a64e1fca',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Check women''s spa - towels, amenities, general tidying, open closed shower doors',
  'Check women''s spa - towels, amenities, general tidying, open closed shower doors',
  31,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a81df517-864f-46a6-ae73-6b2ac450e370 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a81df517-864f-46a6-ae73-6b2ac450e370',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Check men''s spa - towels, amenities, general tidying, open closed shower doors',
  'Check men''s spa - towels, amenities, general tidying, open closed shower doors',
  33,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: bdafcf06-b45e-4c17-bf0f-fa9248847be1 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'bdafcf06-b45e-4c17-bf0f-fa9248847be1',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Label ALL unlabeled water bottles or other lost and found items and place them in the appropriate lost and found bins',
  'Label ALL unlabeled water bottles or other lost and found items and place them in the appropriate lost and found bins',
  35,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: dff1ffdc-70de-4c3a-8898-7ccfd47da037 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'dff1ffdc-70de-4c3a-8898-7ccfd47da037',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Ensure all items are answered on Daily Notes',
  'Ensure all items are answered on Daily Notes',
  36,
  'employee',
  '12:00 PM - 1:00 PM',
  NULL,
  'gray',
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 03837217-b16f-42cb-97e0-f253c15cacdd (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '03837217-b16f-42cb-97e0-f253c15cacdd',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Review Weekly Updates & Daily Notes',
  'Review Weekly Updates & Daily Notes',
  0,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6aaec6b4-53cc-4943-848c-94d556ac3a6c (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6aaec6b4-53cc-4943-848c-94d556ac3a6c',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Review Upcoming Appointments, Classes, and Timed Tasks',
  'Review Upcoming Appointments, Classes, and Timed Tasks',
  1,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a39c6023-02d9-4229-a4e0-13d1e22b5765 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a39c6023-02d9-4229-a4e0-13d1e22b5765',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Check Men''s spa: showers, amenities, towels (restock when needed), paper towels, and toilet paper',
  'Check Men''s spa: showers, amenities, towels (restock when needed), paper towels, and toilet paper',
  5,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5cd57eec-7a71-441f-9858-d816094a7a9c (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5cd57eec-7a71-441f-9858-d816094a7a9c',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Reset Sauna timer in men''s spa',
  'Reset Sauna timer in men''s spa',
  6,
  'photo',
  '1:00 PM - 2:00 PM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 889c6899-f7be-4acb-a7b6-f071b2202058 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '889c6899-f7be-4acb-a7b6-f071b2202058',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Walkthrough',
  'Walkthrough',
  7,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6a5aeb14-e386-4a2c-b179-563ef90e8470 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6a5aeb14-e386-4a2c-b179-563ef90e8470',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Restock towels on 2nd floor',
  'Restock towels on 2nd floor',
  8,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 580ae792-e318-4d4c-9d86-4693a671bbd8 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '580ae792-e318-4d4c-9d86-4693a671bbd8',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Check Women''s spa: showers, amenities, towels (restock when needed), paper towels, and toilet paper',
  'Check Women''s spa: showers, amenities, towels (restock when needed), paper towels, and toilet paper',
  9,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8305ae84-7781-4835-837f-3d90a18868b6 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8305ae84-7781-4835-837f-3d90a18868b6',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Reset Sauna timer in women''s spa',
  'Reset Sauna timer in women''s spa',
  10,
  'photo',
  '1:00 PM - 2:00 PM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ddad80dd-0411-4be2-abb2-14967338ced5 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ddad80dd-0411-4be2-abb2-14967338ced5',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Walkthrough 2: Cardio room towels, tidy stretch areas, 2nd floor towels',
  'Walkthrough 2: Cardio room towels, tidy stretch areas, 2nd floor towels',
  11,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0a9c6dcd-3358-49a9-a7f6-9fb9cc091b29 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0a9c6dcd-3358-49a9-a7f6-9fb9cc091b29',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Saturday Only: Check pilates room that all supplies are correct (each basket should have: 1 ball, 2 ankle weights, 2 bala hand weights, and light, medium, and heavy bands) (check N/A if Sunday)',
  'Saturday Only: Check pilates room that all supplies are correct (each basket should have: 1 ball, 2 ankle weights, 2 bala hand weights, and light, medium, and heavy bands) (check N/A if Sunday)',
  12,
  'photo',
  '2:00 PM - 3:00 PM',
  NULL,
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ff03d061-51ae-442c-ba1f-4087f8697ade (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ff03d061-51ae-442c-ba1f-4087f8697ade',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Check rooftop & tidy as needed: kettlebells are tidy, weights put away, mats & class equipment are put away',
  'Check rooftop & tidy as needed: kettlebells are tidy, weights put away, mats & class equipment are put away',
  13,
  'photo',
  '2:00 PM - 3:00 PM',
  NULL,
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f3ce3002-49c1-4cf9-8791-170ec46ce20a (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f3ce3002-49c1-4cf9-8791-170ec46ce20a',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Check women''s spa - all',
  'Check women''s spa - all',
  14,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e072054f-222f-41b1-bc61-35f44c6b81d4 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e072054f-222f-41b1-bc61-35f44c6b81d4',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Check men''s spa - all',
  'Check men''s spa - all',
  15,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b6576384-6871-484b-9bd1-5427ea595c9d (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b6576384-6871-484b-9bd1-5427ea595c9d',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Walkthrough 3: 2nd floor towels, tidy main gym floor',
  'Walkthrough 3: 2nd floor towels, tidy main gym floor',
  17,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 92a78806-e4b2-4873-9790-c6d67f49676e (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '92a78806-e4b2-4873-9790-c6d67f49676e',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Check Men & Women''s spas',
  'Check Men & Women''s spas',
  18,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d41d5e5a-ea9c-471c-b72c-43963c5690cb (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd41d5e5a-ea9c-471c-b72c-43963c5690cb',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Walkthrough',
  'Walkthrough',
  19,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a1dbd080-49e1-4cbd-98e9-098444f33e99 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a1dbd080-49e1-4cbd-98e9-098444f33e99',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Check recovery room - ensure boots are tidy',
  'Check recovery room - ensure boots are tidy',
  20,
  'photo',
  '4:00 PM - 5:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 86c76e55-ce61-43da-bfc2-a895d7d30e0b (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '86c76e55-ce61-43da-bfc2-a895d7d30e0b',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Ensure all items in recovery room in need of charging are charging',
  'Ensure all items in recovery room in need of charging are charging',
  21,
  'photo',
  '4:00 PM - 5:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 483710f0-ae59-4791-bdef-5ad96c5baa83 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '483710f0-ae59-4791-bdef-5ad96c5baa83',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Check mezzanine paper towels & toilet paper & restock if needed',
  'Check mezzanine paper towels & toilet paper & restock if needed',
  22,
  'photo',
  '4:00 PM - 5:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8ea3b5bb-13bd-4c27-a3a4-972e2ef600d9 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8ea3b5bb-13bd-4c27-a3a4-972e2ef600d9',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Quick check of spas',
  'Quick check of spas',
  23,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a90ca62a-e888-4f24-99e8-0d759848b6c6 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a90ca62a-e888-4f24-99e8-0d759848b6c6',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Breaks MUST be started BY 5:50 PM at the latest OR you MUST clock out for your shift at 7 PM exactly. Please sign if understood. Signature 1',
  'Breaks MUST be started BY 5:50 PM at the latest OR you MUST clock out for your shift at 7 PM exactly. Please sign if understood. Signature 1',
  2,
  'signature',
  '1:00 PM - 2:00 PM',
  NULL,
  'gray',
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 78bd4990-3493-4baa-ba98-cbce7c2b7216 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '78bd4990-3493-4baa-ba98-cbce7c2b7216',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Breaks MUST be started BY 5:50 PM at the latest OR you MUST clock out for your shift at 7 PM exactly. Please sign if understood. Signature 2',
  'Breaks MUST be started BY 5:50 PM at the latest OR you MUST clock out for your shift at 7 PM exactly. Please sign if understood. Signature 2',
  3,
  'signature',
  '1:00 PM - 2:00 PM',
  NULL,
  'gray',
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f61b613c-ace0-4147-a8a7-9d3b06cc7334 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f61b613c-ace0-4147-a8a7-9d3b06cc7334',
  'a2222222-2222-2222-2222-222222222222',
  'Check that stretch area boxes are tidy',
  'Check that stretch area boxes are tidy',
  12,
  'photo',
  NULL,
  'Closing',
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5fc3c4b5-de6b-4782-9fad-d8ce22d22f79 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5fc3c4b5-de6b-4782-9fad-d8ce22d22f79',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Men''s Spa',
  'Men''s Spa',
  26,
  'short_entry',
  '5:00 PM - 6:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: af602e97-c311-4767-9026-66d470921ba0 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'af602e97-c311-4767-9026-66d470921ba0',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  'Women''s Spa',
  'Women''s Spa',
  27,
  'short_entry',
  '5:00 PM - 6:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9e08f994-032a-40eb-97db-3b7bae3efcc9 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9e08f994-032a-40eb-97db-3b7bae3efcc9',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  '6 PM: Begin Closing Checklist',
  '6 PM: Begin Closing Checklist',
  28,
  'photo',
  '5:00 PM - 6:00 PM',
  NULL,
  'gray',
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b6fc0841-cc67-4290-ad1b-f7cacacd8951 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b6fc0841-cc67-4290-ad1b-f7cacacd8951',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Review upcoming appointments, tours, and tasks for the day',
  'Review upcoming appointments, tours, and tasks for the day',
  5,
  'checkbox',
  '6:00 AM - 7:00 AM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2c306496-920d-443c-82da-31242a841ae1 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2c306496-920d-443c-82da-31242a841ae1',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Review Weekly Updates & Daily Notes. Check emails & arketa inbox',
  'Review Weekly Updates & Daily Notes. Check emails & arketa inbox',
  3,
  'checkbox',
  '1:30 PM - 2:00 PM',
  NULL,
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 49f95afd-d5c1-4e23-9d49-5e6d46496365 (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '49f95afd-d5c1-4e23-9d49-5e6d46496365',
  'a1111111-1111-1111-1111-111111111111',
  'Unlock & Open Patio Doors',
  'Unlock & Open Patio Doors',
  1,
  'checkbox',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2314b921-a6a9-443c-bcc8-1e44e315ff50 (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2314b921-a6a9-443c-bcc8-1e44e315ff50',
  'a1111111-1111-1111-1111-111111111111',
  'Walk Through All Floors to Ensure Tidiness',
  'Walk Through All Floors to Ensure Tidiness',
  2,
  'checkbox',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 72112685-86f5-415a-b42d-d2254d511474 (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '72112685-86f5-415a-b42d-d2254d511474',
  'a1111111-1111-1111-1111-111111111111',
  '5:40 AM: Turn on Ground Floor Studio Heat & set both Thermostats to Max',
  '5:40 AM: Turn on Ground Floor Studio Heat & set both Thermostats to Max',
  3,
  'checkbox',
  NULL,
  'Opening',
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 58f01e33-6198-4848-984b-b9a22c7c7af9 (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '58f01e33-6198-4848-984b-b9a22c7c7af9',
  'a1111111-1111-1111-1111-111111111111',
  '5:45 AM - Check Men''s Sauna is On',
  '5:45 AM - Check Men''s Sauna is On',
  4,
  'checkbox',
  NULL,
  'Opening',
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: cde01e28-3d27-46b8-bfe9-80d27707fc45 (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'cde01e28-3d27-46b8-bfe9-80d27707fc45',
  'a1111111-1111-1111-1111-111111111111',
  '5:45 AM - Check Women''s Sauna is On',
  '5:45 AM - Check Women''s Sauna is On',
  5,
  'checkbox',
  NULL,
  'Opening',
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: bfb8866c-1c06-4699-af08-f1e786657875 (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'bfb8866c-1c06-4699-af08-f1e786657875',
  'a1111111-1111-1111-1111-111111111111',
  'Take a photo of temperature & cleanliness of both women''s cold plunges',
  'Take a photo of temperature & cleanliness of both women''s cold plunges',
  6,
  'photo',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2b2ff514-f120-4cbb-9145-bb463bd95de4 (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2b2ff514-f120-4cbb-9145-bb463bd95de4',
  'a1111111-1111-1111-1111-111111111111',
  'Take a photo of temperature & cleanliness of both men''s cold plunges',
  'Take a photo of temperature & cleanliness of both men''s cold plunges',
  7,
  'photo',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f416c405-9f50-4fe7-bd69-1c21954801ee (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f416c405-9f50-4fe7-bd69-1c21954801ee',
  'a1111111-1111-1111-1111-111111111111',
  'Display Theraguns on Cabinets & Move Charged Compression Boot Batteries',
  'Display Theraguns on Cabinets & Move Charged Compression Boot Batteries',
  9,
  'photo',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: df07f6fc-3abf-4b50-a472-578ecf4db4ec (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'df07f6fc-3abf-4b50-a472-578ecf4db4ec',
  'a1111111-1111-1111-1111-111111111111',
  'Check that HBOT has clean sheets & is set for first appointment',
  'Check that HBOT has clean sheets & is set for first appointment',
  10,
  'checkbox',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0d729822-e9c1-48dd-8b3b-17a12217e750 (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0d729822-e9c1-48dd-8b3b-17a12217e750',
  'a1111111-1111-1111-1111-111111111111',
  'Uncover rooftop equipment and place tarps behind wall',
  'Uncover rooftop equipment and place tarps behind wall',
  11,
  'photo',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a9465b12-dbda-45cf-9ab5-47a9ec33b26b (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a9465b12-dbda-45cf-9ab5-47a9ec33b26b',
  'a1111111-1111-1111-1111-111111111111',
  'Set Out Ipads & Bring Iphone to Desk',
  'Set Out Ipads & Bring Iphone to Desk',
  12,
  'checkbox',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d6db14ca-4599-48ab-9775-244a30f9724e (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd6db14ca-4599-48ab-9775-244a30f9724e',
  'a1111111-1111-1111-1111-111111111111',
  '5:55 AM - Turn on Music in Spa, Main Gym Floor, Lockers',
  '5:55 AM - Turn on Music in Spa, Main Gym Floor, Lockers',
  13,
  'checkbox',
  NULL,
  'Opening',
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3d40b546-aec8-4747-b8b7-b5fc3dac53fc (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3d40b546-aec8-4747-b8b7-b5fc3dac53fc',
  'a1111111-1111-1111-1111-111111111111',
  'Was anything missed during Close?',
  'Was anything missed during Close?',
  14,
  'short_entry',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 16e84ca3-684f-4697-a2cc-19dd5e6dc6fc (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '16e84ca3-684f-4697-a2cc-19dd5e6dc6fc',
  'a2222222-2222-2222-2222-222222222222',
  'Cardio Room & Men''s Spa: close curtains',
  'Cardio Room & Men''s Spa: close curtains',
  1,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a7de450a-9962-42af-9097-d38362c1919a (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a7de450a-9962-42af-9097-d38362c1919a',
  'a2222222-2222-2222-2222-222222222222',
  'Dump men''s spa water and rinse out jug',
  'Dump men''s spa water and rinse out jug',
  2,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d252635e-10ea-4e3d-afba-a0a2c18b1e34 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd252635e-10ea-4e3d-afba-a0a2c18b1e34',
  'a2222222-2222-2222-2222-222222222222',
  'Full stock of towels in cardio room',
  'Full stock of towels in cardio room',
  3,
  'photo',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5dee17c9-22bf-4ade-a188-bd7d556fbbde (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5dee17c9-22bf-4ade-a188-bd7d556fbbde',
  'a2222222-2222-2222-2222-222222222222',
  'Check that all towels (rolled and folded) are fully stocked in Men''s spa',
  'Check that all towels (rolled and folded) are fully stocked in Men''s spa',
  4,
  'photo',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 340893e1-67aa-4170-b44d-f0662d844192 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '340893e1-67aa-4170-b44d-f0662d844192',
  'a2222222-2222-2222-2222-222222222222',
  'Check that men''s vanity is fully stocked-- note if otherwise',
  'Check that men''s vanity is fully stocked-- note if otherwise',
  5,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ba0ad04c-cc1f-444a-9ec5-918d2300cb03 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ba0ad04c-cc1f-444a-9ec5-918d2300cb03',
  'a2222222-2222-2222-2222-222222222222',
  'Turn off men''s sauna at 8:30 PM and ask any lingering members to exit',
  'Turn off men''s sauna at 8:30 PM and ask any lingering members to exit',
  6,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: dbe917ea-6773-4432-b4e4-ad57035f2fbb (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'dbe917ea-6773-4432-b4e4-ad57035f2fbb',
  'a2222222-2222-2222-2222-222222222222',
  'Check all men''s lockers for forgotten items & reset locked lockers',
  'Check all men''s lockers for forgotten items & reset locked lockers',
  7,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3bdd55f3-8263-44b5-a607-77f2739ed305 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3bdd55f3-8263-44b5-a607-77f2739ed305',
  'a2222222-2222-2222-2222-222222222222',
  'Main Gym Floor Tasks:',
  'Main Gym Floor Tasks:',
  8,
  'checkbox',
  NULL,
  'Closing',
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6e14eb00-094e-4d57-b3d9-502feefb6fb9 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6e14eb00-094e-4d57-b3d9-502feefb6fb9',
  'a2222222-2222-2222-2222-222222222222',
  'Full stock of towels on second floor shelf',
  'Full stock of towels on second floor shelf',
  9,
  'photo',
  NULL,
  'Closing',
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3c3cc811-8cd5-4b8c-9e87-bc5c0452f408 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3c3cc811-8cd5-4b8c-9e87-bc5c0452f408',
  'a2222222-2222-2222-2222-222222222222',
  'Check theraguns & other equipment in stretch area 1 are charging',
  'Check theraguns & other equipment in stretch area 1 are charging',
  10,
  'photo',
  NULL,
  'Closing',
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b870ab70-b676-47e2-94d5-72fa55faebe8 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b870ab70-b676-47e2-94d5-72fa55faebe8',
  'a2222222-2222-2222-2222-222222222222',
  'Check theraguns & other equipment in stretch area 2 are charging',
  'Check theraguns & other equipment in stretch area 2 are charging',
  11,
  'photo',
  NULL,
  'Closing',
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 57e2b4ee-8635-4294-8aa4-a1334d14786b (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '57e2b4ee-8635-4294-8aa4-a1334d14786b',
  'a2222222-2222-2222-2222-222222222222',
  'Women''s Spa Tasks:',
  'Women''s Spa Tasks:',
  13,
  'checkbox',
  NULL,
  'Closing',
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e680cf2f-efd1-4891-8221-1aafa2dde4f1 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e680cf2f-efd1-4891-8221-1aafa2dde4f1',
  'a2222222-2222-2222-2222-222222222222',
  'Dump women''s spa water and rinse out jug',
  'Dump women''s spa water and rinse out jug',
  14,
  'checkbox',
  NULL,
  'Closing',
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4aace15c-a9df-422e-8f8d-c780d08df744 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4aace15c-a9df-422e-8f8d-c780d08df744',
  'a2222222-2222-2222-2222-222222222222',
  'Check that all towels are fully stocked in Women''s spa',
  'Check that all towels are fully stocked in Women''s spa',
  15,
  'photo',
  NULL,
  'Closing',
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: bfc578c5-b77e-497a-b250-c019c2490604 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'bfc578c5-b77e-497a-b250-c019c2490604',
  'a2222222-2222-2222-2222-222222222222',
  'Check all women''s lockers for forgotten items & reset locked lockers',
  'Check all women''s lockers for forgotten items & reset locked lockers',
  17,
  'checkbox',
  NULL,
  'Closing',
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7dbd7946-51df-46f0-aa79-dc27b886fbd7 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7dbd7946-51df-46f0-aa79-dc27b886fbd7',
  'a2222222-2222-2222-2222-222222222222',
  'Check that both vanities in women''s spa are fully stocked',
  'Check that both vanities in women''s spa are fully stocked',
  18,
  'checkbox',
  NULL,
  'Closing',
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e7b0939e-457e-42fe-8f93-d4ecc7e2b58e (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e7b0939e-457e-42fe-8f93-d4ecc7e2b58e',
  'a2222222-2222-2222-2222-222222222222',
  'Ensure BOTH thermostats are turned off in the heated room (including AC)',
  'Ensure BOTH thermostats are turned off in the heated room (including AC)',
  19,
  'checkbox',
  NULL,
  'Closing',
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: db531c1d-dbdd-4e30-b527-7c5d9a59495c (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'db531c1d-dbdd-4e30-b527-7c5d9a59495c',
  'a2222222-2222-2222-2222-222222222222',
  'Recovery Room Tasks:',
  'Recovery Room Tasks:',
  20,
  'checkbox',
  NULL,
  'Closing',
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 360a5d18-9dcf-4a47-b9c6-9824dd542051 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '360a5d18-9dcf-4a47-b9c6-9824dd542051',
  'a2222222-2222-2222-2222-222222222222',
  'Set batteries, theraguns, and black massage wraps on chargers',
  'Set batteries, theraguns, and black massage wraps on chargers',
  21,
  'photo',
  NULL,
  'Closing',
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ebf5f29c-c895-4281-88c8-b2b491b466e6 (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ebf5f29c-c895-4281-88c8-b2b491b466e6',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Breaks MUST be started BY 6:20 PM at the latest. Do not break while spa attendants are breaking (10 min overlap okay). Please sign if understood. Signature 1',
  'Breaks MUST be started BY 6:20 PM at the latest. Do not break while spa attendants are breaking (10 min overlap okay). Please sign if understood. Signature 1',
  0,
  'signature',
  '1:30 PM - 2:00 PM',
  NULL,
  'orange',
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0ce3fc1c-bf2f-4cd2-a573-7d385c77a8ca (Template: f6d03214-8486-4339-a5bc-97535d2fa0ee)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0ce3fc1c-bf2f-4cd2-a573-7d385c77a8ca',
  'f6d03214-8486-4339-a5bc-97535d2fa0ee',
  'Breaks MUST be started BY 6:20 PM at the latest. Do not break while spa attendants are breaking (10 min overlap okay). Please sign if understood. Signature 2',
  'Breaks MUST be started BY 6:20 PM at the latest. Do not break while spa attendants are breaking (10 min overlap okay). Please sign if understood. Signature 2',
  1,
  'signature',
  '1:30 PM - 2:00 PM',
  NULL,
  'orange',
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b06dc77d-080f-4548-bd01-60307e7657f3 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b06dc77d-080f-4548-bd01-60307e7657f3',
  'a2222222-2222-2222-2222-222222222222',
  'Ensure compression boots are tidy',
  'Ensure compression boots are tidy',
  22,
  'checkbox',
  NULL,
  'Closing',
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a5d41bac-25bc-4059-b4c3-c5164ef127fc (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a5d41bac-25bc-4059-b4c3-c5164ef127fc',
  'a2222222-2222-2222-2222-222222222222',
  'Final 10 Minutes:',
  'Final 10 Minutes:',
  23,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c42da3be-bb38-4215-b473-f860b1f9767c (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c42da3be-bb38-4215-b473-f860b1f9767c',
  'a2222222-2222-2222-2222-222222222222',
  'Close & lock all patio doors',
  'Close & lock all patio doors',
  24,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0aebd813-f648-4f84-95b2-5f5c4938dbc0 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0aebd813-f648-4f84-95b2-5f5c4938dbc0',
  'a2222222-2222-2222-2222-222222222222',
  'Ensure ALL members have left',
  'Ensure ALL members have left',
  25,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: fc5c6a0f-b738-4970-a90d-ba75910792da (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'fc5c6a0f-b738-4970-a90d-ba75910792da',
  'a2222222-2222-2222-2222-222222222222',
  'Turn off Music at 8:50',
  'Turn off Music at 8:50',
  26,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7e2add6a-e4b8-493c-9749-f395b0a72d91 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7e2add6a-e4b8-493c-9749-f395b0a72d91',
  'a2222222-2222-2222-2222-222222222222',
  'Place Ipads & phone on chargers',
  'Place Ipads & phone on chargers',
  27,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7b660a46-e599-4d80-9f0b-19179cd2b4f4 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7b660a46-e599-4d80-9f0b-19179cd2b4f4',
  'a2222222-2222-2222-2222-222222222222',
  'Lock the front door gate upon exit - important!!',
  'Lock the front door gate upon exit - important!!',
  28,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: eea418fc-c723-4275-92ff-de85c256a89d (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'eea418fc-c723-4275-92ff-de85c256a89d',
  'a1111111-1111-1111-1111-111111111111',
  'Walk Through All Floors to Ensure Tidiness',
  'Walk Through All Floors to Ensure Tidiness',
  1,
  'checkbox',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c99f460b-6cba-4225-8869-5efd2a266f7c (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c99f460b-6cba-4225-8869-5efd2a266f7c',
  'a1111111-1111-1111-1111-111111111111',
  'Unlock & Open Patio Doors',
  'Unlock & Open Patio Doors',
  2,
  'checkbox',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a2716817-6caa-4f9d-b03c-cb8e20919886 (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a2716817-6caa-4f9d-b03c-cb8e20919886',
  'a1111111-1111-1111-1111-111111111111',
  '6:40 AM - Turn on Ground Floor Studio Heat & set both Thermostats to Max',
  '6:40 AM - Turn on Ground Floor Studio Heat & set both Thermostats to Max',
  3,
  'checkbox',
  NULL,
  'Opening',
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3115d65d-0df0-4564-aba3-871b19db556b (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3115d65d-0df0-4564-aba3-871b19db556b',
  'a1111111-1111-1111-1111-111111111111',
  '6:45 AM - Check Men''s Sauna is On',
  '6:45 AM - Check Men''s Sauna is On',
  4,
  'checkbox',
  NULL,
  'Opening',
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 374f3d7a-aff4-4ba9-ba60-4002c0b5e712 (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '374f3d7a-aff4-4ba9-ba60-4002c0b5e712',
  'a1111111-1111-1111-1111-111111111111',
  '6:45 AM - Check Women''s Sauna is On',
  '6:45 AM - Check Women''s Sauna is On',
  5,
  'checkbox',
  NULL,
  'Opening',
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d7dc756d-b478-4143-93eb-33389969d59e (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd7dc756d-b478-4143-93eb-33389969d59e',
  'a1111111-1111-1111-1111-111111111111',
  'Display Theraguns on Cabinets & Move Charged Compression Boot Batteries',
  'Display Theraguns on Cabinets & Move Charged Compression Boot Batteries',
  9,
  'photo',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ec898016-4d94-4de1-8a47-ab15b6211b4b (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ec898016-4d94-4de1-8a47-ab15b6211b4b',
  'a1111111-1111-1111-1111-111111111111',
  'Check that HBOT has clean sheets & is set for first appointment',
  'Check that HBOT has clean sheets & is set for first appointment',
  10,
  'checkbox',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f26e05a6-a225-446c-b85a-ba8548dcf810 (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f26e05a6-a225-446c-b85a-ba8548dcf810',
  'a1111111-1111-1111-1111-111111111111',
  '6:55 AM - Set Out Ipads & Bring Iphone to Desk. Check volume is on',
  '6:55 AM - Set Out Ipads & Bring Iphone to Desk. Check volume is on',
  12,
  'checkbox',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 52993cd3-940c-4565-8e8d-e4e5ff18d785 (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '52993cd3-940c-4565-8e8d-e4e5ff18d785',
  'a1111111-1111-1111-1111-111111111111',
  '6:55 AM - Turn on Music in Spa, Main Gym Floor, Lockers',
  '6:55 AM - Turn on Music in Spa, Main Gym Floor, Lockers',
  13,
  'checkbox',
  NULL,
  'Opening',
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4a713aab-8484-4a8f-a228-82544c995e9f (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4a713aab-8484-4a8f-a228-82544c995e9f',
  'a1111111-1111-1111-1111-111111111111',
  'Was anything missed during Close?',
  'Was anything missed during Close?',
  14,
  'short_entry',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 458c8373-8297-4116-9076-34ea641ff235 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '458c8373-8297-4116-9076-34ea641ff235',
  'a2222222-2222-2222-2222-222222222222',
  'Cardio Room & Men''s Spa: close curtains',
  'Cardio Room & Men''s Spa: close curtains',
  1,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2bad2f92-db8b-4149-a68a-cc2a6bbf0dca (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2bad2f92-db8b-4149-a68a-cc2a6bbf0dca',
  'a2222222-2222-2222-2222-222222222222',
  'Dump men''s spa water and rinse out jug',
  'Dump men''s spa water and rinse out jug',
  2,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f355c350-84fc-4084-8ea9-d8752cad8793 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f355c350-84fc-4084-8ea9-d8752cad8793',
  'a2222222-2222-2222-2222-222222222222',
  'Full stock of towels in cardio room',
  'Full stock of towels in cardio room',
  3,
  'photo',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 816a6707-c309-4e48-8b2b-612b29f2ee62 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '816a6707-c309-4e48-8b2b-612b29f2ee62',
  'a2222222-2222-2222-2222-222222222222',
  'Check that all towels (rolled and folded) are fully stocked in Men''s spa',
  'Check that all towels (rolled and folded) are fully stocked in Men''s spa',
  4,
  'photo',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9f07ef83-b80a-475c-bdfb-1a955d3a9c7c (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9f07ef83-b80a-475c-bdfb-1a955d3a9c7c',
  'a2222222-2222-2222-2222-222222222222',
  'Check that men''s vanity is fully stocked-- note if otherwise',
  'Check that men''s vanity is fully stocked-- note if otherwise',
  5,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e01d18e0-c029-4503-8599-f7949987d08e (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e01d18e0-c029-4503-8599-f7949987d08e',
  'a2222222-2222-2222-2222-222222222222',
  'Turn off men''s sauna at 6:30 PM and ask any lingering members to exit',
  'Turn off men''s sauna at 6:30 PM and ask any lingering members to exit',
  6,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 57e30343-729b-4521-862d-416f2a20bf7a (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '57e30343-729b-4521-862d-416f2a20bf7a',
  'a2222222-2222-2222-2222-222222222222',
  'Check all men''s lockers for forgotten items & reset locked lockers',
  'Check all men''s lockers for forgotten items & reset locked lockers',
  7,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5f5a9b9e-94a3-4a44-98e8-aab6bc87e66f (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5f5a9b9e-94a3-4a44-98e8-aab6bc87e66f',
  'a2222222-2222-2222-2222-222222222222',
  'Main Gym Floor Tasks:',
  'Main Gym Floor Tasks:',
  8,
  'checkbox',
  NULL,
  'Closing',
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: bdb546d9-1a4e-479a-b8e2-7e05e1373725 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'bdb546d9-1a4e-479a-b8e2-7e05e1373725',
  'a2222222-2222-2222-2222-222222222222',
  'Full stock of towels on second floor shelf',
  'Full stock of towels on second floor shelf',
  9,
  'photo',
  NULL,
  'Closing',
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 42725de7-ec7f-47c0-bdca-3ed2f40a475e (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '42725de7-ec7f-47c0-bdca-3ed2f40a475e',
  'a2222222-2222-2222-2222-222222222222',
  'Check theraguns & other equipment in stretch area 1 are charging',
  'Check theraguns & other equipment in stretch area 1 are charging',
  10,
  'photo',
  NULL,
  'Closing',
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: cc90c644-e793-4051-984a-003236bea723 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'cc90c644-e793-4051-984a-003236bea723',
  'a2222222-2222-2222-2222-222222222222',
  'Check theraguns & other equipment in stretch area 2 are charging',
  'Check theraguns & other equipment in stretch area 2 are charging',
  11,
  'photo',
  NULL,
  'Closing',
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4e54b4b6-05ac-47fd-965c-720a0d2d5f02 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4e54b4b6-05ac-47fd-965c-720a0d2d5f02',
  'a2222222-2222-2222-2222-222222222222',
  'Check that stretch area boxes are tidy',
  'Check that stretch area boxes are tidy',
  12,
  'checkbox',
  NULL,
  'Closing',
  'orange',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 741da869-4052-41cb-b301-a49da3c9d8d8 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '741da869-4052-41cb-b301-a49da3c9d8d8',
  'a2222222-2222-2222-2222-222222222222',
  'Women''s Spa Tasks:',
  'Women''s Spa Tasks:',
  13,
  'checkbox',
  NULL,
  'Closing',
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 83a40e04-3e20-4909-a579-bca4b47e504d (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '83a40e04-3e20-4909-a579-bca4b47e504d',
  'a2222222-2222-2222-2222-222222222222',
  'Dump women''s spa water and rinse out jug',
  'Dump women''s spa water and rinse out jug',
  14,
  'checkbox',
  NULL,
  'Closing',
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


COMMIT;
BEGIN;


-- Item: ee7ee6bc-3281-4367-84df-e46f01cf18cc (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ee7ee6bc-3281-4367-84df-e46f01cf18cc',
  'a2222222-2222-2222-2222-222222222222',
  'Check that all towels are fully stocked in Women''s spa',
  'Check that all towels are fully stocked in Women''s spa',
  15,
  'photo',
  NULL,
  'Closing',
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ee140d76-7bb7-408e-a71a-14aac52747bc (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ee140d76-7bb7-408e-a71a-14aac52747bc',
  'a2222222-2222-2222-2222-222222222222',
  'Turn off women''s sauna at 6:30 PM and ask any lingering members to exit',
  'Turn off women''s sauna at 6:30 PM and ask any lingering members to exit',
  16,
  'checkbox',
  NULL,
  'Closing',
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1835adaa-10e2-4417-a832-7be6fa74e529 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1835adaa-10e2-4417-a832-7be6fa74e529',
  'a2222222-2222-2222-2222-222222222222',
  'Check all women''s lockers for forgotten items & reset locked lockers',
  'Check all women''s lockers for forgotten items & reset locked lockers',
  17,
  'checkbox',
  NULL,
  'Closing',
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ec0d4bba-f9c3-424e-83bd-06657af53f30 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ec0d4bba-f9c3-424e-83bd-06657af53f30',
  'a2222222-2222-2222-2222-222222222222',
  'Check that both vanities in women''s spa are fully stocked',
  'Check that both vanities in women''s spa are fully stocked',
  18,
  'checkbox',
  NULL,
  'Closing',
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f4527e6f-0ffa-4a2b-ba46-1c4f0b0236c7 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f4527e6f-0ffa-4a2b-ba46-1c4f0b0236c7',
  'a2222222-2222-2222-2222-222222222222',
  'Ensure BOTH thermostats are turned off in the heated room (including AC)',
  'Ensure BOTH thermostats are turned off in the heated room (including AC)',
  19,
  'checkbox',
  NULL,
  'Closing',
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e9e210ee-b98a-4463-8584-f3aa920de972 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e9e210ee-b98a-4463-8584-f3aa920de972',
  'a2222222-2222-2222-2222-222222222222',
  'Recovery Room Tasks:',
  'Recovery Room Tasks:',
  20,
  'checkbox',
  NULL,
  'Closing',
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 098d589e-6ad4-4229-9769-6fc8e0792065 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '098d589e-6ad4-4229-9769-6fc8e0792065',
  'a2222222-2222-2222-2222-222222222222',
  'Set batteries, theraguns, and black massage wraps on chargers',
  'Set batteries, theraguns, and black massage wraps on chargers',
  21,
  'photo',
  NULL,
  'Closing',
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 77621d4d-ef93-41c9-8be0-7fa061e2de19 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '77621d4d-ef93-41c9-8be0-7fa061e2de19',
  'a2222222-2222-2222-2222-222222222222',
  'Ensure compression boots are tidy',
  'Ensure compression boots are tidy',
  22,
  'checkbox',
  NULL,
  'Closing',
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d4e85b84-5ed0-4809-8589-df3391e19c3e (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd4e85b84-5ed0-4809-8589-df3391e19c3e',
  'a2222222-2222-2222-2222-222222222222',
  'Final 10 Minutes:',
  'Final 10 Minutes:',
  23,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: cbb257b0-86a0-468d-9033-7e37cec60eec (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'cbb257b0-86a0-468d-9033-7e37cec60eec',
  'a2222222-2222-2222-2222-222222222222',
  'Close & lock all patio doors',
  'Close & lock all patio doors',
  24,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0b3d299d-2600-444a-ba07-32fed925c4a9 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0b3d299d-2600-444a-ba07-32fed925c4a9',
  'a2222222-2222-2222-2222-222222222222',
  'Ensure ALL members have left',
  'Ensure ALL members have left',
  25,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 459a5592-80cf-4f73-897b-df72f2d7f1cf (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '459a5592-80cf-4f73-897b-df72f2d7f1cf',
  'a2222222-2222-2222-2222-222222222222',
  'Turn off Music at 6:50',
  'Turn off Music at 6:50',
  26,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c3f86d6a-3173-4887-b90d-a5605ab59cce (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c3f86d6a-3173-4887-b90d-a5605ab59cce',
  'a2222222-2222-2222-2222-222222222222',
  'Place Ipads & phone on chargers',
  'Place Ipads & phone on chargers',
  27,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5cdb0183-0edf-44f6-96f3-b8eaf447a3a8 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5cdb0183-0edf-44f6-96f3-b8eaf447a3a8',
  'a2222222-2222-2222-2222-222222222222',
  'Lock the front door gate upon exit - important!!',
  'Lock the front door gate upon exit - important!!',
  28,
  'checkbox',
  NULL,
  'Closing',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9fdc650c-40c0-46d6-b61f-e561a71d8fbc (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9fdc650c-40c0-46d6-b61f-e561a71d8fbc',
  'a1111111-1111-1111-1111-111111111111',
  'Check temperature & cleanliness of men''s cold tubs',
  'Check temperature & cleanliness of men''s cold tubs',
  7,
  'short_entry',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2cf13887-3257-4222-8334-ac9ebd423b7d (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2cf13887-3257-4222-8334-ac9ebd423b7d',
  'a1111111-1111-1111-1111-111111111111',
  'Set Up Spa Water in Men & Women''s',
  'Set Up Spa Water in Men & Women''s',
  8,
  'checkbox',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ef7e256f-20cc-4e4a-8389-0ff4d885eedd (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ef7e256f-20cc-4e4a-8389-0ff4d885eedd',
  'a1111111-1111-1111-1111-111111111111',
  'Uncover rooftop equipment and place tarps behind wall',
  'Uncover rooftop equipment and place tarps behind wall',
  11,
  'checkbox',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4975d379-a496-46b4-b8a6-f909fe9b9368 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4975d379-a496-46b4-b8a6-f909fe9b9368',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  '8:50 Reset Rooftop Music to Gym Nu (Spotify) - Friday',
  '8:50 Reset Rooftop Music to Gym Nu (Spotify) - Friday',
  21,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5cb1a36f-5235-485c-90f5-b31f08ccb549 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5cb1a36f-5235-485c-90f5-b31f08ccb549',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  '9:00 AM – Reset Rooftop Music to HUME Gym Nu -Monday, Wednesday',
  '9:00 AM – Reset Rooftop Music to HUME Gym Nu -Monday, Wednesday',
  23,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a280741b-d42d-4b7b-a449-19c7ec5f1c94 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a280741b-d42d-4b7b-a449-19c7ec5f1c94',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  '10:25: Reset Rooftop Music to HUME Gym Nu -Tuesday, Thursday',
  '10:25: Reset Rooftop Music to HUME Gym Nu -Tuesday, Thursday',
  33,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d51e2449-e09f-4257-b63c-a796d238b5b2 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd51e2449-e09f-4257-b63c-a796d238b5b2',
  'a2222222-2222-2222-2222-222222222222',
  'Turn off women''s sauna at 8:45 PM and ask any lingering members to exit',
  'Turn off women''s sauna at 8:45 PM and ask any lingering members to exit',
  16,
  'checkbox',
  NULL,
  'Closing',
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 82722b17-061c-47eb-96c9-de9e1c121b92 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '82722b17-061c-47eb-96c9-de9e1c121b92',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  '3:00 - 3:30 PM: Break 1 (unless you are clocking out at 7 PM SHARP)',
  '3:00 - 3:30 PM: Break 1 (unless you are clocking out at 7 PM SHARP)',
  16,
  'signature',
  '3:00 PM - 4:00 PM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9b2b5a6d-4766-4d71-9d41-564bf43d9326 (Template: 36b5dc1d-67a7-4a10-9740-a2ac7395f3d6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9b2b5a6d-4766-4d71-9d41-564bf43d9326',
  '36b5dc1d-67a7-4a10-9740-a2ac7395f3d6',
  '4:45 PM - 5:15 Break 2 (Unless you are clocking out at 7 PM SHARP)',
  '4:45 PM - 5:15 Break 2 (Unless you are clocking out at 7 PM SHARP)',
  24,
  'signature',
  '4:00 PM - 5:00 PM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d68ebe28-fb62-46b8-8126-c3192fc5180f (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd68ebe28-fb62-46b8-8126-c3192fc5180f',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'OPENING CHECKLIST:',
  'OPENING CHECKLIST:',
  1,
  'header',
  NULL,
  'Opening',
  NULL,
  NULL,
  false,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 13a6b01e-e39a-4b2d-9224-836f0ee728c3 (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '13a6b01e-e39a-4b2d-9224-836f0ee728c3',
  'a1111111-1111-1111-1111-111111111111',
  'Check temperature & cleanliness of women''s cold tubs',
  'Check temperature & cleanliness of women''s cold tubs',
  6,
  'short_entry',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d0966954-631d-4aaf-8a06-39823bb23fea (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd0966954-631d-4aaf-8a06-39823bb23fea',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'DAILY TASKS - To be completed throughout shift',
  'DAILY TASKS - To be completed throughout shift',
  16,
  'header',
  NULL,
  'Mid-Shift',
  NULL,
  NULL,
  false,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 81bcf31d-9295-4cb8-8508-7339cd2cac08 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '81bcf31d-9295-4cb8-8508-7339cd2cac08',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'CLOSING CHECKLIST',
  'CLOSING CHECKLIST',
  31,
  'header',
  NULL,
  'Closing',
  NULL,
  NULL,
  false,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8898ef76-1690-4913-b8e5-10a159037822 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8898ef76-1690-4913-b8e5-10a159037822',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Proof Entire Cafe',
  'Proof Entire Cafe',
  61,
  'signature',
  '7:00 AM - 8:00 AM',
  'Opening',
  'red',
  'Re-align tables, put wobble wedges under any necessary, wipe all surfaces with disinfectant',
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 50438eee-8725-4993-baf1-81bfbc43b61f (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '50438eee-8725-4993-baf1-81bfbc43b61f',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Restock medium towels on main gym floor.',
  'Restock medium towels on main gym floor.',
  3,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Reponer toallas medianas en el piso principal del gimnasio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4f92ee4f-cc51-41f5-80e8-1bb2261df61e (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4f92ee4f-cc51-41f5-80e8-1bb2261df61e',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Restock towels as needed in spa.',
  'Restock towels as needed in spa.',
  4,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Reponer toallas según sea necesario en el spa.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1d265e80-94ea-40e8-b577-b36eefdd379a (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1d265e80-94ea-40e8-b577-b36eefdd379a',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Wipe down vanity counters & restock as needed.',
  'Wipe down vanity counters & restock as needed.',
  5,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Limpia los tocadores y repón suministros.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c628b408-1bb3-4a8a-acff-c1d14355040f (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c628b408-1bb3-4a8a-acff-c1d14355040f',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Cold plunge: clean debris, ensure water is clear/cold/jets working. Add ice if needed. 45°F left / 55°F right.',
  'Cold plunge: clean debris, ensure water is clear/cold/jets working. Add ice if needed. 45°F left / 55°F right.',
  6,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'blue',
  'Tinas frías: quita residuos, agua limpia/fría/chorros funcionando. 45°F izquierda / 55°F derecha.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: be990d4a-3d54-4ea7-8616-9127ffe7113e (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'be990d4a-3d54-4ea7-8616-9127ffe7113e',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Refill toilet paper, napkins, and water cups.',
  'Refill toilet paper, napkins, and water cups.',
  7,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'blue',
  'Reponer papel higiénico, servilletas y vasos de agua.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c4b61e76-efee-47ab-97e4-fc8afeb4aed3 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c4b61e76-efee-47ab-97e4-fc8afeb4aed3',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Check cleanliness of toilets — clean as needed.',
  'Check cleanliness of toilets — clean as needed.',
  8,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'blue',
  'Revisa la limpieza de los baños y limpia si es necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8a679c4e-94eb-4f6d-9ca9-8f88f3ef21c4 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8a679c4e-94eb-4f6d-9ca9-8f88f3ef21c4',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Dry floors as needed.',
  'Dry floors as needed.',
  9,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'blue',
  'Seca los pisos según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 67621590-1e2a-4b0b-90be-b7298c1fe795 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '67621590-1e2a-4b0b-90be-b7298c1fe795',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Wipe down all countertop surfaces on both sides of main gym floor.',
  'Wipe down all countertop surfaces on both sides of main gym floor.',
  10,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'blue',
  'Limpia todas las encimeras a ambos lados del gimnasio principal.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1e4a79f4-c700-439b-aa74-0987d231f4a1 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1e4a79f4-c700-439b-aa74-0987d231f4a1',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Complete Weekly Task according to the day.',
  'Complete Weekly Task according to the day.',
  11,
  'multiple_choice',
  '4:00 PM - 5:00 PM',
  NULL,
  'orange',
  'Completa la tarea semanal según el día.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: bf46425c-c99e-4337-b1ee-b8b28bea5404 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'bf46425c-c99e-4337-b1ee-b8b28bea5404',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Mop locker room floors as needed.',
  'Mop locker room floors as needed.',
  12,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'orange',
  'Trapea los pisos de los vestidores según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9ff32f6e-8740-44e1-b685-a7a7ad0150df (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9ff32f6e-8740-44e1-b685-a7a7ad0150df',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Recurring tasks: dry floors, restock towels & products, check showers, collect dirty towels, close lockers, tidy vanities, top off spa water.',
  'Recurring tasks: dry floors, restock towels & products, check showers, collect dirty towels, close lockers, tidy vanities, top off spa water.',
  13,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'orange',
  'Tareas recurrentes: seca pisos, repón toallas y productos, revisa duchas, recoge toallas sucias, cierra casilleros, ordena tocadores, rellena agua del spa.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 92b4555c-2172-4313-a974-963646c7d24d (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '92b4555c-2172-4313-a974-963646c7d24d',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Stock all amenities: razors, underwear, q-tips, cotton pads, tampons, pads, hair ties.',
  'Stock all amenities: razors, underwear, q-tips, cotton pads, tampons, pads, hair ties.',
  14,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'orange',
  'Abastece todos los artículos: rastrillos, ropa interior desechable, cotonetes, algodones, tampones, toallas femeninas, ligas.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 11279c9d-588c-4b73-984f-9e81fe18f2d6 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '11279c9d-588c-4b73-984f-9e81fe18f2d6',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  '4 PM: Place dirty towel bin in elevator; retrieve clean towels and restock spa',
  '4 PM: Place dirty towel bin in elevator; retrieve clean towels and restock spa',
  15,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'red',
  '4 PM: Coloca bote de toallas sucias en el elevador; retira bote con toallas limpias y reabastece el spa.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: da0b1ee9-186a-4a1f-88bf-3159631febf8 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'da0b1ee9-186a-4a1f-88bf-3159631febf8',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Take out trash if needed.',
  'Take out trash if needed.',
  16,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'orange',
  'Saca la basura si es necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d525ef3f-7376-41b4-9d97-8b0ef2b42e0c (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd525ef3f-7376-41b4-9d97-8b0ef2b42e0c',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Clean cold tub filter & use the skimmer for debris.',
  'Clean cold tub filter & use the skimmer for debris.',
  17,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'orange',
  'Limpia el filtro de la tina fría y usa el colador para quitar residuos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: cd3b594f-2194-4e0f-8864-9dc276965fc2 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'cd3b594f-2194-4e0f-8864-9dc276965fc2',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'BREAK: 4:20–4:50 PM. Break MUST be taken before 5 PM, no exceptions.',
  'BREAK: 4:20–4:50 PM. Break MUST be taken before 5 PM, no exceptions.',
  18,
  'signature',
  '4:20 PM - 5:00 PM',
  NULL,
  'red',
  'DESCANSO: 4:20–4:50 PM. El descanso DEBE tomarse antes de las 5 PM.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 89077036-c3e8-4623-bfb3-bd6aed996487 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '89077036-c3e8-4623-bfb3-bd6aed996487',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  '5 PM: Place dirty towel bin in elevator; retrieve clean towels and restock spa',
  '5 PM: Place dirty towel bin in elevator; retrieve clean towels and restock spa',
  19,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'red',
  '5 PM: Coloca bote de toallas sucias en el elevador; retira bote con toallas limpias y reabastece el spa.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 489df9d6-1f10-41c7-a8bd-388d40e817fa (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '489df9d6-1f10-41c7-a8bd-388d40e817fa',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Recurring tasks: dry floors, restock towels, check showers, collect dirty towels, close lockers, tidy vanities, top off spa water.',
  'Recurring tasks: dry floors, restock towels, check showers, collect dirty towels, close lockers, tidy vanities, top off spa water.',
  20,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'blue',
  'Tareas recurrentes: seca pisos, repón toallas, revisa duchas, recoge toallas sucias, cierra casilleros, ordena tocadores y mostradores.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 96fb310c-6813-44c4-b5b6-097949fb1046 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '96fb310c-6813-44c4-b5b6-097949fb1046',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Clean cold tub filter & use the skimmer for debris.',
  'Clean cold tub filter & use the skimmer for debris.',
  21,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'blue',
  'Limpia el filtro de la tina fría y usa el colador para quitar residuos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1ca81114-8f08-45aa-ae18-631bcf38a94e (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1ca81114-8f08-45aa-ae18-631bcf38a94e',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Take out spa trash.',
  'Take out spa trash.',
  22,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'blue',
  'Saca la basura del spa.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 417b3bb7-2040-4cd6-b2b2-c251b3003179 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '417b3bb7-2040-4cd6-b2b2-c251b3003179',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  '6 PM: Place dirty towel bin in elevator; retrieve clean towels and restock spa',
  '6 PM: Place dirty towel bin in elevator; retrieve clean towels and restock spa',
  23,
  'checkbox',
  '6:00 PM - 7:00 PM',
  NULL,
  'red',
  '6 PM: Coloca bote de toallas sucias en el elevador; retira bote con toallas limpias y reabastece el spa.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a169968f-dff9-4d91-a95f-e191ce7332bd (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a169968f-dff9-4d91-a95f-e191ce7332bd',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Complete recurring tasks as needed.',
  'Complete recurring tasks as needed.',
  24,
  'checkbox',
  '6:00 PM - 7:00 PM',
  NULL,
  'green',
  'Haz las tareas recurrentes según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: fbe2c4fe-1ec0-441b-bdc4-c71d3d704d6d (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'fbe2c4fe-1ec0-441b-bdc4-c71d3d704d6d',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Wipe sauna & steam room doors for fingerprints.',
  'Wipe sauna & steam room doors for fingerprints.',
  25,
  'checkbox',
  '6:00 PM - 7:00 PM',
  NULL,
  'green',
  'Limpia las puertas de la sauna y del vapor para quitar huellas.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9b48fc9b-6947-4fe7-843e-cbde75ea1557 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9b48fc9b-6947-4fe7-843e-cbde75ea1557',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Mop locker rooms.',
  'Mop locker rooms.',
  39,
  'checkbox',
  '8:30 PM - 10:00 PM',
  NULL,
  'orange',
  'Fregar los vestuarios.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e2015fa2-301a-4e7e-bc88-620cd491fa6c (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e2015fa2-301a-4e7e-bc88-620cd491fa6c',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  '10:20-10:50 AM: Break 2. Signature of who took break',
  '10:20-10:50 AM: Break 2. Signature of who took break',
  37,
  'signature',
  '10:00 AM - 11:00 AM',
  NULL,
  'red',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8eb8a6c7-106f-4fe4-b2bc-0941c5a22930 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8eb8a6c7-106f-4fe4-b2bc-0941c5a22930',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Break MUST be taken BEFORE 10:30 AM. No exceptions. Please sign if understood',
  'Break MUST be taken BEFORE 10:30 AM. No exceptions. Please sign if understood',
  0,
  'signature',
  '5:30 AM - 6:15 AM',
  NULL,
  'red',
  'El descanso DEBE tomarse ANTES de las 10:30 AM. Sin excepciones. Por favor firma si estás de acuerdo.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b67ed7f4-6fc9-4d94-a9bf-f1e04e7b0cf9 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b67ed7f4-6fc9-4d94-a9bf-f1e04e7b0cf9',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Pick up Walkie-Talkie & locker key',
  'Pick up Walkie-Talkie & locker key',
  1,
  'checkbox',
  '5:30 AM - 6:15 AM',
  NULL,
  'orange',
  'Recoge el radio & Llave del locker',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f79382c6-8def-45a6-b020-9bbb10b3377b (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f79382c6-8def-45a6-b020-9bbb10b3377b',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Close steam room and sauna doors. Turn on sauna.',
  'Close steam room and sauna doors. Turn on sauna.',
  2,
  'checkbox',
  '5:30 AM - 6:15 AM',
  NULL,
  'orange',
  'Cierre las puertas del baño de vapor y de la sauna. Encender la sauna.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ae0b009c-c9d1-4539-8270-55086e1f0900 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ae0b009c-c9d1-4539-8270-55086e1f0900',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Collect mop heads, black towels, and all towel sizes; place empty white bin in elevator.',
  'Collect mop heads, black towels, and all towel sizes; place empty white bin in elevator.',
  3,
  'checkbox',
  '5:30 AM - 6:15 AM',
  NULL,
  'orange',
  'Recoge cabezales del trapeador, trapos negros y todas las toallas; coloca el bote blanco en el elevador.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6b4b26e2-9579-49cc-86a1-b90aef944877 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6b4b26e2-9579-49cc-86a1-b90aef944877',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Ensure enough yoga & small towels in ground floor studio.',
  'Ensure enough yoga & small towels in ground floor studio.',
  4,
  'checkbox',
  '5:30 AM - 6:15 AM',
  NULL,
  'orange',
  'Asegura que haya suficientes toallas (de yoga y pequeñas) en el estudio de PB.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 259920f6-bed6-4623-aed6-20366d1001aa (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '259920f6-bed6-4623-aed6-20366d1001aa',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Restock medium towels on main gym floor.',
  'Restock medium towels on main gym floor.',
  5,
  'checkbox',
  '5:30 AM - 6:15 AM',
  NULL,
  'orange',
  'Reponer toallas medianas en el piso principal del gimnasio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6a870cb6-5c6e-44e1-b189-54daf2b5fceb (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6a870cb6-5c6e-44e1-b189-54daf2b5fceb',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Restock towels as needed in spas.',
  'Restock towels as needed in spas.',
  6,
  'checkbox',
  '5:30 AM - 6:15 AM',
  NULL,
  'orange',
  'Reponer toallas según sea necesario en los spas.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: cd1eb41c-5049-4d15-8031-95c51de7bfe9 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'cd1eb41c-5049-4d15-8031-95c51de7bfe9',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Cold plunge: clean debris, ensure water is clear/cold/jets working.',
  'Cold plunge: clean debris, ensure water is clear/cold/jets working.',
  7,
  'checkbox',
  '6:15 AM - 7:00 AM',
  NULL,
  'purple',
  'Tina fría: limpiar residuos, asegurar agua clara/fría y chorros funcionando.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 85e29138-cc99-41db-aadd-6409a56c913c (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '85e29138-cc99-41db-aadd-6409a56c913c',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Refill toilet paper, napkins, water cups.',
  'Refill toilet paper, napkins, water cups.',
  8,
  'checkbox',
  '6:15 AM - 7:00 AM',
  NULL,
  'purple',
  'Reponer papel higiénico, servilletas y vasos de agua.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e2c2f275-3f23-4e11-a206-cfdd3e955d61 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e2c2f275-3f23-4e11-a206-cfdd3e955d61',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Check cleanliness of toilets.',
  'Check cleanliness of toilets.',
  9,
  'checkbox',
  '6:15 AM - 7:00 AM',
  NULL,
  'purple',
  'Revisar la limpieza de los baños.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6b84680d-1b3f-4e57-9884-6bb918b1ef22 (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6b84680d-1b3f-4e57-9884-6bb918b1ef22',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Refill Women''s spa water & restock cups',
  'Refill Women''s spa water & restock cups',
  32,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c9d7f2b5-ad19-4ca4-af39-d8d4aadb09bf (Template: 55c2e572-0853-4d29-99e4-5b8a5686a61a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c9d7f2b5-ad19-4ca4-af39-d8d4aadb09bf',
  '55c2e572-0853-4d29-99e4-5b8a5686a61a',
  'Refill Men''s spa water & restock cups',
  'Refill Men''s spa water & restock cups',
  34,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'gray',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: eb39bb4c-9eab-46fd-bb41-36c2647ed1e8 (Template: a1111111-1111-1111-1111-111111111111)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'eb39bb4c-9eab-46fd-bb41-36c2647ed1e8',
  'a1111111-1111-1111-1111-111111111111',
  'Set Up Spa Water in Men & Women''s',
  'Set Up Spa Water in Men & Women''s',
  8,
  'checkbox',
  NULL,
  'Opening',
  'blue',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3fb87859-a069-44d4-a039-6aa4007e7207 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3fb87859-a069-44d4-a039-6aa4007e7207',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Check showers for mold/trash/dirt.',
  'Check showers for mold/trash/dirt.',
  10,
  'checkbox',
  '6:15 AM - 7:00 AM',
  NULL,
  'purple',
  'Revisar duchas por moho/basura/suciedad.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7d34472c-9015-488a-ac90-e7c50e644ae0 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7d34472c-9015-488a-ac90-e7c50e644ae0',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  '7 AM: Place dirty towel bin in elevator for floater to pick up. Retrieve empty bin.',
  '7 AM: Place dirty towel bin in elevator for floater to pick up. Retrieve empty bin.',
  11,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'red',
  'Colocar el bote de toallas sucias en el elevador para que el apoyo general lo recoja. Recoge el bote vacío.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9e40447e-5bd9-4cac-ba37-fd9d2f6d3c89 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9e40447e-5bd9-4cac-ba37-fd9d2f6d3c89',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Recurring tasks: dry floors, restock towels, check showers, collect dirty towels, close lockers, tidy vanities, top off spa water.',
  'Recurring tasks: dry floors, restock towels, check showers, collect dirty towels, close lockers, tidy vanities, top off spa water.',
  12,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'yellow',
  'Tareas recurrentes: secar pisos, reponer toallas, revisar duchas, recoger toallas sucias, cerrar casilleros, ordenar tocadores, rellenar agua del spa.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 27a122fe-fe47-4d93-84af-8855a4d86136 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '27a122fe-fe47-4d93-84af-8855a4d86136',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Clean cold tub filter & skim debris.',
  'Clean cold tub filter & skim debris.',
  13,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'yellow',
  'Limpiar el filtro de la tina fría y usar la red para residuos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 35860dff-c460-4c7d-947c-eb96a7952146 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '35860dff-c460-4c7d-947c-eb96a7952146',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  '8 AM: Place dirty towel bin in elevator; retrieve clean bin and restock spa.',
  '8 AM: Place dirty towel bin in elevator; retrieve clean bin and restock spa.',
  14,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'red',
  'Colocar bote sucio en elevador; retirar bote limpio y reabastecer el spa.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b9e9c214-a3dd-4a72-90c8-3bdfa3f01bea (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b9e9c214-a3dd-4a72-90c8-3bdfa3f01bea',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Recurring tasks: dry floors, restock towels, check showers, collect dirty towels, close lockers, tidy vanities.',
  'Recurring tasks: dry floors, restock towels, check showers, collect dirty towels, close lockers, tidy vanities.',
  15,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'blue',
  'Tareas recurrentes: secar pisos, reponer toallas, revisar duchas, recoger toallas sucias, cerrar casilleros, ordenar tocadores.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d7fa2ab1-7850-4c92-b7d7-44715dd2320a (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd7fa2ab1-7850-4c92-b7d7-44715dd2320a',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Clean cold tub filter & skim debris.',
  'Clean cold tub filter & skim debris.',
  16,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'blue',
  'Limpiar filtro de tina fría y usar red para residuos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 58e3537c-84da-4967-82be-1b22fc93d323 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '58e3537c-84da-4967-82be-1b22fc93d323',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  '9 AM: Place dirty towel bin in elevator; retrieve clean bin and restock spa.',
  '9 AM: Place dirty towel bin in elevator; retrieve clean bin and restock spa.',
  17,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'red',
  'Colocar bote sucio en elevador; retirar bote limpio y reabastecer el spa.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f8482134-63c7-4d86-ae2d-07eeff03b840 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f8482134-63c7-4d86-ae2d-07eeff03b840',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Recurring tasks: dry floors, restock towels & products, check showers, collect dirty towels, close lockers.',
  'Recurring tasks: dry floors, restock towels & products, check showers, collect dirty towels, close lockers.',
  18,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'green',
  'Tareas recurrentes: secar pisos, reponer toallas y productos, revisar duchas, recoger toallas sucias, cerrar casilleros.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2018f012-b347-421c-86de-a95cbb624f9c (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2018f012-b347-421c-86de-a95cbb624f9c',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'BREAK 9:45-10:15 AM. Break MUST be taken before 10:30 AM, no exceptions.',
  'BREAK 9:45-10:15 AM. Break MUST be taken before 10:30 AM, no exceptions.',
  19,
  'signature',
  '9:00 AM - 10:00 AM',
  NULL,
  'red',
  'DESCANSO 9:45-10:15 AM. El descanso DEBE tomarse antes de las 10:30 AM, sin excepciones.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: eece2f0d-5cf3-482f-95fe-3fd0640f7b41 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'eece2f0d-5cf3-482f-95fe-3fd0640f7b41',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Take out spa trash',
  'Take out spa trash',
  20,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'blue',
  'Sacar la basura del spa',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c5de9776-ece8-41f3-9f6b-491d2be541c5 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c5de9776-ece8-41f3-9f6b-491d2be541c5',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Wipe sauna & steam room doors for fingerprints.',
  'Wipe sauna & steam room doors for fingerprints.',
  21,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'blue',
  'Limpiar puertas de sauna y vapor para quitar huellas.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6301c45c-3b94-46bb-8948-a83009db78ad (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6301c45c-3b94-46bb-8948-a83009db78ad',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Pick up walkie talkie',
  'Pick up walkie talkie',
  0,
  'checkbox',
  '4:30 PM - 5:00 PM',
  NULL,
  'blue',
  'Recoge el walkie-talkie',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c3ba48fc-a81b-40ba-95c4-59daa7b549fa (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c3ba48fc-a81b-40ba-95c4-59daa7b549fa',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'TUESDAY ONLY: If not already collected by BOH, take the DIRTY clothes from lost and found to the office to be washed. Move CLEAN clothes to the "to be donated" shelf',
  'TUESDAY ONLY: If not already collected by BOH, take the DIRTY clothes from lost and found to the office to be washed. Move CLEAN clothes to the "to be donated" shelf',
  31,
  'checkbox',
  '9:00 AM - 10:00 AM',
  'tuesday_only',
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: af30b571-fb5b-41ce-bfff-86ec7473d075 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'af30b571-fb5b-41ce-bfff-86ec7473d075',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Check cabinets above lockers & under sink for amenities; restock from back office.',
  'Check cabinets above lockers & under sink for amenities; restock from back office.',
  22,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'blue',
  'Verificar gabinetes y espacio bajo el lavabo; reabastecer desde oficina trasera.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 141588be-cb1e-4faa-8d70-424e3ac8ab2f (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '141588be-cb1e-4faa-8d70-424e3ac8ab2f',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Refill shampoo & conditioner.',
  'Refill shampoo & conditioner.',
  23,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'blue',
  'Rellenar champú y acondicionador.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3ed759c2-98e9-4321-8dc8-018b729dea80 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3ed759c2-98e9-4321-8dc8-018b729dea80',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  '11 AM: Place dirty towel bin in elevator; retrieve clean bin and restock spa.',
  '11 AM: Place dirty towel bin in elevator; retrieve clean bin and restock spa.',
  24,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'red',
  'Colocar bote sucio en elevador; retirar bote limpio y reabastecer el spa.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2e75aadd-9900-4587-9d5a-3736b11994c0 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2e75aadd-9900-4587-9d5a-3736b11994c0',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Scrub showers as needed (1 photo).',
  'Scrub showers as needed (1 photo).',
  25,
  'photo',
  '11:00 AM - 12:00 PM',
  NULL,
  'orange',
  'Limpiar duchas según sea necesario (1 foto).',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: edc01b68-e73c-4326-8678-a51a22a2adfc (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'edc01b68-e73c-4326-8678-a51a22a2adfc',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Complete recurring tasks as needed.',
  'Complete recurring tasks as needed.',
  26,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'orange',
  'Realizar tareas recurrentes según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7bb46c17-7bb5-4f00-addb-a3a914a422d9 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7bb46c17-7bb5-4f00-addb-a3a914a422d9',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Complete recurring tasks as needed.',
  'Complete recurring tasks as needed.',
  27,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'purple',
  'Realizar tareas recurrentes según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8925a745-324c-46dc-92dd-fd7609d1254d (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8925a745-324c-46dc-92dd-fd7609d1254d',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Clean toilets.',
  'Clean toilets.',
  28,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'purple',
  'Limpiar baños.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 75b5c067-d5fb-4165-9c78-607210378cc6 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '75b5c067-d5fb-4165-9c78-607210378cc6',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Wipe mirrors.',
  'Wipe mirrors.',
  29,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'purple',
  'Limpiar espejos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ac69261f-51c4-4918-8c7a-271ee2950674 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ac69261f-51c4-4918-8c7a-271ee2950674',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Complete Weekly Task',
  'Complete Weekly Task',
  30,
  'multiple_choice',
  '12:00 PM - 1:00 PM',
  NULL,
  'purple',
  'Tarea semanal',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0ebd30ca-f0ff-4005-a47d-dac35ae6e6b3 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0ebd30ca-f0ff-4005-a47d-dac35ae6e6b3',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  '1 PM: Place dirty towel bin in elevator; retrieve clean bin and restock spa.',
  '1 PM: Place dirty towel bin in elevator; retrieve clean bin and restock spa.',
  31,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'red',
  'Colocar bote sucio en elevador; retirar bote limpio y reabastecer el spa.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 578195ec-c54a-4b32-955f-f0e25e84e7d1 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '578195ec-c54a-4b32-955f-f0e25e84e7d1',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Check & clean cold tub filter behind tubs.',
  'Check & clean cold tub filter behind tubs.',
  32,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'blue',
  'Revisar y limpiar el filtro detrás de las tinas frías.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 50e357ed-0c58-4209-9532-e57cadecfc79 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '50e357ed-0c58-4209-9532-e57cadecfc79',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Complete recurring tasks as needed.',
  'Complete recurring tasks as needed.',
  33,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'blue',
  'Realizar tareas recurrentes según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c91b24cf-2136-4b8c-9109-7bb169e111c1 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c91b24cf-2136-4b8c-9109-7bb169e111c1',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Return walkie talkie to charger & locker key to desk',
  'Return walkie talkie to charger & locker key to desk',
  34,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'blue',
  'Regresa el walkie-talkie al cargador y la llave del locker al escritorio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d9094091-374a-4561-bda2-af2b9a3d4537 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd9094091-374a-4561-bda2-af2b9a3d4537',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Take out trash.',
  'Take out trash.',
  35,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'blue',
  'Sacar la basura.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 182f75dd-c9a9-477c-b99c-32271d14147f (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '182f75dd-c9a9-477c-b99c-32271d14147f',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Were there any obstacles today?',
  'Were there any obstacles today?',
  36,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Hubo algún obstáculo hoy?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 975551bc-7f43-47d1-adc0-7d498fcffac7 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '975551bc-7f43-47d1-adc0-7d498fcffac7',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Did you receive or overhear any member feedback?',
  'Did you receive or overhear any member feedback?',
  37,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Recibiste o escuchaste algún comentario?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3533db16-abd2-42ed-9108-6e4ce45b6838 (Template: 92f77f28-e8fd-4cb0-91da-750ce8b57ed1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3533db16-abd2-42ed-9108-6e4ce45b6838',
  '92f77f28-e8fd-4cb0-91da-750ce8b57ed1',
  'Label ALL unlabeled water bottles or other lost and found items and place them in the appropriate lost and found bins',
  'Label ALL unlabeled water bottles or other lost and found items and place them in the appropriate lost and found bins',
  56,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'green',
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 71cd1e5d-3742-4567-b839-e100b4f5c94f (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '71cd1e5d-3742-4567-b839-e100b4f5c94f',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Pick up walkie talkie',
  'Pick up walkie talkie',
  0,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'blue',
  'Recoge el walkie-talkie',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2eb3e9c9-72bb-4829-a6fb-e4166b4fdb87 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2eb3e9c9-72bb-4829-a6fb-e4166b4fdb87',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Review Class Schedule to Determine Turnover Times',
  'Review Class Schedule to Determine Turnover Times',
  1,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'red',
  'Revisa el horario de clases para determinar los tiempos de cambio de clase.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: dbf3af4c-816a-4a8c-a607-79e752b60a35 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'dbf3af4c-816a-4a8c-a607-79e752b60a35',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Begin laundry',
  'Begin laundry',
  2,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'blue',
  'Empieza a lavar la ropa',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


COMMIT;
BEGIN;


-- Item: 550c10cf-6cda-4f6e-a3de-68d620a913a3 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '550c10cf-6cda-4f6e-a3de-68d620a913a3',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'If needed, fold laundry leftover from the morning',
  'If needed, fold laundry leftover from the morning',
  3,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'blue',
  'Si es necesario, dobla la ropa que haya sobrado de la mañana.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1a271e4f-ac17-4d91-98fc-b68320ee81d4 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1a271e4f-ac17-4d91-98fc-b68320ee81d4',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Vacuum mezzanine & wet mop private recovery room',
  'Vacuum mezzanine & wet mop private recovery room',
  4,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'blue',
  'Entrepiso con aspiradora y sala de recuperación privada con mopa húmeda',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 17036919-b750-4373-a639-2fc260d494cb (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '17036919-b750-4373-a639-2fc260d494cb',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  5,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0e15d0da-523e-404d-8997-7e629dd5fa28 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0e15d0da-523e-404d-8997-7e629dd5fa28',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'FULLY COMPLETE BY 3:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 3:50',
  'FULLY COMPLETE BY 3:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 3:50',
  6,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'red',
  'COMPLETAR TOTALMENTE ANTES DE LAS 3:50 PM: Retire el bote de toallas sucias del elevador; complete la entrega; reabastezca y colóquelo antes de las 3:50.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 635081fa-049b-44c7-97f1-36d9c28e041f (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '635081fa-049b-44c7-97f1-36d9c28e041f',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'BI-MONTHLY TASK',
  'BI-MONTHLY TASK',
  7,
  'multiple_choice',
  '3:00 PM - 4:00 PM',
  NULL,
  'yellow',
  'TAREA BIMENSUAL',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5f19102f-a379-42b0-b4e8-a42004d71a31 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5f19102f-a379-42b0-b4e8-a42004d71a31',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  8,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f48c6a33-fa95-46e8-866f-8aa353bea14d (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f48c6a33-fa95-46e8-866f-8aa353bea14d',
  'a2222222-2222-2222-2222-222222222222',
  'Impact room sliding doors must be locked',
  'Impact room sliding doors must be locked',
  29,
  'checkbox',
  NULL,
  NULL,
  'red',
  NULL,
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 42453af2-2667-4af7-bccf-6daa2a2116f8 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '42453af2-2667-4af7-bccf-6daa2a2116f8',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Break MUST be taken BEFORE 6 PM. No exceptions. Please sign if understood',
  'Break MUST be taken BEFORE 6 PM. No exceptions. Please sign if understood',
  0,
  'signature',
  '1:00 PM - 2:00 PM',
  NULL,
  'red',
  'El descanso DEBE tomarse ANTES de las 6 PM. Sin excepciones.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b9fb3c4d-eef5-4fef-8f2e-2075a6652186 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b9fb3c4d-eef5-4fef-8f2e-2075a6652186',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Pick up Walkie-Talkie & locker key',
  'Pick up Walkie-Talkie & locker key',
  1,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'blue',
  'Recoge el radio & Llave del locker',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c33d45ca-1906-446e-8477-7bc1f3717d95 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c33d45ca-1906-446e-8477-7bc1f3717d95',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Begin laundry - wash 1 load of new yoga towels',
  'Begin laundry - wash 1 load of new yoga towels',
  2,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'blue',
  'Comienza la colada: lava una tanda de toallas de yoga nuevas.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c931a3e8-2ca1-44ad-bfb1-2508a51e66fd (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c931a3e8-2ca1-44ad-bfb1-2508a51e66fd',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Restock medium towels in main gym floor.',
  'Restock medium towels in main gym floor.',
  3,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'blue',
  'Reponer toallas medianas en la planta principal del gimnasio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 005554eb-4569-4ff3-9ae9-3fb3131530cb (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '005554eb-4569-4ff3-9ae9-3fb3131530cb',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Restock towels as needed in spa.',
  'Restock towels as needed in spa.',
  4,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'blue',
  'Reponga las toallas según sea necesario en el spa.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 23b94162-9753-4e86-9042-dc48dd16923d (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '23b94162-9753-4e86-9042-dc48dd16923d',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Cold plunge: clean debris, ensure water is clear, cold, jets working. 45° left / 55° right',
  'Cold plunge: clean debris, ensure water is clear, cold, jets working. 45° left / 55° right',
  5,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Tina fría: limpia residuos, asegúrate de que el agua esté limpia y fría. 45° izquierda / 55° derecha.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5c946043-12b5-4aea-8e85-dddb0a8bc891 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5c946043-12b5-4aea-8e85-dddb0a8bc891',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Refill toilet paper, napkins, and water cups.',
  'Refill toilet paper, napkins, and water cups.',
  6,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Reponer papel higiénico, servilletas y vasos de agua.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c09834e5-26db-4412-9a73-858cddcac6e1 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c09834e5-26db-4412-9a73-858cddcac6e1',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Refill Shampoo & Conditioner.',
  'Refill Shampoo & Conditioner.',
  7,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Recambio de champú y acondicionador.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 993f5592-c2d7-4ba2-b39d-cde216d5e2ba (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '993f5592-c2d7-4ba2-b39d-cde216d5e2ba',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'At 4 PM, place dirty towel bin in elevator; retrieve clean bin; restock as needed',
  'At 4 PM, place dirty towel bin in elevator; retrieve clean bin; restock as needed',
  8,
  'checkbox',
  '3:00 PM - 4:30 PM',
  NULL,
  'red',
  'A las 4 PM, coloque el bote de toallas sucias en el elevador y recoja el bote con toallas limpias.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 81b484e3-b93b-422c-a5ec-20330afa70c0 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '81b484e3-b93b-422c-a5ec-20330afa70c0',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Sweep and vacuum in pilates room.',
  'Sweep and vacuum in pilates room.',
  9,
  'checkbox',
  '3:00 PM - 4:30 PM',
  NULL,
  'purple',
  'Barrer y aspirar en la sala de pilates.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b4d056b6-e44f-4009-8fb4-e2a34e5aca60 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b4d056b6-e44f-4009-8fb4-e2a34e5aca60',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Swap laundry as needed.',
  'Swap laundry as needed.',
  10,
  'checkbox',
  '3:00 PM - 4:30 PM',
  NULL,
  'purple',
  'Intercambiar la ropa sucia según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c402f66d-0340-4a27-bbe2-90004b7b605b (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c402f66d-0340-4a27-bbe2-90004b7b605b',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'BREAK: 4:20–4:50. Must be taken before 6 PM.',
  'BREAK: 4:20–4:50. Must be taken before 6 PM.',
  11,
  'signature',
  '4:20 PM - 5:00 PM',
  NULL,
  'red',
  'DESCANSO: 4:20–4:50. El descanso DEBE tomarse antes de las 6 PM.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0d235a47-f10c-4344-9a7f-1dfc83573d26 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0d235a47-f10c-4344-9a7f-1dfc83573d26',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'At 5 PM, place dirty towel bin in elevator; retrieve clean bin; restock as needed',
  'At 5 PM, place dirty towel bin in elevator; retrieve clean bin; restock as needed',
  12,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'A las 5 PM, coloque el bote de toallas sucias en el elevador.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b07c3c0c-33ca-4a49-9e8c-ebb454324aee (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b07c3c0c-33ca-4a49-9e8c-ebb454324aee',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Wipe down all countertop surfaces on both sides of main gym floor.',
  'Wipe down all countertop surfaces on both sides of main gym floor.',
  13,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'Limpie todas las superficies de las encimeras.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: aa62b82d-ab32-438e-991c-c9f57340de49 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'aa62b82d-ab32-438e-991c-c9f57340de49',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Reoccurring Tasks: dry floors, restock towels & products, check showers, collect dirty towels, close lockers, restock products, tidy vanities, top off spa water.',
  'Reoccurring Tasks: dry floors, restock towels & products, check showers, collect dirty towels, close lockers, restock products, tidy vanities, top off spa water.',
  14,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'Tareas recurrentes: secar pisos, reponer toallas y productos, revisar duchas, recoger toallas sucias, cerrar casilleros.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b8f03119-cc3a-4cd6-99a0-525bef43055c (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b8f03119-cc3a-4cd6-99a0-525bef43055c',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Clean cold tub filter & use the skimmer for debris.',
  'Clean cold tub filter & use the skimmer for debris.',
  15,
  'photo',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'Limpie el filtro del tanque de agua fría y utilice el skimmer.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 21321465-281f-43cb-a095-c141c2296c40 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '21321465-281f-43cb-a095-c141c2296c40',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'At 6 PM, place dirty towel bin in elevator; retrieve clean bin; restock as needed',
  'At 6 PM, place dirty towel bin in elevator; retrieve clean bin; restock as needed',
  16,
  'checkbox',
  '6:00 PM - 8:00 PM',
  NULL,
  'orange',
  'A las 6 PM, coloque el bote de toallas sucias en el elevador.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b1b1e79b-5257-4f13-ad89-4320a80b9179 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b1b1e79b-5257-4f13-ad89-4320a80b9179',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  '6:30: Close down one tub, drain, circulate 20 min, wipe walls; repeat on second tub',
  '6:30: Close down one tub, drain, circulate 20 min, wipe walls; repeat on second tub',
  17,
  'checkbox',
  '6:00 PM - 8:00 PM',
  NULL,
  'orange',
  '6:30: Cierre una tina, abra la válvula, circule 20 min, limpie paredes; repita con la otra tina.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4ea512e3-c840-4e83-9cc2-5158c1054349 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4ea512e3-c840-4e83-9cc2-5158c1054349',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Wipe mirrors.',
  'Wipe mirrors.',
  18,
  'checkbox',
  '6:00 PM - 8:00 PM',
  NULL,
  'orange',
  'Limpiar espejos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ff16bf3a-a330-4075-be55-2d4e8a64c0a9 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ff16bf3a-a330-4075-be55-2d4e8a64c0a9',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Scrub steam room with Marble Plus & hose down (remove hair; leave door open).',
  'Scrub steam room with Marble Plus & hose down (remove hair; leave door open).',
  19,
  'checkbox',
  '6:00 PM - 8:00 PM',
  NULL,
  'orange',
  'Limpie la sala de vapor con Marble Plus y enjuague con la manguera.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 43171c09-871b-4fc1-afa1-409f1cfbc682 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '43171c09-871b-4fc1-afa1-409f1cfbc682',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Spray water down steam room and sauna floor drains 1–2 minutes.',
  'Spray water down steam room and sauna floor drains 1–2 minutes.',
  20,
  'photo',
  '6:00 PM - 8:00 PM',
  NULL,
  'orange',
  'Rocíe agua por el desagüe durante 1–2 minutos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 34d730b4-0ced-49b4-abf2-1d07cf1f1538 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '34d730b4-0ced-49b4-abf2-1d07cf1f1538',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Clean sauna as outlined in attached document.',
  'Clean sauna as outlined in attached document.',
  21,
  'photo',
  '6:00 PM - 8:00 PM',
  NULL,
  'orange',
  'Limpia la sauna según lo indicado.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f72adeaa-1e6c-4d1f-9f54-fd48dbd5dde5 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f72adeaa-1e6c-4d1f-9f54-fd48dbd5dde5',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Check cold tubs for cleanliness & scrub wooden platform; rinse thoroughly.',
  'Check cold tubs for cleanliness & scrub wooden platform; rinse thoroughly.',
  22,
  'checkbox',
  '6:00 PM - 8:00 PM',
  NULL,
  'orange',
  'Compruebe la limpieza de las tinas, frote la plataforma de madera.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 631d9493-c031-458b-8063-0984fea0e2ac (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '631d9493-c031-458b-8063-0984fea0e2ac',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Check & clean cold tub filter behind cold tubs.',
  'Check & clean cold tub filter behind cold tubs.',
  23,
  'photo',
  '6:00 PM - 8:00 PM',
  NULL,
  'orange',
  'Revisa y limpia el filtro detrás de las tinas frías.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 39e25e1a-a76d-40b8-b229-44c2c88ab978 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '39e25e1a-a76d-40b8-b229-44c2c88ab978',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Showers: scrub all surfaces w/ brush + diluted bleach; clear drains; rinse; leave grate off.',
  'Showers: scrub all surfaces w/ brush + diluted bleach; clear drains; rinse; leave grate off.',
  24,
  'photo',
  '6:00 PM - 8:00 PM',
  NULL,
  'orange',
  'Duchas: frote superficies con cepillo + lejía diluida; despeje desagües; deje la rejilla quitada.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5c2aaa00-72fc-4cf3-b5ad-cb6bedf458ef (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5c2aaa00-72fc-4cf3-b5ad-cb6bedf458ef',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Scrub floors around cold tubs & clean cold tub shower walls/floor.',
  'Scrub floors around cold tubs & clean cold tub shower walls/floor.',
  25,
  'checkbox',
  '6:00 PM - 8:00 PM',
  NULL,
  'orange',
  'Fregar los suelos alrededor de las bañeras.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4e269fd2-323d-4550-82d1-e3bb3837faed (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4e269fd2-323d-4550-82d1-e3bb3837faed',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Clean toilets thoroughly.',
  'Clean toilets thoroughly.',
  26,
  'checkbox',
  '6:00 PM - 8:00 PM',
  NULL,
  'orange',
  'Limpiar los inodoros a fondo.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5d9bb53d-881e-4a54-b421-87b5492e717a (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5d9bb53d-881e-4a54-b421-87b5492e717a',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Mop locker rooms.',
  'Mop locker rooms.',
  27,
  'checkbox',
  '6:00 PM - 8:00 PM',
  NULL,
  'orange',
  'Fregar vestuarios.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d7191581-5442-4625-b85b-bcdef368adb0 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd7191581-5442-4625-b85b-bcdef368adb0',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Return walkie talkie to charger & locker key to desk',
  'Return walkie talkie to charger & locker key to desk',
  28,
  'checkbox',
  '6:00 PM - 8:00 PM',
  NULL,
  'orange',
  'Regresa el walkie-talkie al cargador y la llave del locker al escritorio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c81eab73-0780-482f-9253-4f190eb21a81 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c81eab73-0780-482f-9253-4f190eb21a81',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Take out spa trash.',
  'Take out spa trash.',
  29,
  'checkbox',
  '6:00 PM - 8:00 PM',
  NULL,
  'orange',
  'Saca la basura del spa.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ca092401-4afd-425b-acd2-9631ddd5a584 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ca092401-4afd-425b-acd2-9631ddd5a584',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Were there any obstacles today?',
  'Were there any obstacles today?',
  30,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Hubo algún obstáculo hoy?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 98037050-c110-4cd7-94b7-8751ec5146a9 (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '98037050-c110-4cd7-94b7-8751ec5146a9',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Did you receive or overhear any member feedback?',
  'Did you receive or overhear any member feedback?',
  31,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Escuchaste o recibiste comentarios de algún miembro?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: aa416538-b757-4767-9cc0-35a502456a0e (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'aa416538-b757-4767-9cc0-35a502456a0e',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Do you have any additional notes for management?',
  'Do you have any additional notes for management?',
  32,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Tienes notas adicionales para la gerencia?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 774bef18-1c20-4ab5-b960-42188acaf94b (Template: 203b8aff-35a3-4091-b3ab-34d4c7b917a1)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '774bef18-1c20-4ab5-b960-42188acaf94b',
  '203b8aff-35a3-4091-b3ab-34d4c7b917a1',
  'Did you experience any issues with the cold tubs?',
  'Did you experience any issues with the cold tubs?',
  33,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Tuviste algún problema con las tinas frías?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a66b6306-f916-4f4a-9d93-b3be8b5ffd70 (Template: a2222222-2222-2222-2222-222222222222)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a66b6306-f916-4f4a-9d93-b3be8b5ffd70',
  'a2222222-2222-2222-2222-222222222222',
  'Impact room sliding doors must be locked',
  'Impact room sliding doors must be locked',
  29,
  'checkbox',
  NULL,
  NULL,
  'red',
  NULL,
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2290b80a-fed5-475a-a6e0-f0400f87d0b0 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2290b80a-fed5-475a-a6e0-f0400f87d0b0',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'How accurate was the checklist to the needs & flow of the day?',
  'How accurate was the checklist to the needs & flow of the day?',
  38,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Qué tan precisa fue la lista?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e60d8cbf-477e-47ac-888a-0580a4889092 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e60d8cbf-477e-47ac-888a-0580a4889092',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Any additional notes for management?',
  'Any additional notes for management?',
  39,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Notas adicionales para la gerencia?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f89f4ae4-0611-412f-8c15-4e561da392b7 (Template: c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f89f4ae4-0611-412f-8c15-4e561da392b7',
  'c5ed7f6f-3b22-4a59-bf70-7cf06e528b1a',
  'Did you experience any issues with the cold tubs?',
  'Did you experience any issues with the cold tubs?',
  40,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Tuviste problemas con las tinas frías?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c1a34461-4ac2-4a72-acc6-561c852258ed (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c1a34461-4ac2-4a72-acc6-561c852258ed',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Clean cold tub filter & use the skimmer for debris.',
  'Clean cold tub filter & use the skimmer for debris.',
  26,
  'checkbox',
  '6:00 PM - 7:00 PM',
  NULL,
  'green',
  'Limpia el filtro de la tina fría y usa el colador para quitar residuos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5f6bfcbc-3ea5-4e97-b85b-40329ae3abb4 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5f6bfcbc-3ea5-4e97-b85b-40329ae3abb4',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  '7 PM: Place dirty towel bin in elevator; retrieve clean towels and restock spa',
  '7 PM: Place dirty towel bin in elevator; retrieve clean towels and restock spa',
  27,
  'checkbox',
  '7:00 PM - 8:30 PM',
  NULL,
  'red',
  '7 PM: Coloca bote de toallas sucias en el elevador; retira bote con toallas limpias y reabastece el spa.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f15a7118-fb2b-4ade-83b7-5d20f49de202 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f15a7118-fb2b-4ade-83b7-5d20f49de202',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Complete recurring tasks as needed.',
  'Complete recurring tasks as needed.',
  28,
  'checkbox',
  '7:00 PM - 8:30 PM',
  NULL,
  'purple',
  'Haz las tareas recurrentes según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f13ccc6d-251a-4d8a-8c55-1bcdb2711624 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f13ccc6d-251a-4d8a-8c55-1bcdb2711624',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Wipe mirrors.',
  'Wipe mirrors.',
  29,
  'checkbox',
  '7:00 PM - 8:30 PM',
  NULL,
  'purple',
  'Limpia los espejos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 234a4c7c-ae05-4f19-b4a2-a1307f8ed135 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '234a4c7c-ae05-4f19-b4a2-a1307f8ed135',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  '8:30: Close down one tub, drain, run hose 20 min, wipe inside; repeat on second tub',
  '8:30: Close down one tub, drain, run hose 20 min, wipe inside; repeat on second tub',
  30,
  'photo',
  '8:30 PM - 10:00 PM',
  NULL,
  'orange',
  '8:30: Cierre una tina, abra la válvula, circule 20 min, limpie el interior; repita con la otra tina.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b8a5d414-a839-48ec-9009-7b1492c92678 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b8a5d414-a839-48ec-9009-7b1492c92678',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Scrub steam room with Marble Plus & hose down (remove hair, leave door open).',
  'Scrub steam room with Marble Plus & hose down (remove hair, leave door open).',
  31,
  'checkbox',
  '8:30 PM - 10:00 PM',
  NULL,
  'orange',
  'Limpie la sala de vapor con Marble Plus y enjuáguela con la manguera (quite el pelo, deje la puerta abierta).',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9ff42fc5-6345-41c9-9962-24e1b185945a (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9ff42fc5-6345-41c9-9962-24e1b185945a',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Spray water down steam room & sauna floor drains 1-2 min.',
  'Spray water down steam room & sauna floor drains 1-2 min.',
  32,
  'checkbox',
  '8:30 PM - 10:00 PM',
  NULL,
  'orange',
  'Rocíe agua por los desagües del suelo de la sala de vapor y la sauna durante 1-2 minutos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0a2217e9-4e0f-4196-bbe2-103212d32d16 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0a2217e9-4e0f-4196-bbe2-103212d32d16',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Clean sauna as outlined in attached document.',
  'Clean sauna as outlined in attached document.',
  33,
  'photo',
  '8:30 PM - 10:00 PM',
  NULL,
  'orange',
  'Limpie la sauna según lo indicado en el documento adjunto.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9ec84493-6a20-423c-9486-fabc659e995e (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9ec84493-6a20-423c-9486-fabc659e995e',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Check cold tubs for cleanliness & scrub wooden platform; rinse thoroughly.',
  'Check cold tubs for cleanliness & scrub wooden platform; rinse thoroughly.',
  34,
  'checkbox',
  '8:30 PM - 10:00 PM',
  NULL,
  'orange',
  'Compruebe la limpieza de las tinas frías, frote la plataforma de madera y enjuáguela bien.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5c2b1f7c-5ec5-441a-bfdf-1f1cabbd32f7 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5c2b1f7c-5ec5-441a-bfdf-1f1cabbd32f7',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Check & clean cold tub filter behind cold tubs.',
  'Check & clean cold tub filter behind cold tubs.',
  35,
  'photo',
  '8:30 PM - 10:00 PM',
  NULL,
  'orange',
  'Revise y limpie el filtro detrás de las tinas frías.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1d1ee2c7-e0a7-4e19-ad6e-64d365b812c6 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1d1ee2c7-e0a7-4e19-ad6e-64d365b812c6',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Showers: scrub all surfaces w/ brush + diluted bleach; clear drains; rinse; leave grate off.',
  'Showers: scrub all surfaces w/ brush + diluted bleach; clear drains; rinse; leave grate off.',
  36,
  'photo',
  '8:30 PM - 10:00 PM',
  NULL,
  'orange',
  'Duchas: frote superficies con cepillo + lejía diluida; despeje desagües; enjuague; deje rejilla quitada.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2d2a68ff-81f3-4998-9769-7ae3598a6e46 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2d2a68ff-81f3-4998-9769-7ae3598a6e46',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Scrub floors around cold tubs & clean cold tub shower walls/floor.',
  'Scrub floors around cold tubs & clean cold tub shower walls/floor.',
  37,
  'checkbox',
  '8:30 PM - 10:00 PM',
  NULL,
  'orange',
  'Fregar los suelos alrededor de las bañeras y limpiar las paredes y el suelo de la ducha.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2537d3fc-df65-49df-bd2c-72f856bf1525 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2537d3fc-df65-49df-bd2c-72f856bf1525',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Clock In ON TIME',
  'Clock In ON TIME',
  2,
  'checkbox',
  NULL,
  'Opening',
  NULL,
  NULL,
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 41332c5b-8c4e-4078-a600-575d5ad8102d (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '41332c5b-8c4e-4078-a600-575d5ad8102d',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Turn on countertop refrigerator',
  'Turn on countertop refrigerator',
  3,
  'checkbox',
  NULL,
  'Opening',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4697e43e-7440-4358-ace7-38378e13278b (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4697e43e-7440-4358-ace7-38378e13278b',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Uncover & turn on espresso machine & grinder',
  'Uncover & turn on espresso machine & grinder',
  4,
  'checkbox',
  NULL,
  'Opening',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6b58c603-5203-4b52-9c1e-e022f47b0d06 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6b58c603-5203-4b52-9c1e-e022f47b0d06',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Turn on KDS (1601)',
  'Turn on KDS (1601)',
  5,
  'checkbox',
  NULL,
  'Opening',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 200ececb-91f4-44de-8c5d-362be635cf77 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '200ececb-91f4-44de-8c5d-362be635cf77',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Fill espresso grinder with Seismic coffee beans',
  'Fill espresso grinder with Seismic coffee beans',
  6,
  'checkbox',
  NULL,
  'Opening',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2d26333a-f42b-41dc-aff3-59874288bc0c (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2d26333a-f42b-41dc-aff3-59874288bc0c',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Make pot of drip coffee w/ Shockwave coffee beans 160g coffee beans. Grind on 4',
  'Make pot of drip coffee w/ Shockwave coffee beans 160g coffee beans. Grind on 4',
  7,
  'checkbox',
  NULL,
  'Opening',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7cf04a87-e279-4f42-b85f-f733d695e856 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7cf04a87-e279-4f42-b85f-f733d695e856',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Break MUST be taken BEFORE 6 PM. No exceptions. Please sign if understood',
  'Break MUST be taken BEFORE 6 PM. No exceptions. Please sign if understood',
  0,
  'signature',
  '1:00 PM - 2:00 PM',
  NULL,
  'red',
  'El descanso DEBE tomarse ANTES de las 6 PM. Sin excepciones.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6bd56537-eac5-44ea-9a19-a945154fd316 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6bd56537-eac5-44ea-9a19-a945154fd316',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Pick up Walkie-Talkie',
  'Pick up Walkie-Talkie',
  1,
  'photo',
  '1:00 PM - 2:00 PM',
  NULL,
  'blue',
  'Recoger el walkie-talkie',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4728f105-721f-4eac-8d28-bd393d84174a (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4728f105-721f-4eac-8d28-bd393d84174a',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Cold plunge: clean debris, ensure water is clear/cold, jets working. 45° left / 55° right',
  'Cold plunge: clean debris, ensure water is clear/cold, jets working. 45° left / 55° right',
  2,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'blue',
  'Tina fría: limpia residuos, asegúrate de que el agua esté limpia y fría. 45° izquierda / 55° derecha.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 842c9597-2dcb-4178-aea0-18e4dc24bad3 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '842c9597-2dcb-4178-aea0-18e4dc24bad3',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Restock towels in cardio room.',
  'Restock towels in cardio room.',
  3,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'blue',
  'Repón las toallas en la sala de cardio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9a7ff601-357e-4b46-bf11-ac75be066ed1 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9a7ff601-357e-4b46-bf11-ac75be066ed1',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Restock towels as needed in spa.',
  'Restock towels as needed in spa.',
  4,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'blue',
  'Repón las toallas según sea necesario en el spa.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a5a7f686-a4b4-4c29-89c8-9aada6dbc2d4 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a5a7f686-a4b4-4c29-89c8-9aada6dbc2d4',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Wipe down vanity counters & restock as needed.',
  'Wipe down vanity counters & restock as needed.',
  5,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'blue',
  'Limpia las encimeras del tocador y repón suministros según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 69d778b9-9ad0-46f2-a93e-5232e819fbb2 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '69d778b9-9ad0-46f2-a93e-5232e819fbb2',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Refill toilet paper, napkins, and water cups.',
  'Refill toilet paper, napkins, and water cups.',
  6,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Reponer papel higiénico, servilletas y vasos de agua.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d1f6d0b3-e504-4e4c-bcc8-0061b6028a63 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd1f6d0b3-e504-4e4c-bcc8-0061b6028a63',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Check cleanliness of toilets — clean as needed.',
  'Check cleanliness of toilets — clean as needed.',
  7,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Revisa la limpieza de los baños y limpia si es necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4a5b07ff-944e-4e5a-a640-84d2c385a89f (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4a5b07ff-944e-4e5a-a640-84d2c385a89f',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Refill Shampoo & Conditioner.',
  'Refill Shampoo & Conditioner.',
  8,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Recambio de champú y acondicionador.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f098b54e-c854-4192-b0c3-b7d2c0340afc (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f098b54e-c854-4192-b0c3-b7d2c0340afc',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Dry floors as needed.',
  'Dry floors as needed.',
  9,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Seca los pisos según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 74192dd6-f126-4ef1-8369-ff8e03a2f133 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '74192dd6-f126-4ef1-8369-ff8e03a2f133',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Wipe down cardio machines if not in use.',
  'Wipe down cardio machines if not in use.',
  10,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Limpia las máquinas de cardio si no están en uso.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f1516f30-f57f-4891-9044-d3d27a3ab12e (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f1516f30-f57f-4891-9044-d3d27a3ab12e',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Scrub showers not in use.',
  'Scrub showers not in use.',
  11,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Limpia las duchas que no estén en uso.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 42861a4a-f511-4b1f-8909-f273c9923ef2 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '42861a4a-f511-4b1f-8909-f273c9923ef2',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'BREAK: 4 PM - 4:30 PM. Must be before 6 PM.',
  'BREAK: 4 PM - 4:30 PM. Must be before 6 PM.',
  12,
  'signature',
  '4:00 PM - 5:00 PM',
  NULL,
  'red',
  'DESCANSO: 4 PM - 4:30 PM. Debe ser antes de las 6 PM.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d573e9ee-6017-465e-aa1c-20d3d07b00cd (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd573e9ee-6017-465e-aa1c-20d3d07b00cd',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Mop locker room floors as needed.',
  'Mop locker room floors as needed.',
  13,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'purple',
  'Fregar los pisos de los vestuarios según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a28d4c1f-326f-4e2c-b000-ca7de8276a33 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a28d4c1f-326f-4e2c-b000-ca7de8276a33',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Recurring tasks: dry floors, restock towels/products, check showers, collect dirty towels, close lockers, restock paper products, tidy counters, top off spa water.',
  'Recurring tasks: dry floors, restock towels/products, check showers, collect dirty towels, close lockers, restock paper products, tidy counters, top off spa water.',
  14,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'purple',
  'Tareas recurrentes: secar pisos, reponer toallas/productos, revisar duchas, recoger toallas sucias, cerrar casilleros.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7bed848e-a676-4da4-8c35-70e2a7bf0205 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7bed848e-a676-4da4-8c35-70e2a7bf0205',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Stock all amenities as needed.',
  'Stock all amenities as needed.',
  15,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'purple',
  'Abastece todos los artículos necesarios.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 39649627-4f1e-4d95-90cf-60e8ca316aee (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '39649627-4f1e-4d95-90cf-60e8ca316aee',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Clean cold tub filter & use skimmer.',
  'Clean cold tub filter & use skimmer.',
  16,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'purple',
  'Limpia el filtro de la tina de agua fría y usa el skimmer para residuos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a2620b18-c5fc-48ae-a50d-f6b61bb3989d (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a2620b18-c5fc-48ae-a50d-f6b61bb3989d',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Wipe sauna & steam room doors for fingerprints.',
  'Wipe sauna & steam room doors for fingerprints.',
  17,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'Limpia las puertas de la sauna y del baño de vapor para eliminar huellas.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 13eeec8e-fe7b-44a8-998c-0c0de229dcaa (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '13eeec8e-fe7b-44a8-998c-0c0de229dcaa',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Wipe mirrors.',
  'Wipe mirrors.',
  18,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'Limpiar espejos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0c77b43e-b7b4-4323-8dc5-6a60fae54d6a (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0c77b43e-b7b4-4323-8dc5-6a60fae54d6a',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Mop locker room floors as needed.',
  'Mop locker room floors as needed.',
  19,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'Fregar los pisos de los vestuarios según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a6bfd1ee-dff0-42b4-a6a8-1bbcd2217a4d (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a6bfd1ee-dff0-42b4-a6a8-1bbcd2217a4d',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Recurring tasks as needed.',
  'Recurring tasks as needed.',
  20,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'Tareas recurrentes según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b1ac2018-761c-4494-b8df-6839972f3941 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b1ac2018-761c-4494-b8df-6839972f3941',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Restock towels in cardio room & wipe down counters; wipe down machines if not in use.',
  'Restock towels in cardio room & wipe down counters; wipe down machines if not in use.',
  21,
  'checkbox',
  '6:00 PM - 7:00 PM',
  NULL,
  'blue',
  'Repón toallas en cardio y limpia la encimera; limpia máquinas si no están en uso.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: de2d64a7-a7f8-4708-a327-525557f300cb (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'de2d64a7-a7f8-4708-a327-525557f300cb',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  '6:30: Close down one tub; drain, run hose 20 min, wipe inside; repeat for other tub',
  '6:30: Close down one tub; drain, run hose 20 min, wipe inside; repeat for other tub',
  22,
  'photo',
  '6:30 PM - 8:00 PM',
  NULL,
  'orange',
  '6:30: Cierra una tina; abre la válvula, circula 20 min, limpia interior; repite con la otra tina.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 27081952-45c7-4a92-910b-59811554ee2f (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '27081952-45c7-4a92-910b-59811554ee2f',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Scrub steam room with Marble Plus & hose down (remove hair, leave door open).',
  'Scrub steam room with Marble Plus & hose down (remove hair, leave door open).',
  23,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'orange',
  'Limpia sala de vapor con Marble Plus y enjuaga con la manguera (retira cabello y deja la puerta abierta).',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: da4e1c7c-64cf-4110-a6f7-325dc1125e3d (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'da4e1c7c-64cf-4110-a6f7-325dc1125e3d',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Spray water down steam room & sauna drains 1-2 minutes.',
  'Spray water down steam room & sauna drains 1-2 minutes.',
  24,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'orange',
  'Rocíe agua por los desagües del suelo de la sala de vapor y la sauna durante 1–2 minutos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1aa40e09-58ed-4c2f-9100-07960b6640b8 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1aa40e09-58ed-4c2f-9100-07960b6640b8',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Leave sauna door open for AM cleaning.',
  'Leave sauna door open for AM cleaning.',
  25,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'orange',
  'Deje la puerta de la sauna abierta para la limpieza matutina.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 14123629-655d-49d1-ad80-b1e84674fa93 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '14123629-655d-49d1-ad80-b1e84674fa93',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Check cold tubs for cleanliness & scrub wooden platform; rinse thoroughly.',
  'Check cold tubs for cleanliness & scrub wooden platform; rinse thoroughly.',
  26,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'orange',
  'Compruebe la limpieza de las tinas, frote la plataforma de madera y enjuáguela bien.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a9b8135a-d52b-431b-949b-50fbd87307d9 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a9b8135a-d52b-431b-949b-50fbd87307d9',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Check & clean cold tub filter behind cold tubs.',
  'Check & clean cold tub filter behind cold tubs.',
  27,
  'photo',
  '6:30 PM - 8:00 PM',
  NULL,
  'orange',
  'Revisa y limpia el filtro que se encuentra detrás de las tinas.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1d589a56-5fad-44e2-9067-9f9df66032d0 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1d589a56-5fad-44e2-9067-9f9df66032d0',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Showers: scrub all surfaces w/ brush + diluted bleach; clear drains; rinse; leave grate off.',
  'Showers: scrub all surfaces w/ brush + diluted bleach; clear drains; rinse; leave grate off.',
  28,
  'photo',
  '6:30 PM - 8:00 PM',
  NULL,
  'orange',
  'Duchas: frote superficies con cepillo + lejía diluida; despeje desagües; enjuague; deje la rejilla quitada.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a821717e-7606-4263-a0b0-abbb07afb0b2 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a821717e-7606-4263-a0b0-abbb07afb0b2',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Scrub floors around cold tubs & clean cold tub shower walls/floor.',
  'Scrub floors around cold tubs & clean cold tub shower walls/floor.',
  29,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'orange',
  'Fregar los suelos alrededor de las bañeras y limpiar las paredes y el suelo de la ducha.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0653e84a-e327-4d53-b88a-da9b0b1576ed (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0653e84a-e327-4d53-b88a-da9b0b1576ed',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Clean toilets thoroughly.',
  'Clean toilets thoroughly.',
  30,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'orange',
  'Limpiar los inodoros a fondo.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b420410b-b160-4c02-b363-45be80a360ae (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b420410b-b160-4c02-b363-45be80a360ae',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Mop locker rooms, cardio room, and entrance.',
  'Mop locker rooms, cardio room, and entrance.',
  31,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'orange',
  'Fregar vestuarios, sala de cardio y entrada.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 830b62b6-be0c-4b4f-bf9e-33784d0a85ef (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '830b62b6-be0c-4b4f-bf9e-33784d0a85ef',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Take out all trash (rooftop, main gym floor, cardio room). Replace liners.',
  'Take out all trash (rooftop, main gym floor, cardio room). Replace liners.',
  32,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'orange',
  'Sacar toda la basura (azotea, piso principal, sala de cardio). Cambiar las bolsas.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a588a39d-550e-45c2-a0ee-cdebb3490cdc (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a588a39d-550e-45c2-a0ee-cdebb3490cdc',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Return Walkie Talkie to charger & locker key to desk',
  'Return Walkie Talkie to charger & locker key to desk',
  33,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'orange',
  'Regresa el walkie-talkie al cargador y la llave del locker al escritorio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 21f4b857-49f2-49bc-8327-382d72f602de (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '21f4b857-49f2-49bc-8327-382d72f602de',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Were there any obstacles today?',
  'Were there any obstacles today?',
  34,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Hubo algún obstáculo hoy?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 07546556-ddd6-4e20-beaa-a01a0db8b287 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '07546556-ddd6-4e20-beaa-a01a0db8b287',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Did you receive or overhear any member feedback?',
  'Did you receive or overhear any member feedback?',
  35,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Recibiste o escuchaste algún comentario de algún miembro?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c46f7430-2b1b-4c77-8e85-ea857ce805a6 (Template: 4a32322b-2d85-467d-b0c1-bea7267d060e)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c46f7430-2b1b-4c77-8e85-ea857ce805a6',
  '4a32322b-2d85-467d-b0c1-bea7267d060e',
  'Do you have any additional notes for management?',
  'Do you have any additional notes for management?',
  36,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Tiene alguna nota adicional para la gerencia?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


COMMIT;
BEGIN;


-- Item: 756947f2-c928-494e-be26-94da3541ac70 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '756947f2-c928-494e-be26-94da3541ac70',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Bring out and arrange bar mats, mugs & glasses, drink pickup station, paper cups and lids, milk pitchers & espresso cups',
  'Bring out and arrange bar mats, mugs & glasses, drink pickup station, paper cups and lids, milk pitchers & espresso cups',
  8,
  'checkbox',
  NULL,
  'Opening',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 02efbc8a-7dba-4d90-b8bd-3261f35bebf6 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '02efbc8a-7dba-4d90-b8bd-3261f35bebf6',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Bring out and arrange packaged goods and refrigerated food & bevs',
  'Bring out and arrange packaged goods and refrigerated food & bevs',
  9,
  'checkbox',
  NULL,
  'Opening',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 58a8f8d8-b50c-4d48-8e39-86ba327c960a (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '58a8f8d8-b50c-4d48-8e39-86ba327c960a',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Set up smoothie station w/ cutting board, measuring cups & spoons, turn on blenders & KDS (1601)',
  'Set up smoothie station w/ cutting board, measuring cups & spoons, turn on blenders & KDS (1601)',
  10,
  'checkbox',
  NULL,
  'Opening',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5196f195-a8ef-403a-93a1-f5af07036a65 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5196f195-a8ef-403a-93a1-f5af07036a65',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Turn on and fill dishwasher',
  'Turn on and fill dishwasher',
  11,
  'checkbox',
  NULL,
  'Opening',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 47bff374-c3da-4244-88f8-87aa182ecb70 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '47bff374-c3da-4244-88f8-87aa182ecb70',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Fill ice wells with ice',
  'Fill ice wells with ice',
  12,
  'checkbox',
  NULL,
  'Opening',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5d4edf77-4115-42ba-aee7-646237297194 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5d4edf77-4115-42ba-aee7-646237297194',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Place board games on tables',
  'Place board games on tables',
  13,
  'checkbox',
  NULL,
  'Opening',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ef4e5e91-254b-4c65-a888-1b76f84d510d (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ef4e5e91-254b-4c65-a888-1b76f84d510d',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Open umbrellas, make sure tables are steady, push in chairs, wipe down any dirt/debris/stains on tables and chairs',
  'Open umbrellas, make sure tables are steady, push in chairs, wipe down any dirt/debris/stains on tables and chairs',
  14,
  'photo',
  NULL,
  'Opening',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c8b4eaaf-a415-4ebd-8b19-ef8ee44dc5a0 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c8b4eaaf-a415-4ebd-8b19-ef8ee44dc5a0',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Turn on cafe music and lights by 7:30',
  'Turn on cafe music and lights by 7:30',
  15,
  'checkbox',
  NULL,
  'Opening',
  NULL,
  NULL,
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c060743d-a951-4744-9c93-c3e53c47aa51 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c060743d-a951-4744-9c93-c3e53c47aa51',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Restock lids, straws, sugar, napkins, etc.',
  'Restock lids, straws, sugar, napkins, etc.',
  17,
  'checkbox',
  NULL,
  'Mid-Shift',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 054f1c3d-6c70-44bd-8d4b-11a9bf806ffc (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '054f1c3d-6c70-44bd-8d4b-11a9bf806ffc',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Restock packaged goods, food, bevs',
  'Restock packaged goods, food, bevs',
  18,
  'checkbox',
  NULL,
  'Mid-Shift',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 83f3e1a7-2941-4abe-8aba-26381e0494df (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '83f3e1a7-2941-4abe-8aba-26381e0494df',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Restock milk fridge',
  'Restock milk fridge',
  19,
  'checkbox',
  NULL,
  'Mid-Shift',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4e4e28bc-9436-49d8-afc0-8126e5f2432f (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4e4e28bc-9436-49d8-afc0-8126e5f2432f',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Complete Weekly Task',
  'Complete Weekly Task',
  20,
  'multiple_choice',
  NULL,
  'Mid-Shift',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b9898d5b-26ca-4649-b49e-a3cb0a45db62 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b9898d5b-26ca-4649-b49e-a3cb0a45db62',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'FRIDAY & SATURDAY ONLY: Prep smoothies (build to 5 of each) (pic of 1)',
  'FRIDAY & SATURDAY ONLY: Prep smoothies (build to 5 of each) (pic of 1)',
  21,
  'photo',
  NULL,
  'Mid-Shift',
  NULL,
  NULL,
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b5b4cc1e-3c7a-4023-8529-fc9b9cecbc1f (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b5b4cc1e-3c7a-4023-8529-fc9b9cecbc1f',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Prep vanilla, honey, & matcha (always 1 backup)',
  'Prep vanilla, honey, & matcha (always 1 backup)',
  22,
  'checkbox',
  NULL,
  'Mid-Shift',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1f41b822-15af-484a-9555-95cbc70f6fac (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1f41b822-15af-484a-9555-95cbc70f6fac',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Prep cucumbers for spa water',
  'Prep cucumbers for spa water',
  23,
  'checkbox',
  NULL,
  'Mid-Shift',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4091cbc9-1fae-4e84-9218-ad4d1f1ad527 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4091cbc9-1fae-4e84-9218-ad4d1f1ad527',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Polish glassware with microfiber towel',
  'Polish glassware with microfiber towel',
  24,
  'checkbox',
  NULL,
  'Mid-Shift',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9f8b45e6-e5c6-46db-84cc-eaf99b445513 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9f8b45e6-e5c6-46db-84cc-eaf99b445513',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Refill frozen fruits in freezer drawer',
  'Refill frozen fruits in freezer drawer',
  25,
  'checkbox',
  NULL,
  'Mid-Shift',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: dccaf6e9-af94-432e-8414-b14282fbb2bb (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'dccaf6e9-af94-432e-8414-b14282fbb2bb',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Check that tables are sturdy, place wobble wedges as needed',
  'Check that tables are sturdy, place wobble wedges as needed',
  26,
  'checkbox',
  NULL,
  'Mid-Shift',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ab296c8b-010b-4142-8ecf-d103be791949 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ab296c8b-010b-4142-8ecf-d103be791949',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Wipe down tables and chairs, push in chairs',
  'Wipe down tables and chairs, push in chairs',
  27,
  'checkbox',
  NULL,
  'Mid-Shift',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 57809faf-cae1-48dd-84a9-3bccf2d266d4 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '57809faf-cae1-48dd-84a9-3bccf2d266d4',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Sweep floors',
  'Sweep floors',
  28,
  'checkbox',
  NULL,
  'Mid-Shift',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8ee1e115-d708-47a5-bac1-248b9f0ce623 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8ee1e115-d708-47a5-bac1-248b9f0ce623',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Peel and freeze ripe bananas',
  'Peel and freeze ripe bananas',
  29,
  'checkbox',
  NULL,
  'Mid-Shift',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d1ea521e-b903-40a5-94c4-a7f2a990ed77 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd1ea521e-b903-40a5-94c4-a7f2a990ed77',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Peel, cut, and freeze ripe avocados',
  'Peel, cut, and freeze ripe avocados',
  30,
  'checkbox',
  NULL,
  'Mid-Shift',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 976c7b79-ff12-4080-bb5e-1ca878d5eeb5 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '976c7b79-ff12-4080-bb5e-1ca878d5eeb5',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Smoothie Station',
  'Smoothie Station',
  32,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  false,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 290681bc-1bc5-415d-8868-6459655d7e77 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '290681bc-1bc5-415d-8868-6459655d7e77',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Wash cutting board in sink',
  'Wash cutting board in sink',
  33,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d17b203c-4c75-40bd-b6f6-c67d056c30cc (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd17b203c-4c75-40bd-b6f6-c67d056c30cc',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Wash all dishes in dishwasher',
  'Wash all dishes in dishwasher',
  34,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c418a6cb-4149-4726-bc39-acd11d78d549 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c418a6cb-4149-4726-bc39-acd11d78d549',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Refill and wipe down smoothie ingredient containers and smoothie station/shelves',
  'Refill and wipe down smoothie ingredient containers and smoothie station/shelves',
  35,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 43994e36-ffa8-425a-a27b-60c486a64cb9 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '43994e36-ffa8-425a-a27b-60c486a64cb9',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Scrub inside of sink with scour pad',
  'Scrub inside of sink with scour pad',
  36,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 08229cbb-05e7-4151-80ea-7bd3578e703d (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '08229cbb-05e7-4151-80ea-7bd3578e703d',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Remove all dishes from dishwasher to drying rack',
  'Remove all dishes from dishwasher to drying rack',
  37,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 259f3991-227a-4f2f-b891-9dcf034332a0 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '259f3991-227a-4f2f-b891-9dcf034332a0',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Drain dishwasher and turn off',
  'Drain dishwasher and turn off',
  38,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6cecb41c-bc9a-4c09-a9a0-868c50d2d396 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6cecb41c-bc9a-4c09-a9a0-868c50d2d396',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Take out trash and replace with new bag',
  'Take out trash and replace with new bag',
  39,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: bcd90bcb-70cc-4a0b-9b52-f3e5d1d8a5f9 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'bcd90bcb-70cc-4a0b-9b52-f3e5d1d8a5f9',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'COFFEE BAR:',
  'COFFEE BAR:',
  40,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  false,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f09ed128-7cbc-4fc5-b8a2-7b1dc34d5f36 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f09ed128-7cbc-4fc5-b8a2-7b1dc34d5f36',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Bring all mugs/glassware/bar mats to back',
  'Bring all mugs/glassware/bar mats to back',
  41,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6c9f3947-8b0d-4039-9b77-fe8436f69b6e (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6c9f3947-8b0d-4039-9b77-fe8436f69b6e',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Bring all milk pitchers and espresso cups to dishwasher',
  'Bring all milk pitchers and espresso cups to dishwasher',
  42,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4bd649f5-2e30-48e2-a25e-fa28c9d7bd70 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4bd649f5-2e30-48e2-a25e-fa28c9d7bd70',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Place paper cups, lids, sugar/straws/napkins on wooden tray to bring to back',
  'Place paper cups, lids, sugar/straws/napkins on wooden tray to bring to back',
  43,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2aa48534-29f7-47e6-ba66-3b936e85ea1b (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2aa48534-29f7-47e6-ba66-3b936e85ea1b',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Soak portafilters baskets & screens in cafiza',
  'Soak portafilters baskets & screens in cafiza',
  44,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a70e4fbd-e4f9-4411-b02f-d11f5af07471 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a70e4fbd-e4f9-4411-b02f-d11f5af07471',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Backflush group heads with cafiza',
  'Backflush group heads with cafiza',
  45,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e425af0d-f192-4162-9e1b-af934f955540 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e425af0d-f192-4162-9e1b-af934f955540',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Soak steam wands with Rinza',
  'Soak steam wands with Rinza',
  46,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 19272beb-1fd1-4fca-89dc-a4874bd780aa (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '19272beb-1fd1-4fca-89dc-a4874bd780aa',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Dump leftover drip coffee and rinse out pot',
  'Dump leftover drip coffee and rinse out pot',
  47,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 355c012d-240b-4f66-a5fe-6268503ca438 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '355c012d-240b-4f66-a5fe-6268503ca438',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Close hopper, grind leftover beans, store beans in cambro labeled Seismic',
  'Close hopper, grind leftover beans, store beans in cambro labeled Seismic',
  48,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9d44b16a-13f1-47e7-8663-a65bd3c23d5a (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9d44b16a-13f1-47e7-8663-a65bd3c23d5a',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Clean grinder with Grindz and vacuum out any leftover debris, turn off grinder',
  'Clean grinder with Grindz and vacuum out any leftover debris, turn off grinder',
  49,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5c621f78-f705-490d-9e6c-536aa17fb966 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5c621f78-f705-490d-9e6c-536aa17fb966',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Put away all milks/syrups/matcha etc into milk fridge',
  'Put away all milks/syrups/matcha etc into milk fridge',
  50,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 905f3928-5809-4334-83fb-df7f1a88b428 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '905f3928-5809-4334-83fb-df7f1a88b428',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Cover ice wells with metal sheet pans',
  'Cover ice wells with metal sheet pans',
  51,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: eaa13af2-616a-4450-9ff2-07843453c451 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'eaa13af2-616a-4450-9ff2-07843453c451',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Bring all packaged food to the back',
  'Bring all packaged food to the back',
  52,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d56eef41-85dd-4993-8395-589e554afd1c (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd56eef41-85dd-4993-8395-589e554afd1c',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Bring all refrigerated food and bevs to back fridge. Log any items being tossed in Cafe notes. Turn off countertop fridge.',
  'Bring all refrigerated food and bevs to back fridge. Log any items being tossed in Cafe notes. Turn off countertop fridge.',
  53,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7cc15efc-c347-460e-9709-c3fa76f217a7 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7cc15efc-c347-460e-9709-c3fa76f217a7',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Wipe down all countertops, espresso machine, bar station.',
  'Wipe down all countertops, espresso machine, bar station.',
  54,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5b786836-dedb-4963-be4f-6cdb405b4798 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5b786836-dedb-4963-be4f-6cdb405b4798',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Turn off espresso machine',
  'Turn off espresso machine',
  55,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 05a62562-eb51-4cdb-9b5c-b1550c567723 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '05a62562-eb51-4cdb-9b5c-b1550c567723',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Cover espresso machine and grinder',
  'Cover espresso machine and grinder',
  56,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9209edea-3101-4e85-bc37-67b21bb700cb (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9209edea-3101-4e85-bc37-67b21bb700cb',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Take out trash & recycling',
  'Take out trash & recycling',
  57,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: bf5fdc26-7a75-4da1-9f37-839b8b7caf0e (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'bf5fdc26-7a75-4da1-9f37-839b8b7caf0e',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Take down dirty rags to laundry if not picked up by BOH',
  'Take down dirty rags to laundry if not picked up by BOH',
  58,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 39e692b4-a0db-4128-9546-e2af6dab4f36 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '39e692b4-a0db-4128-9546-e2af6dab4f36',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Please add notes for day overall-- was it busy, were there issues, etc. Please list what was tossed',
  'Please add notes for day overall-- was it busy, were there issues, etc. Please list what was tossed',
  59,
  'free_response',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: bb1b0cf7-aea2-44fc-9388-c8170d75448b (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'bb1b0cf7-aea2-44fc-9388-c8170d75448b',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Turn off lights',
  'Turn off lights',
  60,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: bf6fd0d1-4a7b-400b-aa0d-63ab62e17ca8 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'bf6fd0d1-4a7b-400b-aa0d-63ab62e17ca8',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'FULLY COMPLETE BY 4:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 4:50',
  'FULLY COMPLETE BY 4:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 4:50',
  9,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'red',
  'COMPLETAR TOTALMENTE ANTES DE LAS 4:50 PM: Retire el bote de toallas sucias del elevador; complete la entrega; reabastezca y colóquelo antes de las 4:50.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e76c94be-87a5-4fef-bb1c-1e7d6c20acf2 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e76c94be-87a5-4fef-bb1c-1e7d6c20acf2',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Wipe down mirrors in main gym floor',
  'Wipe down mirrors in main gym floor',
  10,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'purple',
  'Limpie los espejos del piso principal del gimnasio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2483b3a7-898e-45fc-b66d-c1e30a1deb9f (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2483b3a7-898e-45fc-b66d-c1e30a1deb9f',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Check mezzanine bathrooms for cleanliness & restock as needed',
  'Check mezzanine bathrooms for cleanliness & restock as needed',
  11,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'purple',
  'Verifique la limpieza de los baños del entrepiso y reabastezca según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 874709bc-d703-4d0d-88e4-3ed0866020ed (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '874709bc-d703-4d0d-88e4-3ed0866020ed',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Spot sweep/ dry mop as needed in main gym floor',
  'Spot sweep/ dry mop as needed in main gym floor',
  12,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'purple',
  'Barrer/fregar en seco según sea necesario en el piso del gimnasio principal',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6dcb4c68-c527-4165-a2ba-303a4e7ec642 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6dcb4c68-c527-4165-a2ba-303a4e7ec642',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  13,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7218c225-aaa4-477e-b12c-0ccb1355aed4 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7218c225-aaa4-477e-b12c-0ccb1355aed4',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'FULLY COMPLETE BY 5:50 PM: Retrieve dirty towel bin; complete towel drop; restock; place back before 5:50',
  'FULLY COMPLETE BY 5:50 PM: Retrieve dirty towel bin; complete towel drop; restock; place back before 5:50',
  14,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'red',
  'COMPLETAR TOTALMENTE ANTES DE LAS 5:50 PM: Retire el bote de toallas sucias; complete la entrega; reabastezca y colóquelo antes de las 5:50.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 07c58442-19c3-47cd-9c2d-41b8f982aaf9 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '07c58442-19c3-47cd-9c2d-41b8f982aaf9',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Fold laundry from shift',
  'Fold laundry from shift',
  15,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'doblar la ropa después del turno',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 478971c6-62c8-4cd7-96e5-6323ebffd545 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '478971c6-62c8-4cd7-96e5-6323ebffd545',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Check all wipes containers in gym/ pilates and restock as needed',
  'Check all wipes containers in gym/ pilates and restock as needed',
  16,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'Revisa todos los contenedores de toallitas húmedas en el gimnasio/pilates y repónlos según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b6e111c2-8744-4575-a24b-e9f3ade7f038 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b6e111c2-8744-4575-a24b-e9f3ade7f038',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Check towel stock in all gym areas',
  'Check towel stock in all gym areas',
  17,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'Verificar la disponibilidad de toallas en todas las áreas del gimnasio',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: dfd94185-0e93-40d5-abef-595958babffb (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'dfd94185-0e93-40d5-abef-595958babffb',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Clean bathrooms in mezzanine, recovery room and lounge (vacuum / wipe sofas)',
  'Clean bathrooms in mezzanine, recovery room and lounge (vacuum / wipe sofas)',
  18,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'Limpiar los baños del entresuelo, la sala de recuperación y el salón (aspirar/limpiar los sofás).',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e9aa4390-2b68-4ce9-b2dd-e5ee05d47482 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e9aa4390-2b68-4ce9-b2dd-e5ee05d47482',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  19,
  'checkbox',
  '6:00 PM - 7:30 PM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8a191b1c-6cd3-4512-9800-3394b3aaad25 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8a191b1c-6cd3-4512-9800-3394b3aaad25',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Ensure mop bucket used for room turnovers is empty, clean, and returned to the correct spot',
  'Ensure mop bucket used for room turnovers is empty, clean, and returned to the correct spot',
  20,
  'checkbox',
  '6:00 PM - 7:30 PM',
  NULL,
  'orange',
  'Asegúrate de que el cubo del trapeador usado para los cambios de sala esté vacío, limpio y devuelto a su lugar correcto.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5454e9ad-be64-4e5f-ac08-f728db72c7bd (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5454e9ad-be64-4e5f-ac08-f728db72c7bd',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Café: Close umbrellas, stack cushions on café tables, cover with black covers, turn off lights, close curtains, sweep & mop',
  'Café: Close umbrellas, stack cushions on café tables, cover with black covers, turn off lights, close curtains, sweep & mop',
  21,
  'checkbox',
  '6:00 PM - 7:30 PM',
  NULL,
  'orange',
  'Cafetería: Cierre las sombrillas, apile los cojines sobre las mesas, cúbralos con fundas negras, apague luces, cierre cortinas, barra y friegue.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1dfbb202-e5ab-48a7-bda0-0541c3ecf076 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1dfbb202-e5ab-48a7-bda0-0541c3ecf076',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Rooftop: Close umbrellas, cover machines, collect towels & trash',
  'Rooftop: Close umbrellas, cover machines, collect towels & trash',
  22,
  'checkbox',
  '6:00 PM - 7:30 PM',
  NULL,
  'orange',
  'Azotea: Cierre las sombrillas, cubra las máquinas, recoja toallas y basura.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e034ee9f-ac3d-4fdc-b9c7-75b11b61082a (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e034ee9f-ac3d-4fdc-b9c7-75b11b61082a',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'AFTER 6:30: Remove nozzles from spa jugs, scrub clean, run through dishwasher, clean inside jug',
  'AFTER 6:30: Remove nozzles from spa jugs, scrub clean, run through dishwasher, clean inside jug',
  23,
  'checkbox',
  '6:00 PM - 7:30 PM',
  NULL,
  'orange',
  'Después de las 6:30: Retire las boquillas de las jarras del spa, límpielas, lávelas en el lavavajillas.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: cadec64d-9617-4327-909b-f69b75736a08 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'cadec64d-9617-4327-909b-f69b75736a08',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Mop all floors and wipe surfaces throughout the club (cardio, entrance, main gym floor, café)',
  'Mop all floors and wipe surfaces throughout the club (cardio, entrance, main gym floor, café)',
  24,
  'checkbox',
  '6:00 PM - 7:30 PM',
  NULL,
  'orange',
  'Friega todos los suelos y limpia las superficies de todo el club.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6e67b56e-1c3a-4a7f-894c-09b6162d98f0 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6e67b56e-1c3a-4a7f-894c-09b6162d98f0',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Empty trash cans and replace liners on all gym floors',
  'Empty trash cans and replace liners on all gym floors',
  25,
  'checkbox',
  '6:00 PM - 7:30 PM',
  NULL,
  'orange',
  'Vaciar las papeleras y cambiar las bolsas en todos los pisos del gimnasio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3a87bb5b-60cf-46f9-bc93-330764b52120 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3a87bb5b-60cf-46f9-bc93-330764b52120',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Were there any obstacles today?',
  'Were there any obstacles today?',
  26,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Hubo algún obstáculo hoy?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 21ff8ac0-bb69-463a-bf91-10c17ceb4514 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '21ff8ac0-bb69-463a-bf91-10c17ceb4514',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Did you receive or overhear any member feedback?',
  'Did you receive or overhear any member feedback?',
  27,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Recibiste o escuchaste algún comentario de algún miembro?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a2757ec5-2928-4395-b4d8-266c8e585db8 (Template: f169c325-e872-4d68-b957-7b35ac3f9add)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a2757ec5-2928-4395-b4d8-266c8e585db8',
  'f169c325-e872-4d68-b957-7b35ac3f9add',
  'Do you have any additional notes for management?',
  'Do you have any additional notes for management?',
  28,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Tiene alguna nota adicional para la gerencia?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 29f9fd3d-d491-49ee-a9cd-9c95559e6455 (Template: 439b53bd-d394-4b05-8564-69b65c96c1c7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '29f9fd3d-d491-49ee-a9cd-9c95559e6455',
  '439b53bd-d394-4b05-8564-69b65c96c1c7',
  'Clock out',
  'Clock out',
  61,
  'checkbox',
  NULL,
  'Closing',
  NULL,
  NULL,
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0d163641-81c7-4fd0-8b11-5ce29769a39e (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0d163641-81c7-4fd0-8b11-5ce29769a39e',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Break MUST be taken BEFORE 5 PM. No exceptions. Please sign if understood',
  'Break MUST be taken BEFORE 5 PM. No exceptions. Please sign if understood',
  0,
  'signature',
  '2:00 PM - 3:00 PM',
  NULL,
  'red',
  'El descanso DEBE tomarse ANTES de las 5 PM. Sin excepciones.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d7476a4d-85ab-4025-9923-1fa980b4cfb3 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd7476a4d-85ab-4025-9923-1fa980b4cfb3',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Pick up Walkie-Talkie & locker key',
  'Pick up Walkie-Talkie & locker key',
  1,
  'photo',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Recoge el radio & Llave del locker',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b73d24c9-d0a0-4863-8799-92f44ccc7c5b (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b73d24c9-d0a0-4863-8799-92f44ccc7c5b',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Ensure enough towels in ground floor studio.',
  'Ensure enough towels in ground floor studio.',
  2,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Asegúrate de que haya suficientes toallas en el estudio de la planta baja.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 755ac78d-cbb7-4745-91c3-0d6d6ccd7932 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '755ac78d-cbb7-4745-91c3-0d6d6ccd7932',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Clean toilets thoroughly.',
  'Clean toilets thoroughly.',
  38,
  'checkbox',
  '8:30 PM - 10:00 PM',
  NULL,
  'orange',
  'Limpiar los inodoros a fondo.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 62ee91d6-4f44-4ac3-8a8c-8dc95d471a6c (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '62ee91d6-4f44-4ac3-8a8c-8dc95d471a6c',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Return walkie talkie to charger & locker key to desk',
  'Return walkie talkie to charger & locker key to desk',
  40,
  'checkbox',
  '8:30 PM - 10:00 PM',
  NULL,
  'orange',
  'Devuelva el walkie-talkie al cargador y la llave del locker al escritorio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8a79b5b4-819e-4031-b631-8093881e1066 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8a79b5b4-819e-4031-b631-8093881e1066',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Take out spa trash.',
  'Take out spa trash.',
  41,
  'checkbox',
  '8:30 PM - 10:00 PM',
  NULL,
  'orange',
  'Saque la basura del spa.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f3576f50-0417-4c6b-89bb-9bb9197f0ad6 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f3576f50-0417-4c6b-89bb-9bb9197f0ad6',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Were there any obstacles today?',
  'Were there any obstacles today?',
  42,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Hubo algún obstáculo hoy?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d1efab44-0d39-4e0a-8826-4e4398dc4315 (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd1efab44-0d39-4e0a-8826-4e4398dc4315',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Did you receive or overhear any member feedback?',
  'Did you receive or overhear any member feedback?',
  43,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Escuchaste o recibiste comentarios de algún miembro?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7809ca80-6d4e-4d8e-abc9-0bc34676edfd (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7809ca80-6d4e-4d8e-abc9-0bc34676edfd',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Do you have any additional notes for management?',
  'Do you have any additional notes for management?',
  44,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Tienes alguna nota adicional para la gerencia?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 32c1cb60-4208-4e2c-9578-c659e563674d (Template: a8f354c8-9c53-4c00-8988-d1eb81ab545b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '32c1cb60-4208-4e2c-9578-c659e563674d',
  'a8f354c8-9c53-4c00-8988-d1eb81ab545b',
  'Did you experience any issues with the cold tubs?',
  'Did you experience any issues with the cold tubs?',
  45,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Tuviste algún problema con las tinas frías?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2c98b90e-cf0b-45f9-be70-3eab2c346188 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2c98b90e-cf0b-45f9-be70-3eab2c346188',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Break MUST be taken BEFORE 10:20 AM. No exceptions. Please sign if understood',
  'Break MUST be taken BEFORE 10:20 AM. No exceptions. Please sign if understood',
  0,
  'signature',
  '5:30 AM - 6:30 AM',
  NULL,
  'red',
  'El descanso DEBE tomarse ANTES de las 10:20 AM. Sin excepciones.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d4b90ef4-1482-4427-89d0-ecf9a7cfca67 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd4b90ef4-1482-4427-89d0-ecf9a7cfca67',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Pick up Walkie-Talkie',
  'Pick up Walkie-Talkie',
  1,
  'checkbox',
  '5:30 AM - 6:30 AM',
  NULL,
  'blue',
  'Recoge el walkie-talkie',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c1631338-bf5c-45a2-a139-89823aba4f57 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c1631338-bf5c-45a2-a139-89823aba4f57',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  '5:30: turn on sauna.',
  '5:30: turn on sauna.',
  2,
  'photo',
  '5:30 AM - 6:30 AM',
  NULL,
  'red',
  'Enciende la sauna.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f00840e9-4936-48d2-a559-738fe474bd3c (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f00840e9-4936-48d2-a559-738fe474bd3c',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Close steam room and sauna doors.',
  'Close steam room and sauna doors.',
  3,
  'checkbox',
  '5:30 AM - 6:30 AM',
  NULL,
  'green',
  'Cierra las puertas del baño de vapor y la sauna.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2ca6410a-edcf-425e-aea7-2452e6873374 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2ca6410a-edcf-425e-aea7-2452e6873374',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Collect mop heads, black cleaning towels, all towel sizes from garage.',
  'Collect mop heads, black cleaning towels, all towel sizes from garage.',
  4,
  'checkbox',
  '5:30 AM - 6:30 AM',
  NULL,
  'green',
  'Recoge cabezales del trapeador, trapos negros y toallas del garaje.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2006d71b-b4c2-42e4-9ef5-cdf71325052c (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2006d71b-b4c2-42e4-9ef5-cdf71325052c',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Stock medium towels in Cardio Room & large/medium towels in spa.',
  'Stock medium towels in Cardio Room & large/medium towels in spa.',
  5,
  'checkbox',
  '5:30 AM - 6:30 AM',
  NULL,
  'green',
  'Reponer toallas medianas en cardio y toallas grandes/medianas en el spa.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 65d534d7-360b-44eb-9c4d-3033d20ad4eb (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '65d534d7-360b-44eb-9c4d-3033d20ad4eb',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Cold plunge: remove debris; ensure water is clear/cold; jets working.',
  'Cold plunge: remove debris; ensure water is clear/cold; jets working.',
  6,
  'checkbox',
  '6:30 AM - 7:00 AM',
  NULL,
  'gray',
  'Tina fría: quitar residuos; asegurar agua clara/fría; chorros funcionando.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 735dd7c5-f7ae-4ae1-8a62-7b05d07a790d (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '735dd7c5-f7ae-4ae1-8a62-7b05d07a790d',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'ROOFTOP: ensure there are towels & mats for rooftop classes.',
  'ROOFTOP: ensure there are towels & mats for rooftop classes.',
  7,
  'photo',
  '6:30 AM - 7:00 AM',
  NULL,
  'gray',
  'AZOTEA: asegúrate de que haya toallas y tapetes para clases.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 561f0b12-290c-4362-bce8-cac9dc60823f (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '561f0b12-290c-4362-bce8-cac9dc60823f',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Leaves on rooftop? Clear with leaf blower.',
  'Leaves on rooftop? Clear with leaf blower.',
  8,
  'yes_no',
  '6:30 AM - 7:00 AM',
  NULL,
  'gray',
  '¿Hojas en la azotea? Limpiar con el soplador de hojas.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 95a26a0c-a9f6-4cd6-9fa4-0b3cce1e6810 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '95a26a0c-a9f6-4cd6-9fa4-0b3cce1e6810',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Start on café by 6:50 (take photo).',
  'Start on café by 6:50 (take photo).',
  9,
  'photo',
  '6:30 AM - 7:00 AM',
  NULL,
  'red',
  'Empieza en la cafetería a las 6:50 (toma foto).',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ee7961d2-05e4-45b8-9e50-309c15676da7 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ee7961d2-05e4-45b8-9e50-309c15676da7',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Café floors: dry as needed & sweep.',
  'Café floors: dry as needed & sweep.',
  10,
  'checkbox',
  '6:30 AM - 7:00 AM',
  NULL,
  'gray',
  'Pisos del café: secar según sea necesario y barrer.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9cadda03-7bc6-4c4e-a10e-eb142e075c09 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9cadda03-7bc6-4c4e-a10e-eb142e075c09',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Café cushions: place cushions throughout the space.',
  'Café cushions: place cushions throughout the space.',
  11,
  'checkbox',
  '6:30 AM - 7:00 AM',
  NULL,
  'gray',
  'Cojines del café: colocar cojines en todo el espacio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4bf05198-4628-45dd-aa9e-98e102137b89 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4bf05198-4628-45dd-aa9e-98e102137b89',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Towel drop: alert floater via walkie-talkie when ready.',
  'Towel drop: alert floater via walkie-talkie when ready.',
  12,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'orange',
  'Entrega de toallas: avisar al Apoyo General por radio cuando esté listo.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 08418b07-5d1b-4c7c-a56e-b35631e67ef2 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '08418b07-5d1b-4c7c-a56e-b35631e67ef2',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Recurring tasks: dry floors, restock towels/products, check showers, collect dirty towels, close lockers, restock paper items, tidy counters, top off spa water.',
  'Recurring tasks: dry floors, restock towels/products, check showers, collect dirty towels, close lockers, restock paper items, tidy counters, top off spa water.',
  13,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'orange',
  'Tareas recurrentes: secar pisos, reponer toallas/productos, revisar duchas, recoger toallas sucias, cerrar casilleros, reponer papel y ordenar mostradores; rellenar agua del spa.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 636ce9a2-cb60-41c6-b90d-e24661d0cc6b (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '636ce9a2-cb60-41c6-b90d-e24661d0cc6b',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Clean cold tub filter & use skimmer for debris.',
  'Clean cold tub filter & use skimmer for debris.',
  14,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'orange',
  'Limpiar el filtro de la tina fría y usar el colador para residuos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c0344da4-7d92-4d11-9aa7-e259f6382354 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c0344da4-7d92-4d11-9aa7-e259f6382354',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Complete towel drop as needed.',
  'Complete towel drop as needed.',
  15,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'purple',
  'Completar la entrega de toallas según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7d9e32b1-0f31-4796-9002-d44d365f0c6c (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7d9e32b1-0f31-4796-9002-d44d365f0c6c',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Recurring tasks: dry floors (no white towels), restock towels & products, check showers, collect dirty towels, close lockers, restock paper towels/TP, tidy counters, top off spa water.',
  'Recurring tasks: dry floors (no white towels), restock towels & products, check showers, collect dirty towels, close lockers, restock paper towels/TP, tidy counters, top off spa water.',
  16,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'purple',
  'Tareas recurrentes: secar pisos (sin toallas blancas), reponer toallas y productos, revisar duchas, recoger toallas sucias, cerrar casilleros, reponer toallas de papel/papel higiénico y ordenar mostradores.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e0bf3afd-e73e-4e32-a111-241a789a0e46 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e0bf3afd-e73e-4e32-a111-241a789a0e46',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Clean cold tub filter & use skimmer for debris.',
  'Clean cold tub filter & use skimmer for debris.',
  17,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'purple',
  'Limpiar el filtro de la tina fría y usar el colador para quitar residuos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


COMMIT;
BEGIN;


-- Item: 07c412ec-42cf-4f29-9884-a9c6bc1fc548 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '07c412ec-42cf-4f29-9884-a9c6bc1fc548',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Break 9:45–10:15 AM. If you cannot take your break at this time, please explain. MUST be before 10:20 AM.',
  'Break 9:45–10:15 AM. If you cannot take your break at this time, please explain. MUST be before 10:20 AM.',
  18,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'red',
  'Descanso 9:45–10:15 AM. Si no puedes tomar tu descanso a esta hora, explica por qué. DEBE ser antes de las 10:20 AM.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6864ea1b-1c4b-4aa2-a655-1de907bbf3bb (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6864ea1b-1c4b-4aa2-a655-1de907bbf3bb',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Complete towel drop as needed.',
  'Complete towel drop as needed.',
  19,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'blue',
  'Completar la entrega de toallas según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: effcb71a-2217-4708-b115-5503543d5002 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'effcb71a-2217-4708-b115-5503543d5002',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Recurring tasks: dry floors (no white), restock towels & products, check showers, collect dirty towels, close lockers, restock paper towels/TP, tidy counters.',
  'Recurring tasks: dry floors (no white), restock towels & products, check showers, collect dirty towels, close lockers, restock paper towels/TP, tidy counters.',
  20,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'blue',
  'Tareas recurrentes: secar pisos (sin toallas blancas), reponer toallas y productos, revisar duchas, recoger toallas sucias, cerrar casilleros, reponer toallas de papel/papel higiénico y ordenar tocadores.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: fb3d07d2-2ec3-4b4c-a4c4-f9dac06aff98 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'fb3d07d2-2ec3-4b4c-a4c4-f9dac06aff98',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Clean cold tub filter & use skimmer.',
  'Clean cold tub filter & use skimmer.',
  21,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'blue',
  'Limpiar el filtro de la tina fría y usar el colador.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c215dc2e-1332-4368-a513-82f21bca350c (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c215dc2e-1332-4368-a513-82f21bca350c',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Complete recurring tasks as needed.',
  'Complete recurring tasks as needed.',
  22,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'blue',
  'Realiza las tareas recurrentes según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f5be5fe8-d106-41cc-b9f6-fed99ea9513a (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f5be5fe8-d106-41cc-b9f6-fed99ea9513a',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Clean showers not in use.',
  'Clean showers not in use.',
  23,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'blue',
  'Limpia las duchas que no estén en uso.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: eb2939f2-fb7e-419d-8b54-f07cf1515200 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'eb2939f2-fb7e-419d-8b54-f07cf1515200',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Complete towel drop as needed.',
  'Complete towel drop as needed.',
  24,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'blue',
  'Completa la entrega de toallas según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3210fcca-0ebf-4cf0-ae00-2b5da3a57d7f (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3210fcca-0ebf-4cf0-ae00-2b5da3a57d7f',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Complete recurring tasks as needed.',
  'Complete recurring tasks as needed.',
  25,
  'checkbox',
  '12:00 PM - 2:00 PM',
  NULL,
  'yellow',
  'Realiza las tareas recurrentes según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8a5920e0-4245-4722-b066-ed46f980ab4b (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8a5920e0-4245-4722-b066-ed46f980ab4b',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Clean toilets.',
  'Clean toilets.',
  26,
  'checkbox',
  '12:00 PM - 2:00 PM',
  NULL,
  'yellow',
  'Limpia los baños.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 90bcdcf7-e67d-44a9-b269-c0e86124d6b3 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '90bcdcf7-e67d-44a9-b269-c0e86124d6b3',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Complete towel drop as needed.',
  'Complete towel drop as needed.',
  27,
  'checkbox',
  '12:00 PM - 2:00 PM',
  NULL,
  'yellow',
  'Completa la entrega de toallas según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d16617a9-a6c7-406a-a901-308bb4cc722f (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd16617a9-a6c7-406a-a901-308bb4cc722f',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Wipe sauna & steam room doors for fingerprints.',
  'Wipe sauna & steam room doors for fingerprints.',
  28,
  'checkbox',
  '12:00 PM - 2:00 PM',
  NULL,
  'yellow',
  'Limpia puertas de sauna y vapor para quitar huellas.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8b156eb2-ec7d-4dd6-9be7-fb8741d5d3b3 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8b156eb2-ec7d-4dd6-9be7-fb8741d5d3b3',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Return Walkie Talkie to charger & locker key to desk',
  'Return Walkie Talkie to charger & locker key to desk',
  29,
  'checkbox',
  '12:00 PM - 2:00 PM',
  NULL,
  'yellow',
  'Regresa el walkie-talkie al cargador y la llave del locker al escritorio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0e5ac495-b4e8-45c5-b45c-d643df525d31 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0e5ac495-b4e8-45c5-b45c-d643df525d31',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Take out trash.',
  'Take out trash.',
  30,
  'checkbox',
  '12:00 PM - 2:00 PM',
  NULL,
  'yellow',
  'Saca la basura.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 32458a27-5a14-49a9-ab61-0da997693c23 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '32458a27-5a14-49a9-ab61-0da997693c23',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Were there any obstacles today?',
  'Were there any obstacles today?',
  31,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Hubo algún obstáculo hoy?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 79e24f76-aad0-4798-b4c7-9068ae5f3387 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '79e24f76-aad0-4798-b4c7-9068ae5f3387',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Did you receive or overhear any member feedback?',
  'Did you receive or overhear any member feedback?',
  32,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Escuchaste o recibiste comentarios de algún miembro?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5188d54f-9a41-4f90-859a-87176321119f (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5188d54f-9a41-4f90-859a-87176321119f',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'How accurate was the checklist to the needs & flow of the day?',
  'How accurate was the checklist to the needs & flow of the day?',
  33,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Qué tan precisa fue la lista respecto al flujo del día?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1c4ac343-cf14-4a71-90cf-3a927932db43 (Template: e961c03d-6dca-426b-ab2a-87505f6cfaf6)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1c4ac343-cf14-4a71-90cf-3a927932db43',
  'e961c03d-6dca-426b-ab2a-87505f6cfaf6',
  'Do you have any additional notes for management?',
  'Do you have any additional notes for management?',
  34,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Tienes alguna nota adicional para la gerencia?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f36f457b-1b66-43bd-a28c-73d13a778029 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f36f457b-1b66-43bd-a28c-73d13a778029',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Break MUST be taken BEFORE 5 PM. No exceptions. Please sign if understood',
  'Break MUST be taken BEFORE 5 PM. No exceptions. Please sign if understood',
  0,
  'signature',
  '2:00 PM - 3:00 PM',
  NULL,
  'red',
  'El descanso DEBE tomarse ANTES de las 5 PM. Sin excepciones.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 07248e34-666c-4726-ac77-a8f96aae3449 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '07248e34-666c-4726-ac77-a8f96aae3449',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Pick up Walkie-Talkie & locker key',
  'Pick up Walkie-Talkie & locker key',
  1,
  'photo',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Recoge el radio y la llave del locker.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: bb5fcc9f-9154-464e-950b-d791636cc411 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'bb5fcc9f-9154-464e-950b-d791636cc411',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Cold plunge: clean debris, ensure water is clear/cold, jets working, add ice if needed',
  'Cold plunge: clean debris, ensure water is clear/cold, jets working, add ice if needed',
  2,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Tina fría: limpia residuos, asegúrate de que el agua esté limpia y fría y chorros funcionando. Añade hielo si es necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7bf91e33-5864-4493-8ff5-60be517b6d1d (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7bf91e33-5864-4493-8ff5-60be517b6d1d',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Restock towels in cardio room.',
  'Restock towels in cardio room.',
  3,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Reponer toallas en la sala de cardio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f974db16-a6e1-4cbf-868e-dd206b21b107 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f974db16-a6e1-4cbf-868e-dd206b21b107',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Restock towels as needed in spa.',
  'Restock towels as needed in spa.',
  4,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Repón las toallas según sea necesario en el spa.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: fe5917c9-9ffe-4a1f-ab36-1b9946a03817 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'fe5917c9-9ffe-4a1f-ab36-1b9946a03817',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Wipe down vanity counters & restock as needed.',
  'Wipe down vanity counters & restock as needed.',
  5,
  'checkbox',
  '2:00 PM - 3:00 PM',
  NULL,
  'yellow',
  'Limpia las encimeras del tocador y repón suministros según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 516b5a20-c5eb-40d4-9be5-24da3aa40904 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '516b5a20-c5eb-40d4-9be5-24da3aa40904',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Refill toilet paper, napkins, and water cups.',
  'Refill toilet paper, napkins, and water cups.',
  6,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'blue',
  'Reponer papel higiénico, servilletas y vasos de agua.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 94c39b1a-be10-4234-8e32-ca308a7a7c7c (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '94c39b1a-be10-4234-8e32-ca308a7a7c7c',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Check cleanliness of toilets; clean as needed.',
  'Check cleanliness of toilets; clean as needed.',
  7,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'blue',
  'Comprobar la limpieza de los baños; limpiar según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4dd997a9-fede-48dd-9ae5-6d648ea37025 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4dd997a9-fede-48dd-9ae5-6d648ea37025',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Dry floors as needed.',
  'Dry floors as needed.',
  8,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'blue',
  'Secar los pisos según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6c628d5a-79d6-48d1-a0ce-8b167a9398c3 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6c628d5a-79d6-48d1-a0ce-8b167a9398c3',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Refill Shampoo & Conditioner.',
  'Refill Shampoo & Conditioner.',
  9,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'blue',
  'Rellenar champú y acondicionador.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d975476c-12be-4737-97f6-435c0e719a82 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd975476c-12be-4737-97f6-435c0e719a82',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Wipe down cardio machines if not in use.',
  'Wipe down cardio machines if not in use.',
  10,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'blue',
  'Limpia las máquinas de cardio si no están en uso.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 604fb6cf-8fb6-48d9-9ab8-bbe7862b6a2e (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '604fb6cf-8fb6-48d9-9ab8-bbe7862b6a2e',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Scrub showers not in use.',
  'Scrub showers not in use.',
  11,
  'checkbox',
  '3:00 PM - 4:00 PM',
  NULL,
  'blue',
  'Limpia las duchas que no estén en uso.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4e993eba-6dab-4f85-a9f7-036ec4851b04 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4e993eba-6dab-4f85-a9f7-036ec4851b04',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'BREAK: 4 PM - 4:30 PM. Must be before 5 PM.',
  'BREAK: 4 PM - 4:30 PM. Must be before 5 PM.',
  12,
  'signature',
  '4:00 PM - 5:00 PM',
  NULL,
  'red',
  'DESCANSO: 4 PM - 4:30 PM. Debe ser antes de las 5 PM.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4237a500-6023-4b93-9719-571bbc3a9f15 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4237a500-6023-4b93-9719-571bbc3a9f15',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Mop locker room floors as needed.',
  'Mop locker room floors as needed.',
  13,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'purple',
  'Fregar los pisos de los vestuarios según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: bfc46a92-676f-4831-8313-cd1c4ac92f7e (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'bfc46a92-676f-4831-8313-cd1c4ac92f7e',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Recurring tasks: dry floors, restock towels/products, check showers, collect dirty towels, close lockers, restock paper products, tidy counters, top off spa water.',
  'Recurring tasks: dry floors, restock towels/products, check showers, collect dirty towels, close lockers, restock paper products, tidy counters, top off spa water.',
  14,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'purple',
  'Tareas recurrentes: secar pisos, reponer toallas/productos, revisar duchas, recoger toallas sucias, cerrar casilleros, reponer toallas de papel/papel higiénico, ordenar tocadores, rellenar agua del spa.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8d09ed7e-bd49-4ecb-b51a-21c32c31c708 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8d09ed7e-bd49-4ecb-b51a-21c32c31c708',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Stock all amenities as needed.',
  'Stock all amenities as needed.',
  15,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'purple',
  'Abastece todos los artículos necesarios.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 89911ce9-d69c-41b5-a7ee-cf0ef14f6fd7 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '89911ce9-d69c-41b5-a7ee-cf0ef14f6fd7',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Clean cold tub filter & use skimmer.',
  'Clean cold tub filter & use skimmer.',
  16,
  'checkbox',
  '4:00 PM - 5:00 PM',
  NULL,
  'purple',
  'Limpia el filtro de la tina de agua fría y usa el skimmer para residuos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 811092dc-0a33-4b2e-8250-a842caf754d6 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '811092dc-0a33-4b2e-8250-a842caf754d6',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Wipe sauna & steam room doors for fingerprints.',
  'Wipe sauna & steam room doors for fingerprints.',
  17,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'Limpia las puertas de la sauna y del baño de vapor para eliminar huellas.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3e73041e-def4-4498-a2b0-47983f61433a (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3e73041e-def4-4498-a2b0-47983f61433a',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Wipe mirrors.',
  'Wipe mirrors.',
  18,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'Limpiar espejos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 322ebd28-4392-4e24-afa8-3d858287dae3 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '322ebd28-4392-4e24-afa8-3d858287dae3',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Mop locker room floors as needed.',
  'Mop locker room floors as needed.',
  19,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'Fregar los pisos de los vestuarios según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 298fbfdf-894f-423b-a21d-c0198182052f (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '298fbfdf-894f-423b-a21d-c0198182052f',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Recurring tasks: dry floors, restock towels, check showers, collect dirty towels, close lockers, restock products/paper towels/TP, tidy counters.',
  'Recurring tasks: dry floors, restock towels, check showers, collect dirty towels, close lockers, restock products/paper towels/TP, tidy counters.',
  20,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'Tareas recurrentes: secar pisos, reponer toallas, revisar duchas, recoger toallas sucias, cerrar casilleros, reponer productos/toallas de papel/papel higiénico, ordenar tocadores.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1bd76203-3912-4a02-adcc-24d7f45ca9c9 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1bd76203-3912-4a02-adcc-24d7f45ca9c9',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Stock all amenities as needed.',
  'Stock all amenities as needed.',
  21,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'Abastece todos los artículos necesarios.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d9d1c81a-c8ad-4d9f-902d-1175a5b93475 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd9d1c81a-c8ad-4d9f-902d-1175a5b93475',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Clean cold tub filter & use skimmer.',
  'Clean cold tub filter & use skimmer.',
  22,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'green',
  'Limpia el filtro de la tina de agua fría y usa el skimmer.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 71e02330-7353-4295-a830-1c9a1b15a41b (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '71e02330-7353-4295-a830-1c9a1b15a41b',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Restock towels in cardio room & wipe down counters; wipe down machines if not in use.',
  'Restock towels in cardio room & wipe down counters; wipe down machines if not in use.',
  23,
  'checkbox',
  '6:00 PM - 7:00 PM',
  NULL,
  'blue',
  'Repón toallas en cardio y limpia la encimera; limpia máquinas si no están en uso.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f4c59245-b7ad-4c12-bc2d-2ec3da5642d9 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f4c59245-b7ad-4c12-bc2d-2ec3da5642d9',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  '6:30: Close down one tub; drain, run hose 20 min, wipe inside; repeat for other tub',
  '6:30: Close down one tub; drain, run hose 20 min, wipe inside; repeat for other tub',
  24,
  'photo',
  '6:30 PM - 8:00 PM',
  NULL,
  'blue',
  '6:30: Cierra una tina; abre la válvula, circula 20 min, limpia interior; repite con la otra tina.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5335fd5d-fb50-4e06-ac71-64b595d491fb (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5335fd5d-fb50-4e06-ac71-64b595d491fb',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Scrub steam room with Marble Plus & hose down (remove hair, leave door open).',
  'Scrub steam room with Marble Plus & hose down (remove hair, leave door open).',
  25,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'blue',
  'Limpia sala de vapor con Marble Plus y enjuaga con la manguera (retira cabello y deja la puerta abierta).',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1cf9364e-58bb-4395-bb2f-3c31d3844fc3 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1cf9364e-58bb-4395-bb2f-3c31d3844fc3',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Spray water down steam room & sauna drains 1-2 minutes.',
  'Spray water down steam room & sauna drains 1-2 minutes.',
  26,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'blue',
  'Rocíe agua por los desagües del suelo de la sala de vapor y la sauna durante 1–2 minutos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9ddb31d9-a36b-44ed-8719-ddcf5216f1da (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9ddb31d9-a36b-44ed-8719-ddcf5216f1da',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Leave sauna door open for AM cleaning.',
  'Leave sauna door open for AM cleaning.',
  27,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'blue',
  'Deje la puerta de la sauna abierta para la limpieza matutina.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 158e3d06-4fe7-4d7d-a0ed-71dc0576cccd (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '158e3d06-4fe7-4d7d-a0ed-71dc0576cccd',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Check cold tubs for cleanliness & scrub wooden platform; rinse thoroughly.',
  'Check cold tubs for cleanliness & scrub wooden platform; rinse thoroughly.',
  28,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'blue',
  'Compruebe la limpieza de las tinas, frote la plataforma de madera y enjuáguela bien.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1c2037fb-0fb1-4fa6-aa71-bed17a6c35f1 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1c2037fb-0fb1-4fa6-aa71-bed17a6c35f1',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Check & clean cold tub filter behind cold tubs.',
  'Check & clean cold tub filter behind cold tubs.',
  29,
  'photo',
  '6:30 PM - 8:00 PM',
  NULL,
  'blue',
  'Revisa y limpia el filtro que se encuentra detrás de las tinas.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4e721c6f-260f-49a9-90d4-55ad7f4f1c4e (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4e721c6f-260f-49a9-90d4-55ad7f4f1c4e',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Showers: scrub all surfaces w/ brush + diluted bleach; clear drains; rinse; leave grate off.',
  'Showers: scrub all surfaces w/ brush + diluted bleach; clear drains; rinse; leave grate off.',
  30,
  'photo',
  '6:30 PM - 8:00 PM',
  NULL,
  'blue',
  'Duchas: frote superficies con cepillo + lejía diluida; despeje desagües; enjuague; deje la rejilla quitada.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c6804eec-5353-4315-92d5-07fff36c16b2 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c6804eec-5353-4315-92d5-07fff36c16b2',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Scrub floors around cold tubs & clean cold tub shower walls/floor.',
  'Scrub floors around cold tubs & clean cold tub shower walls/floor.',
  31,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'blue',
  'Fregar los suelos alrededor de las bañeras y limpiar las paredes y el suelo de la ducha.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b996d977-7966-44be-b022-534f883b7c11 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b996d977-7966-44be-b022-534f883b7c11',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Clean toilets thoroughly.',
  'Clean toilets thoroughly.',
  32,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'blue',
  'Limpiar los inodoros a fondo.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 098340b6-cab4-48dd-87bf-446670020afe (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '098340b6-cab4-48dd-87bf-446670020afe',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Mop locker rooms, cardio room, and entrance.',
  'Mop locker rooms, cardio room, and entrance.',
  33,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'blue',
  'Fregar vestuarios, sala de cardio y entrada.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5db0c223-5752-42c5-a839-4a26459faf66 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5db0c223-5752-42c5-a839-4a26459faf66',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Take out all trash (rooftop, main gym floor, cardio room). Replace liners.',
  'Take out all trash (rooftop, main gym floor, cardio room). Replace liners.',
  34,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'blue',
  'Sacar toda la basura (azotea, piso principal, sala de cardio). Cambiar las bolsas.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e590d957-2dff-4768-914a-918c27bb3de4 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e590d957-2dff-4768-914a-918c27bb3de4',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Return Walkie Talkie to charger & locker key to desk',
  'Return Walkie Talkie to charger & locker key to desk',
  35,
  'checkbox',
  '6:30 PM - 8:00 PM',
  NULL,
  'blue',
  'Regresa el walkie-talkie al cargador y la llave del locker al escritorio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4d4f9a9f-15b2-47ed-babf-2c8ef844532b (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4d4f9a9f-15b2-47ed-babf-2c8ef844532b',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Were there any obstacles today?',
  'Were there any obstacles today?',
  36,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Hubo algún obstáculo hoy?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ad5a7379-a1a3-4665-b134-4d9c1b5258a2 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ad5a7379-a1a3-4665-b134-4d9c1b5258a2',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Did you receive or overhear any member feedback?',
  'Did you receive or overhear any member feedback?',
  37,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Recibiste o escuchaste algún comentario de algún miembro?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: eba9dd4c-8cad-491e-ab97-c2995028c613 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'eba9dd4c-8cad-491e-ab97-c2995028c613',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Do you have any additional notes for management?',
  'Do you have any additional notes for management?',
  38,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Tiene alguna nota adicional para la gerencia?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: cb6866c7-9893-4644-9d75-138b3d6f6d40 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'cb6866c7-9893-4644-9d75-138b3d6f6d40',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'How accurate was the checklist to the needs & flow of the day?',
  'How accurate was the checklist to the needs & flow of the day?',
  39,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Qué tan precisa fue la lista según las necesidades y el desarrollo del día?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 607be1e0-6577-4e4c-873a-dc53cf8d6699 (Template: a0a505be-f800-4fc4-87f9-d3603061705b)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '607be1e0-6577-4e4c-873a-dc53cf8d6699',
  'a0a505be-f800-4fc4-87f9-d3603061705b',
  'Did you experience any issues with the cold tubs?',
  'Did you experience any issues with the cold tubs?',
  40,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Tuviste algún problema con las tinas de agua fría?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a633eb69-d67c-4bc6-b7b2-d345feb5cbfc (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a633eb69-d67c-4bc6-b7b2-d345feb5cbfc',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Break MUST be taken BEFORE 11 AM. No exceptions. Please sign if understood',
  'Break MUST be taken BEFORE 11 AM. No exceptions. Please sign if understood',
  0,
  'signature',
  '6:30 AM - 7:00 AM',
  NULL,
  'red',
  'El descanso DEBE tomarse ANTES de las 11 AM. Sin excepciones.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a9daf563-30dc-4334-8f6d-4168f7e1f142 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a9daf563-30dc-4334-8f6d-4168f7e1f142',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Pick up Walkie-Talkie',
  'Pick up Walkie-Talkie',
  1,
  'checkbox',
  '6:30 AM - 7:00 AM',
  NULL,
  'blue',
  'Recoge el walkie-talkie',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 30c3e7c1-cb79-4118-8582-fd6452d1d6cc (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '30c3e7c1-cb79-4118-8582-fd6452d1d6cc',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Review Class Schedule to Determine Turnover Times',
  'Review Class Schedule to Determine Turnover Times',
  2,
  'checkbox',
  '6:30 AM - 7:00 AM',
  NULL,
  'red',
  'Revisar el horario de clases para determinar los tiempos de cambio',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 941b3e29-119c-4e73-b985-a52c83810428 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '941b3e29-119c-4e73-b985-a52c83810428',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Take dirty towels from the garage down to the basement & restock garage bins',
  'Take dirty towels from the garage down to the basement & restock garage bins',
  3,
  'checkbox',
  '6:30 AM - 7:00 AM',
  NULL,
  'blue',
  'Lleva las toallas sucias del garaje al sótano y reabastece los contenedores del garaje',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e368ceb9-0631-4820-b272-494a7773a852 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e368ceb9-0631-4820-b272-494a7773a852',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Start Laundry',
  'Start Laundry',
  4,
  'checkbox',
  '6:30 AM - 7:00 AM',
  NULL,
  'blue',
  'Empieza a lavar la ropa',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9d94ccaa-91ec-4776-8e91-8b45dee7b007 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9d94ccaa-91ec-4776-8e91-8b45dee7b007',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Check mezzanine bathrooms for cleanliness & restock as needed',
  'Check mezzanine bathrooms for cleanliness & restock as needed',
  5,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'orange',
  'Revisar los baños del entrepiso y reabastecer si es necesario',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: fcd0f7b6-7549-4e32-ac56-24a572436f89 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'fcd0f7b6-7549-4e32-ac56-24a572436f89',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Vacuum mezzanine & wet mop private recovery room',
  'Vacuum mezzanine & wet mop private recovery room',
  6,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'orange',
  'Aspirar el entrepiso y trapear la sala de recuperación privada',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7b6e0275-c3e2-4751-a386-c1ff3a65e340 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7b6e0275-c3e2-4751-a386-c1ff3a65e340',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'FULLY COMPLETE BEFORE 7:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 7:50',
  'FULLY COMPLETE BEFORE 7:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 7:50',
  7,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'red',
  'COMPLETAR TOTALMENTE ANTES DE LAS 7:50 AM: Retire el bote de toallas sucias del elevador; complete la entrega; reabastezca y colóquelo antes de las 7:50.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d3eb273a-ee3e-44bb-b377-616503ae0b96 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd3eb273a-ee3e-44bb-b377-616503ae0b96',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Ensure towels are stocked in main gym floor & cardio room',
  'Ensure towels are stocked in main gym floor & cardio room',
  8,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'purple',
  'Asegúrate de que haya toallas en el piso principal del gimnasio y en la sala de cardio',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 25dc5034-c6dc-4d11-999f-1ad45d19c8e7 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '25dc5034-c6dc-4d11-999f-1ad45d19c8e7',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Rotate Laundry',
  'Rotate Laundry',
  9,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'purple',
  'Cambiar la carga de ropa',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d0eb7dd5-c896-46e7-be71-e3cfa4fde5e2 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd0eb7dd5-c896-46e7-be71-e3cfa4fde5e2',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'FULLY COMPLETE BEFORE 8:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 8:50',
  'FULLY COMPLETE BEFORE 8:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 8:50',
  10,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'red',
  'COMPLETAR TOTALMENTE ANTES DE LAS 8:50 AM: Retire el bote de toallas sucias del elevador; complete la entrega; reabastezca y colóquelo antes de las 8:50.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: af648dbd-578f-4106-8c15-ad8a02a149c6 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'af648dbd-578f-4106-8c15-ad8a02a149c6',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  11,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a0c0ce4f-b008-4df8-a8fb-9d51f7f3f7a5 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a0c0ce4f-b008-4df8-a8fb-9d51f7f3f7a5',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Wipe down all countertop surfaces on both sides of main gym floor',
  'Wipe down all countertop surfaces on both sides of main gym floor',
  12,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'green',
  'Limpiar todas las superficies de las encimeras a ambos lados del gimnasio principal',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1b66bb65-9937-474c-9360-36bd6251ecc5 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1b66bb65-9937-474c-9360-36bd6251ecc5',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'FULLY COMPLETE BEFORE 9:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 9:50',
  'FULLY COMPLETE BEFORE 9:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 9:50',
  13,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'red',
  'COMPLETAR TOTALMENTE ANTES DE LAS 9:50 AM: Retire el bote de toallas sucias del elevador; complete la entrega; reabastezca y colóquelo antes de las 9:50.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 850e986d-f758-4e63-a21f-b56586affe1c (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '850e986d-f758-4e63-a21f-b56586affe1c',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'BREAK 10-10:30. Must be before 11 AM.',
  'BREAK 10-10:30. Must be before 11 AM.',
  14,
  'signature',
  '10:00 AM - 11:00 AM',
  NULL,
  'red',
  'DESCANSO 10-10:30. Debe ser antes de las 11 AM.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e201dcb8-6f72-4558-b1c5-91110595185d (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e201dcb8-6f72-4558-b1c5-91110595185d',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  15,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d9205281-642e-48a8-8320-97a734396028 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd9205281-642e-48a8-8320-97a734396028',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Rotate Laundry & fold',
  'Rotate Laundry & fold',
  16,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'blue',
  'Cambiar la carga de ropa y doblar',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 52c1d724-bd2a-4ad5-8cc2-fe0c08aaf2f5 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '52c1d724-bd2a-4ad5-8cc2-fe0c08aaf2f5',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'FULLY COMPLETE BEFORE 10:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 10:50',
  'FULLY COMPLETE BEFORE 10:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 10:50',
  17,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'red',
  'COMPLETAR TOTALMENTE ANTES DE LAS 10:50 AM: Retire el bote de toallas sucias del elevador; complete la entrega; reabastezca y colóquelo antes de las 10:50.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 836b185e-3a20-4478-b642-a2100b57fe9d (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '836b185e-3a20-4478-b642-a2100b57fe9d',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  18,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5260ffc4-4c18-40eb-bc5c-e316e9ddeb00 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5260ffc4-4c18-40eb-bc5c-e316e9ddeb00',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Sweep & mop pilates room',
  'Sweep & mop pilates room',
  19,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'yellow',
  'Barrer y trapear la sala de pilates',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a99c36f2-139e-4cc3-a4c0-414e8c725919 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a99c36f2-139e-4cc3-a4c0-414e8c725919',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'FULLY COMPLETE BEFORE 11:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 11:50',
  'FULLY COMPLETE BEFORE 11:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 11:50',
  20,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'red',
  'COMPLETAR TOTALMENTE ANTES DE LAS 11:50 AM: Retire el bote de toallas sucias del elevador; complete la entrega; reabastezca y colóquelo antes de las 11:50.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 062441a1-8352-46f7-9f35-8c90b9288e01 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '062441a1-8352-46f7-9f35-8c90b9288e01',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  21,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f033526d-9a50-48a6-974e-9eb28d1df2a6 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f033526d-9a50-48a6-974e-9eb28d1df2a6',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Wipe down mirrors in main gym floor',
  'Wipe down mirrors in main gym floor',
  22,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'orange',
  'Limpie los espejos del piso principal del gimnasio',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d9dc0865-f054-4332-a914-85be9146d904 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd9dc0865-f054-4332-a914-85be9146d904',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Check mezzanine bathrooms for cleanliness & restock as needed',
  'Check mezzanine bathrooms for cleanliness & restock as needed',
  23,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'orange',
  'Revisar los baños del entrepiso y reabastecer según sea necesario',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b5e29cc9-1397-41b3-94c8-0577e29c1531 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b5e29cc9-1397-41b3-94c8-0577e29c1531',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Spot sweep / dry mop as needed in main gym floor',
  'Spot sweep / dry mop as needed in main gym floor',
  24,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'orange',
  'Barrer/fregar en seco según sea necesario en el piso del gimnasio principal',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ba76262b-63b2-42e3-9b4e-aea74e139c2d (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ba76262b-63b2-42e3-9b4e-aea74e139c2d',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'FULLY COMPLETE BEFORE 12:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 12:50',
  'FULLY COMPLETE BEFORE 12:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 12:50',
  25,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'red',
  'COMPLETAR TOTALMENTE ANTES DE LAS 12:50 PM: Retire el bote de toallas sucias del elevador; complete la entrega; reabastezca y colóquelo antes de las 12:50.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 81559efd-1954-4133-84a4-201c12ce55f2 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '81559efd-1954-4133-84a4-201c12ce55f2',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  26,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a15698d9-7031-4e4c-9f15-cb75c8d4ee08 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a15698d9-7031-4e4c-9f15-cb75c8d4ee08',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Check towel stock in all gym areas',
  'Check towel stock in all gym areas',
  27,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'purple',
  'Revisar el stock de toallas en todas las áreas del gimnasio',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6f45aa3b-2d77-417f-9bb5-54ea6243f7a6 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6f45aa3b-2d77-417f-9bb5-54ea6243f7a6',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Return Walkie Talkie to charger',
  'Return Walkie Talkie to charger',
  28,
  'checkbox',
  '1:00 PM - 2:00 PM',
  NULL,
  'purple',
  'Devolver el walkie-talkie al cargador',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2e10ae90-fe1c-4454-884d-697e1a6da4f5 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2e10ae90-fe1c-4454-884d-697e1a6da4f5',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Were there any obstacles today?',
  'Were there any obstacles today?',
  29,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Hubo algún obstáculo hoy?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 94d135ba-fb53-4b5d-862d-48ea45089f97 (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '94d135ba-fb53-4b5d-862d-48ea45089f97',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Did you receive or overhear any member feedback?',
  'Did you receive or overhear any member feedback?',
  30,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Recibiste o escuchaste algún comentario?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: eaf626f4-7d13-47a8-970e-8f17079692ec (Template: 11514e89-ab6e-4bdc-812c-a61f430f0e1f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'eaf626f4-7d13-47a8-970e-8f17079692ec',
  '11514e89-ab6e-4bdc-812c-a61f430f0e1f',
  'Do you have any additional notes for management?',
  'Do you have any additional notes for management?',
  31,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Tienes alguna nota adicional para la gerencia?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f983b7d4-283d-42e8-9d49-a9f6e86190bf (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f983b7d4-283d-42e8-9d49-a9f6e86190bf',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Review Class Schedule to Determine Turnover Times',
  'Review Class Schedule to Determine Turnover Times',
  1,
  'checkbox',
  '4:30 PM - 5:00 PM',
  NULL,
  'red',
  'Revisa el horario de clases para determinar los tiempos de cambio de clase.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 680d1135-4056-4cc0-b9b7-7778d7344678 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '680d1135-4056-4cc0-b9b7-7778d7344678',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Begin laundry',
  'Begin laundry',
  2,
  'checkbox',
  '4:30 PM - 5:00 PM',
  NULL,
  'blue',
  'Empieza a lavar la ropa',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7bccacad-5b9e-406f-b99a-ceae75ade54e (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7bccacad-5b9e-406f-b99a-ceae75ade54e',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'If needed, fold laundry leftover from the morning',
  'If needed, fold laundry leftover from the morning',
  3,
  'checkbox',
  '4:30 PM - 5:00 PM',
  NULL,
  'blue',
  'Si es necesario, dobla la ropa que haya sobrado de la mañana.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a93b27df-2513-4160-805f-caca9085e1b3 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a93b27df-2513-4160-805f-caca9085e1b3',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Vacuum mezzanine & wet mop private recovery room',
  'Vacuum mezzanine & wet mop private recovery room',
  4,
  'checkbox',
  '4:30 PM - 5:00 PM',
  NULL,
  'blue',
  'Entrepiso con aspiradora y sala de recuperación privada con mopa húmeda',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 97e50fcd-c959-4b15-951d-e4638cb2dda4 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '97e50fcd-c959-4b15-951d-e4638cb2dda4',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  5,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 810219eb-d3b9-4370-84d5-e83f58db4ab6 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '810219eb-d3b9-4370-84d5-e83f58db4ab6',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'FULLY COMPLETE BY 5:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 5:50',
  'FULLY COMPLETE BY 5:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 5:50',
  6,
  'checkbox',
  '5:00 PM - 6:00 PM',
  NULL,
  'red',
  'COMPLETAR TOTALMENTE ANTES DE LAS 5:50 PM: Retire el bote de toallas sucias del elevador; complete la entrega; reabastezca y colóquelo antes de las 5:50.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 915e9224-2c74-4883-83b7-bc83599eccde (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '915e9224-2c74-4883-83b7-bc83599eccde',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'WEEKLY TASK',
  'WEEKLY TASK',
  7,
  'multiple_choice',
  '5:00 PM - 6:00 PM',
  NULL,
  'yellow',
  'TAREA SEMANAL',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 0b47f23e-7824-432d-9969-45c054e7ca8e (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '0b47f23e-7824-432d-9969-45c054e7ca8e',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  8,
  'checkbox',
  '6:00 PM - 7:00 PM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 90b5a1c7-1c94-442d-9817-3d0f05c98e66 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '90b5a1c7-1c94-442d-9817-3d0f05c98e66',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'FULLY COMPLETE BY 6:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 6:50',
  'FULLY COMPLETE BY 6:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 6:50',
  9,
  'checkbox',
  '6:00 PM - 7:00 PM',
  NULL,
  'red',
  'COMPLETAR TOTALMENTE ANTES DE LAS 6:50 PM: Retire el bote de toallas sucias del elevador; complete la entrega; reabastezca y colóquelo antes de las 6:50.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4df2cc6c-5e79-4373-918a-77ac2db0793f (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4df2cc6c-5e79-4373-918a-77ac2db0793f',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Wipe down mirrors in main gym floor',
  'Wipe down mirrors in main gym floor',
  10,
  'checkbox',
  '6:00 PM - 7:00 PM',
  NULL,
  'purple',
  'Limpie los espejos del piso principal del gimnasio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


COMMIT;
BEGIN;


-- Item: 91369f8f-959c-43a1-9829-55b14ba41b80 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '91369f8f-959c-43a1-9829-55b14ba41b80',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Check mezzanine bathrooms for cleanliness & restock as needed',
  'Check mezzanine bathrooms for cleanliness & restock as needed',
  11,
  'checkbox',
  '6:00 PM - 7:00 PM',
  NULL,
  'purple',
  'Verifique la limpieza de los baños del entrepiso y reabastezca según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3eb4e49c-a3b0-464a-8b16-2cb7224d9aa7 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3eb4e49c-a3b0-464a-8b16-2cb7224d9aa7',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Spot sweep/ dry mop as needed in main gym floor',
  'Spot sweep/ dry mop as needed in main gym floor',
  12,
  'checkbox',
  '6:00 PM - 7:00 PM',
  NULL,
  'purple',
  'Barrer/fregar en seco según sea necesario en el piso del gimnasio principal',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7c572d7d-6ae1-4a81-8af3-63cc91fe9980 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7c572d7d-6ae1-4a81-8af3-63cc91fe9980',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  13,
  'checkbox',
  '7:00 PM - 8:00 PM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f1c44f06-27ed-4cb5-b67f-b427219d1547 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f1c44f06-27ed-4cb5-b67f-b427219d1547',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'FULLY COMPLETE BY 7:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 7:50',
  'FULLY COMPLETE BY 7:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 7:50',
  14,
  'checkbox',
  '7:00 PM - 8:00 PM',
  NULL,
  'red',
  'COMPLETAR TOTALMENTE ANTES DE LAS 7:50 PM: Retire el bote de toallas sucias del elevador; complete la entrega; reabastezca y colóquelo antes de las 7:50.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2076c972-df9c-44d6-b4dc-57ec56997973 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2076c972-df9c-44d6-b4dc-57ec56997973',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Fold laundry from shift',
  'Fold laundry from shift',
  15,
  'checkbox',
  '7:00 PM - 8:00 PM',
  NULL,
  'green',
  'doblar la ropa después del turno',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 69e31aa5-2f90-44cc-83ad-9d424ac98cb4 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '69e31aa5-2f90-44cc-83ad-9d424ac98cb4',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Check all wipes containers in gym/ pilates and restock as needed',
  'Check all wipes containers in gym/ pilates and restock as needed',
  16,
  'checkbox',
  '7:00 PM - 8:00 PM',
  NULL,
  'green',
  'Revisa todos los contenedores de toallitas húmedas en el gimnasio/pilates y repónlos según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a414ecee-f66b-4223-a9f9-458cc8c8320e (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a414ecee-f66b-4223-a9f9-458cc8c8320e',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Check towel stock in all gym areas',
  'Check towel stock in all gym areas',
  17,
  'checkbox',
  '7:00 PM - 8:00 PM',
  NULL,
  'green',
  'Verificar la disponibilidad de toallas en todas las áreas del gimnasio',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a0cf513b-dbcf-4160-b26a-35b88aec0728 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a0cf513b-dbcf-4160-b26a-35b88aec0728',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Clean bathrooms in mezzanine, recovery room and lounge (vacuum / wipe sofas)',
  'Clean bathrooms in mezzanine, recovery room and lounge (vacuum / wipe sofas)',
  18,
  'checkbox',
  '7:00 PM - 8:00 PM',
  NULL,
  'green',
  'Limpiar los baños del entresuelo, la sala de recuperación y el salón (aspirar/limpiar los sofás).',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a81fdbb5-c4f6-438b-962e-0ce304d95eb0 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a81fdbb5-c4f6-438b-962e-0ce304d95eb0',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Ensure mop bucket used for room turnovers is empty, clean, and returned to the correct spot',
  'Ensure mop bucket used for room turnovers is empty, clean, and returned to the correct spot',
  19,
  'checkbox',
  '8:00 PM - 9:30 PM',
  NULL,
  'orange',
  'Asegúrate de que el cubo del trapeador usado para los cambios de sala esté vacío, limpio y devuelto a su lugar correcto.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 685998c9-5d36-49c8-859b-afad8d14d621 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '685998c9-5d36-49c8-859b-afad8d14d621',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Café: Close umbrellas, stack cushions on café tables, cover with black covers, turn off lights, close curtains, sweep & mop',
  'Café: Close umbrellas, stack cushions on café tables, cover with black covers, turn off lights, close curtains, sweep & mop',
  20,
  'checkbox',
  '8:00 PM - 9:30 PM',
  NULL,
  'orange',
  'Cafetería: Cierre las sombrillas, apile los cojines sobre las mesas, cúbralos con fundas negras, apague luces, cierre cortinas, barra y friegue.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e836a211-a918-460b-8e89-545b047afd52 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e836a211-a918-460b-8e89-545b047afd52',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Rooftop: Close umbrellas, cover machines, collect towels & trash',
  'Rooftop: Close umbrellas, cover machines, collect towels & trash',
  21,
  'checkbox',
  '8:00 PM - 9:30 PM',
  NULL,
  'orange',
  'Azotea: Cierre las sombrillas, cubra las máquinas, recoja toallas y basura.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1fd722ed-b5ad-4151-a35a-c3ae98d8c365 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1fd722ed-b5ad-4151-a35a-c3ae98d8c365',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'AFTER 8:45 PM: Remove nozzles from spa jugs, scrub clean, run through dishwasher, clean inside jug',
  'AFTER 8:45 PM: Remove nozzles from spa jugs, scrub clean, run through dishwasher, clean inside jug',
  22,
  'checkbox',
  '8:00 PM - 9:30 PM',
  NULL,
  'orange',
  'DESPUÉS DE LAS 8:45 PM: Retire las boquillas de las jarras del spa, lávelas, páselas por el lavavajillas y limpie el interior de la jarra.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5f0b0928-dc3d-40c6-bea4-b2b17e34f5c6 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5f0b0928-dc3d-40c6-bea4-b2b17e34f5c6',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Mop all floors and wipe surfaces throughout the club (cardio, entrance, main gym floor, café)',
  'Mop all floors and wipe surfaces throughout the club (cardio, entrance, main gym floor, café)',
  23,
  'checkbox',
  '8:00 PM - 9:30 PM',
  NULL,
  'orange',
  'Friega todos los suelos y limpia las superficies de todo el club (cardio, entrada, gimnasio principal, cafetería).',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6976910a-a36f-4181-8216-5bf0fc9aaa75 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6976910a-a36f-4181-8216-5bf0fc9aaa75',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Empty trash cans and replace liners on all gym floors',
  'Empty trash cans and replace liners on all gym floors',
  24,
  'checkbox',
  '8:00 PM - 9:30 PM',
  NULL,
  'orange',
  'Vaciar las papeleras y cambiar las bolsas en todos los pisos del gimnasio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e4cb9452-be25-43a3-a823-6f6d25dd4ea8 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e4cb9452-be25-43a3-a823-6f6d25dd4ea8',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Were there any obstacles today?',
  'Were there any obstacles today?',
  25,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Hubo algún obstáculo hoy?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: aa72ea93-9dde-4ae1-b8d5-185698052b2b (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'aa72ea93-9dde-4ae1-b8d5-185698052b2b',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Did you receive or overhear any member feedback?',
  'Did you receive or overhear any member feedback?',
  26,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Recibiste o escuchaste algún comentario de algún miembro?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c8458a4c-5ca2-402b-a0cc-c9df7f147950 (Template: a8ae8176-624e-499f-910f-5136194f68b7)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c8458a4c-5ca2-402b-a0cc-c9df7f147950',
  'a8ae8176-624e-499f-910f-5136194f68b7',
  'Do you have any additional notes for management?',
  'Do you have any additional notes for management?',
  27,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Tiene alguna nota adicional para la gerencia?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b9c0b2df-f3d3-4467-bb8a-380328e5b48c (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b9c0b2df-f3d3-4467-bb8a-380328e5b48c',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Break MUST be taken BEFORE 10:20 AM. No exceptions. Please sign if understood',
  'Break MUST be taken BEFORE 10:20 AM. No exceptions. Please sign if understood',
  0,
  'signature',
  '6:30 AM - 7:00 AM',
  NULL,
  'red',
  'El descanso DEBE tomarse ANTES de las 10:20 AM. Sin excepciones.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 676684c3-5d0b-4582-931e-655fb61dbd31 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '676684c3-5d0b-4582-931e-655fb61dbd31',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Pick up Walkie-Talkie & locker key',
  'Pick up Walkie-Talkie & locker key',
  1,
  'checkbox',
  '6:30 AM - 7:00 AM',
  NULL,
  'orange',
  'Recoge el radio & Llave del locker',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: bd14ebb3-7333-4ecb-9c79-6d22eb288f88 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'bd14ebb3-7333-4ecb-9c79-6d22eb288f88',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Close steam room and sauna doors. Turn on sauna.',
  'Close steam room and sauna doors. Turn on sauna.',
  2,
  'checkbox',
  '6:30 AM - 7:00 AM',
  NULL,
  'red',
  'Cierre las puertas del baño de vapor y de la sauna. Encender la sauna.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 138a1b65-e676-4552-b52f-cba28c479243 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '138a1b65-e676-4552-b52f-cba28c479243',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Collect mop heads, black cleaning towels, all towel sizes from garage.',
  'Collect mop heads, black cleaning towels, all towel sizes from garage.',
  3,
  'checkbox',
  '6:30 AM - 7:00 AM',
  NULL,
  'orange',
  'Recoge cabezales del trapeador, trapos negros y toallas del garaje.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6c16e024-779f-497e-97da-54cbcf990c24 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6c16e024-779f-497e-97da-54cbcf990c24',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Ensure enough yoga & small towels in ground floor studio.',
  'Ensure enough yoga & small towels in ground floor studio.',
  4,
  'checkbox',
  '6:30 AM - 7:00 AM',
  NULL,
  'orange',
  'Asegura que haya suficientes toallas (de yoga y pequeñas) en el estudio de PB.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 562838a6-5758-4115-8fa4-f5769199ead6 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '562838a6-5758-4115-8fa4-f5769199ead6',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Restock medium towels on main gym floor.',
  'Restock medium towels on main gym floor.',
  5,
  'checkbox',
  '6:30 AM - 7:00 AM',
  NULL,
  'orange',
  'Reponer toallas medianas en el piso principal del gimnasio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f0dc8d27-29c5-4805-b979-ad0e96021e24 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f0dc8d27-29c5-4805-b979-ad0e96021e24',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Restock towels as needed in spa.',
  'Restock towels as needed in spa.',
  6,
  'checkbox',
  '6:30 AM - 7:00 AM',
  NULL,
  'orange',
  'Reponer toallas según sea necesario en el spa.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b4de1432-e008-4a47-a8a6-83a22c24839f (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b4de1432-e008-4a47-a8a6-83a22c24839f',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Cold plunge: clean debris, ensure water is clear/cold/jets working.',
  'Cold plunge: clean debris, ensure water is clear/cold/jets working.',
  7,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'purple',
  'Tina fría: limpiar residuos, asegurar agua clara/fría y chorros funcionando.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 274cc746-4390-47c3-8ad6-67408bc0d25f (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '274cc746-4390-47c3-8ad6-67408bc0d25f',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Refill toilet paper, napkins, water cups.',
  'Refill toilet paper, napkins, water cups.',
  8,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'purple',
  'Reponer papel higiénico, servilletas y vasos de agua.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d715d082-e518-48f3-bc2b-0bc50be992e7 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd715d082-e518-48f3-bc2b-0bc50be992e7',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Check cleanliness of toilets.',
  'Check cleanliness of toilets.',
  9,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'purple',
  'Revisar la limpieza de los baños.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 05e5deaf-d8fd-4a79-9f53-6c8fd0e85b0d (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '05e5deaf-d8fd-4a79-9f53-6c8fd0e85b0d',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Check showers for mold/trash/dirt.',
  'Check showers for mold/trash/dirt.',
  10,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'purple',
  'Revisar duchas por moho/basura/suciedad.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 457e9896-f743-447a-85eb-8abab51449db (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '457e9896-f743-447a-85eb-8abab51449db',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Towel drop: alert floater via walkie-talkie when ready.',
  'Towel drop: alert floater via walkie-talkie when ready.',
  11,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'orange',
  'Entrega de toallas: avisar al Apoyo General por radio cuando esté listo.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: fc475f4f-5088-4683-8321-22c1aa018af3 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'fc475f4f-5088-4683-8321-22c1aa018af3',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Recurring tasks: dry floors, restock towels/products, check showers, collect dirty towels, close lockers, restock paper items, tidy counters, top off spa water.',
  'Recurring tasks: dry floors, restock towels/products, check showers, collect dirty towels, close lockers, restock paper items, tidy counters, top off spa water.',
  12,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'orange',
  'Tareas recurrentes: secar pisos, reponer toallas/productos, revisar duchas, recoger toallas sucias, cerrar casilleros, reponer papel y ordenar mostradores; rellenar agua del spa.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3c020a6e-f617-4e89-a0f5-31961b99e84e (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3c020a6e-f617-4e89-a0f5-31961b99e84e',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Clean cold tub filter & use skimmer for debris.',
  'Clean cold tub filter & use skimmer for debris.',
  13,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'orange',
  'Limpiar el filtro de la tina fría y usar el colador para residuos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 23b37b40-e068-46e8-ab96-e3db36880362 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '23b37b40-e068-46e8-ab96-e3db36880362',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Complete towel drop as needed.',
  'Complete towel drop as needed.',
  14,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'purple',
  'Completar la entrega de toallas según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 770f1703-ea70-4615-88b1-522beae3dc99 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '770f1703-ea70-4615-88b1-522beae3dc99',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Recurring tasks: dry floors (no white towels), restock towels & products, check showers, collect dirty towels, close lockers, restock paper towels/TP, tidy counters, top off spa water.',
  'Recurring tasks: dry floors (no white towels), restock towels & products, check showers, collect dirty towels, close lockers, restock paper towels/TP, tidy counters, top off spa water.',
  15,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'purple',
  'Tareas recurrentes: secar pisos (sin toallas blancas), reponer toallas y productos, revisar duchas, recoger toallas sucias, cerrar casilleros, reponer toallas de papel/papel higiénico y ordenar mostradores.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9d5f5faf-21eb-4ba1-9a44-2e9303edf333 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9d5f5faf-21eb-4ba1-9a44-2e9303edf333',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Clean cold tub filter & use skimmer for debris.',
  'Clean cold tub filter & use skimmer for debris.',
  16,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'purple',
  'Limpiar el filtro de la tina fría y usar el colador para quitar residuos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 878b7168-55f7-42f2-a7c6-ddd882897f66 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '878b7168-55f7-42f2-a7c6-ddd882897f66',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'BREAK 10-10:30 AM. Break MUST be taken before 11 AM, no exceptions.',
  'BREAK 10-10:30 AM. Break MUST be taken before 11 AM, no exceptions.',
  17,
  'signature',
  '10:00 AM - 11:00 AM',
  NULL,
  'red',
  'DESCANSO 10-10:30 AM. El descanso DEBE tomarse antes de las 11 AM, sin excepciones.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 13347c0b-e5f7-47bd-b719-9b368ce72ef0 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '13347c0b-e5f7-47bd-b719-9b368ce72ef0',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Take out spa trash',
  'Take out spa trash',
  18,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'blue',
  'Sacar la basura del spa',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: be6c020d-9364-4332-a558-aa0f1d8a7a33 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'be6c020d-9364-4332-a558-aa0f1d8a7a33',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Wipe sauna & steam room doors for fingerprints.',
  'Wipe sauna & steam room doors for fingerprints.',
  19,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'blue',
  'Limpiar puertas de sauna y vapor para quitar huellas.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 2094d6d7-eed5-4f60-9051-0c296c6e0fb4 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '2094d6d7-eed5-4f60-9051-0c296c6e0fb4',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Place dirty towel bin in elevator; retrieve clean bin and restock spa.',
  'Place dirty towel bin in elevator; retrieve clean bin and restock spa.',
  20,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'red',
  'Colocar bote sucio en elevador; retirar bote limpio y reabastecer el spa.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 706ea14f-2bd3-438d-be83-7a82ad376e5e (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '706ea14f-2bd3-438d-be83-7a82ad376e5e',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Scrub showers as needed (1 photo).',
  'Scrub showers as needed (1 photo).',
  21,
  'photo',
  '11:00 AM - 12:00 PM',
  NULL,
  'orange',
  'Limpiar duchas según sea necesario (1 foto).',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7804de1d-ecb5-4280-80ee-4b8f7f6600cc (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7804de1d-ecb5-4280-80ee-4b8f7f6600cc',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Complete recurring tasks as needed.',
  'Complete recurring tasks as needed.',
  22,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'orange',
  'Realizar tareas recurrentes según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 310ddac7-1129-4a96-a4a6-3e0f0f7cb1ae (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '310ddac7-1129-4a96-a4a6-3e0f0f7cb1ae',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Place dirty towel bin in elevator; retrieve clean bin and restock spa.',
  'Place dirty towel bin in elevator; retrieve clean bin and restock spa.',
  23,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'red',
  'Colocar bote sucio en elevador; retirar bote limpio y reabastecer el spa.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 395a5c7f-f945-4f8a-b11d-caee5310104b (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '395a5c7f-f945-4f8a-b11d-caee5310104b',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Return walkie talkie to charger & locker key to desk',
  'Return walkie talkie to charger & locker key to desk',
  24,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'blue',
  'Regresa el walkie-talkie al cargador y la llave del locker al escritorio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d942873f-4500-4823-8efb-664d0d08ad84 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd942873f-4500-4823-8efb-664d0d08ad84',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Take out trash.',
  'Take out trash.',
  25,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'blue',
  'Sacar la basura.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b26641ea-f2f0-43fa-b9f9-2e28a71be8a7 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b26641ea-f2f0-43fa-b9f9-2e28a71be8a7',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Were there any obstacles today?',
  'Were there any obstacles today?',
  26,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Hubo algún obstáculo hoy?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f6d8599b-1915-4c8d-8c15-3334580c9ebb (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f6d8599b-1915-4c8d-8c15-3334580c9ebb',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Did you receive or overhear any member feedback?',
  'Did you receive or overhear any member feedback?',
  27,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Recibiste o escuchaste algún comentario?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 495fa9ee-e3d6-4233-8ef9-a25f918d9e79 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '495fa9ee-e3d6-4233-8ef9-a25f918d9e79',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Any additional notes for management?',
  'Any additional notes for management?',
  28,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Notas adicionales para la gerencia?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c68c3699-7293-4243-856e-90c42e835e16 (Template: ecfbdc24-b68c-4647-b23f-16474e2e198f)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c68c3699-7293-4243-856e-90c42e835e16',
  'ecfbdc24-b68c-4647-b23f-16474e2e198f',
  'Did you experience any issues with the cold tubs?',
  'Did you experience any issues with the cold tubs?',
  29,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Tuviste problemas con las tinas frías?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 95aec103-b7a4-4b97-89d6-d2942f199139 (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '95aec103-b7a4-4b97-89d6-d2942f199139',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Pick up walkie talkie',
  'Pick up walkie talkie',
  0,
  'checkbox',
  '8:30 AM - 9:00 AM',
  NULL,
  'blue',
  'Recoge el walkie-talkie',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 84347e00-6400-46a9-b63a-6de16363bd6b (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '84347e00-6400-46a9-b63a-6de16363bd6b',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Break MUST be taken BEFORE 11 AM. No exceptions. Please sign if understood',
  'Break MUST be taken BEFORE 11 AM. No exceptions. Please sign if understood',
  0,
  'signature',
  '6:30 AM - 7:00 AM',
  NULL,
  'red',
  'El descanso DEBE tomarse ANTES de las 11 AM. Sin excepciones.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: fd120643-2c7a-43a2-98d3-c5668738fc64 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'fd120643-2c7a-43a2-98d3-c5668738fc64',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Pick up Walkie-Talkie',
  'Pick up Walkie-Talkie',
  1,
  'photo',
  '6:30 AM - 7:00 AM',
  NULL,
  'red',
  'Recoger el walkie-talkie',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 69c977bc-b050-4a34-a469-189642657289 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '69c977bc-b050-4a34-a469-189642657289',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  '6:30: turn on sauna.',
  '6:30: turn on sauna.',
  2,
  'photo',
  '6:30 AM - 7:00 AM',
  NULL,
  'red',
  'Enciende la sauna.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e9ba8b46-965c-4cd7-9233-ed5626a16eb6 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e9ba8b46-965c-4cd7-9233-ed5626a16eb6',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Close steam room and sauna doors.',
  'Close steam room and sauna doors.',
  3,
  'checkbox',
  '6:30 AM - 7:00 AM',
  NULL,
  'green',
  'Cierra las puertas del baño de vapor y la sauna.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d0a331f1-4273-44db-a5ce-2a8c9438ca5d (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd0a331f1-4273-44db-a5ce-2a8c9438ca5d',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Collect mop heads, black cleaning towels, all towel sizes from garage.',
  'Collect mop heads, black cleaning towels, all towel sizes from garage.',
  4,
  'checkbox',
  '6:30 AM - 7:00 AM',
  NULL,
  'green',
  'Recoge cabezales del trapeador, trapos negros y toallas del garaje.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b16c8690-d753-4683-81e9-e84779307df3 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b16c8690-d753-4683-81e9-e84779307df3',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Stock medium towels in Cardio Room & large/medium towels in spa.',
  'Stock medium towels in Cardio Room & large/medium towels in spa.',
  5,
  'checkbox',
  '6:30 AM - 7:00 AM',
  NULL,
  'green',
  'Reponer toallas medianas en cardio y toallas grandes/medianas en el spa.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4130c0bc-0215-465c-8ef1-a45c2bb74d96 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4130c0bc-0215-465c-8ef1-a45c2bb74d96',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Cold plunge: remove debris; ensure water is clear/cold; jets working; add ice if needed',
  'Cold plunge: remove debris; ensure water is clear/cold; jets working; add ice if needed',
  6,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'gray',
  'Tina fría: quitar residuos; asegurar agua clara/fría; chorros funcionando.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: fc0288f9-1b9c-43fb-836b-9bc41daf0976 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'fc0288f9-1b9c-43fb-836b-9bc41daf0976',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'ROOFTOP: check for towels & mats for rooftop classes.',
  'ROOFTOP: check for towels & mats for rooftop classes.',
  7,
  'photo',
  '7:00 AM - 8:00 AM',
  NULL,
  'gray',
  'AZOTEA: revisar toallas y tapetes para clases.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d9f777d0-3080-41ce-a719-d4a359c5b70f (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd9f777d0-3080-41ce-a719-d4a359c5b70f',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Clear leaves/debris from rooftop with leaf blower if needed',
  'Clear leaves/debris from rooftop with leaf blower if needed',
  8,
  'yes_no',
  '7:00 AM - 8:00 AM',
  NULL,
  'gray',
  'Limpiar hojas o residuos con el soplador si es necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d4e14f6c-dfb9-4521-85b4-a5ef7817603b (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd4e14f6c-dfb9-4521-85b4-a5ef7817603b',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Start on café by 7:30 (take photo).',
  'Start on café by 7:30 (take photo).',
  9,
  'photo',
  '7:00 AM - 8:00 AM',
  NULL,
  'red',
  'Empieza en la cafetería a las 7:30 (toma foto).',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f1531a04-675d-40be-a6b8-15de667ce3d2 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f1531a04-675d-40be-a6b8-15de667ce3d2',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Café floors: dry as needed & sweep.',
  'Café floors: dry as needed & sweep.',
  10,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'gray',
  'Pisos del café: secar según sea necesario y barrer.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: ae02b169-6207-4806-bb19-dde0ea06e059 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'ae02b169-6207-4806-bb19-dde0ea06e059',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Café cushions: place cushions throughout the space.',
  'Café cushions: place cushions throughout the space.',
  11,
  'checkbox',
  '7:00 AM - 8:00 AM',
  NULL,
  'gray',
  'Cojines del café: colocar cojines en todo el espacio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 57bd2beb-e422-4e5a-b47b-94243e7d4aca (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '57bd2beb-e422-4e5a-b47b-94243e7d4aca',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Towel drop: alert floater via walkie-talkie when ready.',
  'Towel drop: alert floater via walkie-talkie when ready.',
  12,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'orange',
  'Entrega de toallas: avisar al Apoyo General por radio cuando esté listo.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 6b97686f-2d19-4b0c-b619-8406c9bf2749 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '6b97686f-2d19-4b0c-b619-8406c9bf2749',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Recurring tasks: dry floors, restock towels/products, check showers, collect dirty towels, close lockers, restock paper items, tidy counters, top off spa water.',
  'Recurring tasks: dry floors, restock towels/products, check showers, collect dirty towels, close lockers, restock paper items, tidy counters, top off spa water.',
  13,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'orange',
  'Tareas recurrentes: secar pisos, reponer toallas/productos, revisar duchas, recoger toallas sucias, cerrar casilleros.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b317a3ab-1331-4818-a0b0-2c27242c9c50 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b317a3ab-1331-4818-a0b0-2c27242c9c50',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Clean cold tub filter & use skimmer for debris.',
  'Clean cold tub filter & use skimmer for debris.',
  14,
  'checkbox',
  '8:00 AM - 9:00 AM',
  NULL,
  'orange',
  'Limpiar el filtro de la tina fría y usar el colador para residuos.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: dc6932ea-5d34-4217-8681-fae214463ecc (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'dc6932ea-5d34-4217-8681-fae214463ecc',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Complete towel drop as needed.',
  'Complete towel drop as needed.',
  15,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'purple',
  'Completar la entrega de toallas según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b87afda7-f88f-425f-aba1-f9933e96a6fd (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b87afda7-f88f-425f-aba1-f9933e96a6fd',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Recurring tasks as needed.',
  'Recurring tasks as needed.',
  16,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'purple',
  'Tareas recurrentes según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d0a6dfe3-11e4-44b7-9e37-b32a0fc32757 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd0a6dfe3-11e4-44b7-9e37-b32a0fc32757',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Break 10-10:30 AM. MUST be before 11 AM.',
  'Break 10-10:30 AM. MUST be before 11 AM.',
  17,
  'signature',
  '10:00 AM - 11:00 AM',
  NULL,
  'red',
  'Descanso 10-10:30 AM. DEBE ser antes de las 11 AM.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5883cc2b-78ba-482b-b0a8-2fe08ceaa5fa (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5883cc2b-78ba-482b-b0a8-2fe08ceaa5fa',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Complete towel drop as needed.',
  'Complete towel drop as needed.',
  18,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'blue',
  'Completar la entrega de toallas según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c2b4d26b-9d70-49d4-8a91-cf71807cb070 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c2b4d26b-9d70-49d4-8a91-cf71807cb070',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Recurring tasks as needed.',
  'Recurring tasks as needed.',
  19,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'blue',
  'Tareas recurrentes según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d2169f80-45d0-4e2f-939f-e5e637d46b52 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd2169f80-45d0-4e2f-939f-e5e637d46b52',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Clean showers not in use.',
  'Clean showers not in use.',
  20,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'blue',
  'Limpia las duchas que no estén en uso.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 733b24cb-1b75-4013-9539-e47c4bb50f63 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '733b24cb-1b75-4013-9539-e47c4bb50f63',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Complete towel drop as needed.',
  'Complete towel drop as needed.',
  21,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'blue',
  'Completa la entrega de toallas según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b940975d-f5d3-4664-85bd-db5e45273bbe (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b940975d-f5d3-4664-85bd-db5e45273bbe',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Complete recurring tasks as needed.',
  'Complete recurring tasks as needed.',
  22,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'yellow',
  'Realiza las tareas recurrentes según sea necesario.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 3151856f-986a-4c9e-aa21-ba38e2201108 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '3151856f-986a-4c9e-aa21-ba38e2201108',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Clean toilets.',
  'Clean toilets.',
  23,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'yellow',
  'Limpia los baños.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a884ed25-ab01-4a86-9d5e-2e00f95d4b4a (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a884ed25-ab01-4a86-9d5e-2e00f95d4b4a',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Wipe sauna & steam room doors for fingerprints.',
  'Wipe sauna & steam room doors for fingerprints.',
  24,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'yellow',
  'Limpia puertas de sauna y vapor para quitar huellas.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: b2b89067-e160-48a2-8c7e-e156b1a36bb4 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'b2b89067-e160-48a2-8c7e-e156b1a36bb4',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Return Walkie Talkie to charger & locker key to desk',
  'Return Walkie Talkie to charger & locker key to desk',
  25,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'yellow',
  'Regresa el walkie-talkie al cargador y la llave del locker al escritorio.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8f9b63d8-c96e-4da5-b764-8e75cc1b0235 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8f9b63d8-c96e-4da5-b764-8e75cc1b0235',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Take out trash.',
  'Take out trash.',
  26,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'yellow',
  'Saca la basura.',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c1de1cd2-dcb7-493f-a0cc-68661b54b443 (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c1de1cd2-dcb7-493f-a0cc-68661b54b443',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Were there any obstacles today?',
  'Were there any obstacles today?',
  27,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Hubo algún obstáculo hoy?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 35f91db2-6c34-4c65-af27-0410fe70a53e (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '35f91db2-6c34-4c65-af27-0410fe70a53e',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Did you receive or overhear any member feedback?',
  'Did you receive or overhear any member feedback?',
  28,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Escuchaste o recibiste comentarios de algún miembro?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5103b0ab-95e3-459d-aaf6-5931730ba16e (Template: a7c8bdda-a06e-4a65-bf58-a90fa673ae53)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5103b0ab-95e3-459d-aaf6-5931730ba16e',
  'a7c8bdda-a06e-4a65-bf58-a90fa673ae53',
  'Do you have any additional notes for management?',
  'Do you have any additional notes for management?',
  29,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Tienes alguna nota adicional para la gerencia?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9ac2511b-e2f8-45f2-a2c2-ab5e1b5b44db (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9ac2511b-e2f8-45f2-a2c2-ab5e1b5b44db',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Review Class Schedule to Determine Turnover Times',
  'Review Class Schedule to Determine Turnover Times',
  1,
  'checkbox',
  '8:30 AM - 9:00 AM',
  NULL,
  'red',
  'Revisa el horario de clases para determinar los tiempos de cambio de clase.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: c1217a46-adc5-444c-b22d-3994fc4b29f3 (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'c1217a46-adc5-444c-b22d-3994fc4b29f3',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Take dirty towels from the garage down to the basement',
  'Take dirty towels from the garage down to the basement',
  2,
  'checkbox',
  '8:30 AM - 9:00 AM',
  NULL,
  'blue',
  'Lleva las toallas sucias del garaje al sótano',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 53229321-042f-4806-b971-6b83d824ace7 (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '53229321-042f-4806-b971-6b83d824ace7',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Start Laundry',
  'Start Laundry',
  3,
  'checkbox',
  '8:30 AM - 9:00 AM',
  NULL,
  'blue',
  'Empieza a lavar la ropa',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f9891d67-c6e5-4485-96bc-b9fff6262e2c (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f9891d67-c6e5-4485-96bc-b9fff6262e2c',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  4,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 40f9f44e-ce60-4033-b71a-3d5f19709550 (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '40f9f44e-ce60-4033-b71a-3d5f19709550',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Vacuum mezzanine & wet mop private recovery room',
  'Vacuum mezzanine & wet mop private recovery room',
  5,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'orange',
  'Aspirar el entrepiso y trapear la sala de recuperación privada',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: a561ed4c-f49f-48b7-b27a-4c65cd356152 (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'a561ed4c-f49f-48b7-b27a-4c65cd356152',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'FULLY COMPLETE BEFORE 9:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 9:50',
  'FULLY COMPLETE BEFORE 9:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 9:50',
  6,
  'checkbox',
  '9:00 AM - 10:00 AM',
  NULL,
  'red',
  'COMPLETAR TOTALMENTE ANTES DE LAS 9:50 AM: Retire el bote de toallas sucias del elevador; complete la entrega; reabastezca y colóquelo antes de las 9:50.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d5af8f72-1fa4-4ec3-89c7-7be025215b14 (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd5af8f72-1fa4-4ec3-89c7-7be025215b14',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  7,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: d624d897-02ea-4658-91f3-05c4c9cdab91 (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'd624d897-02ea-4658-91f3-05c4c9cdab91',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Rotate Laundry',
  'Rotate Laundry',
  8,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'purple',
  'Cambiar la carga de ropa',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 9094fd59-543d-46e0-8e81-dbb1cc7ad1ad (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '9094fd59-543d-46e0-8e81-dbb1cc7ad1ad',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'FULLY COMPLETE BEFORE 10:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 10:50',
  'FULLY COMPLETE BEFORE 10:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 10:50',
  9,
  'checkbox',
  '10:00 AM - 11:00 AM',
  NULL,
  'red',
  'COMPLETAR TOTALMENTE ANTES DE LAS 10:50 AM: Retire el bote de toallas sucias del elevador; complete la entrega; reabastezca y colóquelo antes de las 10:50.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 42408a6f-27ac-4a30-b6f6-8c422221a119 (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '42408a6f-27ac-4a30-b6f6-8c422221a119',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  10,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 8d625030-176b-47a1-bf61-9ea8accbe4ed (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '8d625030-176b-47a1-bf61-9ea8accbe4ed',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Wipe down all countertop surfaces on both sides of main gym floor',
  'Wipe down all countertop surfaces on both sides of main gym floor',
  11,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'green',
  'Limpiar todas las superficies de las encimeras a ambos lados del gimnasio principal',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 58735235-ac52-4bc2-920c-3ca281bd7c4c (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '58735235-ac52-4bc2-920c-3ca281bd7c4c',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'FULLY COMPLETE BEFORE 11:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 11:50',
  'FULLY COMPLETE BEFORE 11:50 AM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 11:50',
  12,
  'checkbox',
  '11:00 AM - 12:00 PM',
  NULL,
  'red',
  'COMPLETAR TOTALMENTE ANTES DE LAS 11:50 AM: Retire el bote de toallas sucias del elevador; complete la entrega; reabastezca y colóquelo antes de las 11:50.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5a4fde06-9270-40e6-90eb-4c761dc2ae64 (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5a4fde06-9270-40e6-90eb-4c761dc2ae64',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  13,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 5afae25b-9536-4597-aa26-d1a9489dd0b8 (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '5afae25b-9536-4597-aa26-d1a9489dd0b8',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Sweep & mop pilates room',
  'Sweep & mop pilates room',
  14,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'yellow',
  'Barrer y trapear la sala de pilates',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: f443f947-37b3-4741-966b-3c85dfce1733 (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'f443f947-37b3-4741-966b-3c85dfce1733',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'FULLY COMPLETE BEFORE 12:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 12:50',
  'FULLY COMPLETE BEFORE 12:50 PM: Retrieve dirty towel bin from elevator; complete towel drop; restock; place back before 12:50',
  15,
  'checkbox',
  '12:00 PM - 1:00 PM',
  NULL,
  'red',
  'COMPLETAR TOTALMENTE ANTES DE LAS 12:50 PM: Retire el bote de toallas sucias del elevador; complete la entrega; reabastezca y colóquelo antes de las 12:50.',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e1947565-8ae7-40a2-9165-cd077640fd0f (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e1947565-8ae7-40a2-9165-cd077640fd0f',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Class Turnover, if applicable',
  'Class Turnover, if applicable',
  16,
  'checkbox',
  '1:00 PM - 2:15 PM',
  NULL,
  'red',
  'Cambio de clase, si corresponde',
  true,
  true,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e06abb37-9b23-487b-8c29-23b6485d0f1d (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e06abb37-9b23-487b-8c29-23b6485d0f1d',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Wipe down mirrors in main gym floor',
  'Wipe down mirrors in main gym floor',
  17,
  'checkbox',
  '1:00 PM - 2:15 PM',
  NULL,
  'orange',
  'Limpie los espejos del piso principal del gimnasio',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 05f9626e-679c-4787-8891-ea701b490704 (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '05f9626e-679c-4787-8891-ea701b490704',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Check mezzanine bathrooms for cleanliness & restock as needed',
  'Check mezzanine bathrooms for cleanliness & restock as needed',
  18,
  'checkbox',
  '1:00 PM - 2:15 PM',
  NULL,
  'orange',
  'Revisar los baños del entrepiso y reabastecer según sea necesario',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 1b7d9203-c3bc-47b7-87af-6dbb4aa2c950 (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '1b7d9203-c3bc-47b7-87af-6dbb4aa2c950',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Spot sweep / dry mop as needed in main gym floor',
  'Spot sweep / dry mop as needed in main gym floor',
  19,
  'checkbox',
  '1:00 PM - 2:15 PM',
  NULL,
  'orange',
  'Barrer/fregar en seco según sea necesario en el piso del gimnasio principal',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: be2bc88d-6572-4c84-8f6b-728f443af4ee (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'be2bc88d-6572-4c84-8f6b-728f443af4ee',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Check towel stock in all gym areas',
  'Check towel stock in all gym areas',
  20,
  'checkbox',
  '1:00 PM - 2:15 PM',
  NULL,
  'purple',
  'Revisar el stock de toallas en todas las áreas del gimnasio',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 4a3cd894-15a4-4035-96b8-9c07c72fdfec (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '4a3cd894-15a4-4035-96b8-9c07c72fdfec',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Return Walkie Talkie to charger',
  'Return Walkie Talkie to charger',
  21,
  'checkbox',
  '1:00 PM - 2:15 PM',
  NULL,
  'purple',
  'Devolver el walkie-talkie al cargador',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: e8318a1c-2db0-43eb-a036-175bded05e4c (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  'e8318a1c-2db0-43eb-a036-175bded05e4c',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Were there any obstacles today?',
  'Were there any obstacles today?',
  22,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Hubo algún obstáculo hoy?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


COMMIT;
BEGIN;


-- Item: 35468c8f-41d2-4c5a-ac1e-c74c5bd1eb0f (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '35468c8f-41d2-4c5a-ac1e-c74c5bd1eb0f',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Did you receive or overhear any member feedback?',
  'Did you receive or overhear any member feedback?',
  23,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Recibiste o escuchaste algún comentario?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


-- Item: 7c8e1c6c-bd05-4b20-903d-28a941311a83 (Template: cdd9e53a-e618-4000-8a1e-dfd3413592be)
INSERT INTO public.checklist_template_items (
  id, template_id, item_text, task_description, sort_order, 
  task_type, time_hint, category, color, label_spanish,
  required, is_high_priority, is_class_triggered, class_trigger_minutes_after,
  created_at
) VALUES (
  '7c8e1c6c-bd05-4b20-903d-28a941311a83',
  'cdd9e53a-e618-4000-8a1e-dfd3413592be',
  'Do you have any additional notes for management?',
  'Do you have any additional notes for management?',
  24,
  'free_response',
  'End of Shift',
  NULL,
  'gray',
  '¿Tienes alguna nota adicional para la gerencia?',
  false,
  false,
  false,
  NULL,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  item_text = EXCLUDED.item_text,
  task_description = EXCLUDED.task_description,
  sort_order = EXCLUDED.sort_order,
  task_type = EXCLUDED.task_type,
  time_hint = EXCLUDED.time_hint,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  label_spanish = EXCLUDED.label_spanish,
  required = EXCLUDED.required,
  is_high_priority = EXCLUDED.is_high_priority,
  is_class_triggered = EXCLUDED.is_class_triggered,
  class_trigger_minutes_after = EXCLUDED.class_trigger_minutes_after;


COMMIT;

-- Log the import
INSERT INTO public.checklist_migrations_log (migration_name, notes)
VALUES (
  '20260202000003_import_csv_metadata',
  'Imported metadata for all checklist items from CSV export (702 items across 21 templates)'
);
