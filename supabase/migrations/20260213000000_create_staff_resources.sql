-- ============================================================================
-- Staff Resources: Quick Link Groups, Quick Link Items, Resource Pages
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Tables
-- --------------------------------------------------------------------------

-- Quick Link Groups: card containers assigned to roles
CREATE TABLE public.quick_link_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  assigned_roles app_role[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Quick Link Items: individual links inside a group
CREATE TABLE public.quick_link_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.quick_link_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Resource Pages: rich text content pages
CREATE TABLE public.resource_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  assigned_roles app_role[] NOT NULL DEFAULT '{}',
  is_published boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 2. Enable RLS
-- --------------------------------------------------------------------------

ALTER TABLE public.quick_link_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_link_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_pages    ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- 3. RLS Policies — quick_link_groups
-- --------------------------------------------------------------------------

-- Managers/admins: full CRUD
CREATE POLICY "quick_link_groups_manager_select"
  ON public.quick_link_groups FOR SELECT
  USING (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "quick_link_groups_manager_insert"
  ON public.quick_link_groups FOR INSERT
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "quick_link_groups_manager_update"
  ON public.quick_link_groups FOR UPDATE
  USING (public.is_manager_or_admin(auth.uid()))
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "quick_link_groups_manager_delete"
  ON public.quick_link_groups FOR DELETE
  USING (public.is_manager_or_admin(auth.uid()));

-- Staff: read groups assigned to their role
CREATE POLICY "quick_link_groups_staff_select"
  ON public.quick_link_groups FOR SELECT
  USING (public.user_has_any_role(auth.uid(), assigned_roles));

-- --------------------------------------------------------------------------
-- 4. RLS Policies — quick_link_items
-- --------------------------------------------------------------------------

-- Managers/admins: full CRUD
CREATE POLICY "quick_link_items_manager_select"
  ON public.quick_link_items FOR SELECT
  USING (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "quick_link_items_manager_insert"
  ON public.quick_link_items FOR INSERT
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "quick_link_items_manager_update"
  ON public.quick_link_items FOR UPDATE
  USING (public.is_manager_or_admin(auth.uid()))
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "quick_link_items_manager_delete"
  ON public.quick_link_items FOR DELETE
  USING (public.is_manager_or_admin(auth.uid()));

-- Staff: read items whose parent group is assigned to their role
CREATE POLICY "quick_link_items_staff_select"
  ON public.quick_link_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quick_link_groups g
      WHERE g.id = quick_link_items.group_id
        AND public.user_has_any_role(auth.uid(), g.assigned_roles)
    )
  );

-- --------------------------------------------------------------------------
-- 5. RLS Policies — resource_pages
-- --------------------------------------------------------------------------

-- Managers/admins: full CRUD
CREATE POLICY "resource_pages_manager_select"
  ON public.resource_pages FOR SELECT
  USING (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "resource_pages_manager_insert"
  ON public.resource_pages FOR INSERT
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "resource_pages_manager_update"
  ON public.resource_pages FOR UPDATE
  USING (public.is_manager_or_admin(auth.uid()))
  WITH CHECK (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "resource_pages_manager_delete"
  ON public.resource_pages FOR DELETE
  USING (public.is_manager_or_admin(auth.uid()));

-- Staff: read published pages assigned to their role
CREATE POLICY "resource_pages_staff_select"
  ON public.resource_pages FOR SELECT
  USING (
    is_published = true
    AND public.user_has_any_role(auth.uid(), assigned_roles)
  );

-- --------------------------------------------------------------------------
-- 6. Indexes
-- --------------------------------------------------------------------------

-- GIN indexes on role arrays for fast containment checks
CREATE INDEX idx_quick_link_groups_assigned_roles
  ON public.quick_link_groups USING gin (assigned_roles);

CREATE INDEX idx_resource_pages_assigned_roles
  ON public.resource_pages USING gin (assigned_roles);

-- btree indexes for ordering and lookups
CREATE INDEX idx_quick_link_groups_display_order
  ON public.quick_link_groups (display_order);

CREATE INDEX idx_quick_link_items_group_id
  ON public.quick_link_items (group_id);

CREATE INDEX idx_quick_link_items_display_order
  ON public.quick_link_items (display_order);

CREATE INDEX idx_resource_pages_is_published
  ON public.resource_pages (is_published);

-- --------------------------------------------------------------------------
-- 7. Triggers — auto-update updated_at
-- --------------------------------------------------------------------------

CREATE TRIGGER update_quick_link_groups_updated_at
  BEFORE UPDATE ON public.quick_link_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quick_link_items_updated_at
  BEFORE UPDATE ON public.quick_link_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resource_pages_updated_at
  BEFORE UPDATE ON public.resource_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- --------------------------------------------------------------------------
-- 8. Seed Data — Concierge Quick Links (7 groups, 40 links)
-- --------------------------------------------------------------------------

DO $$
DECLARE
  _group_id uuid;
BEGIN

  -- Group 1: Temporary Memberships
  INSERT INTO public.quick_link_groups (title, display_order, assigned_roles)
  VALUES ('Temporary Memberships', 1, '{concierge}')
  RETURNING id INTO _group_id;

  INSERT INTO public.quick_link_items (group_id, name, url, display_order) VALUES
    (_group_id, 'Day Pass', 'https://hume.la/daypass', 1),
    (_group_id, 'One Week Pass', 'https://app.arketa.co/humeprojects/pricing/checkout/PuixJmIY8UZUOfPuc1RZ', 2),
    (_group_id, 'Two Week Pass', 'https://app.arketa.co/humeprojects/pricing/checkout/4nV9AtDrEPJgnhj2T23v', 3),
    (_group_id, 'Month Pass', 'https://app.arketa.co/humeprojects/pricing/checkout/n94aKHh6oDotnhR5pLjv', 4),
    (_group_id, 'Temp Pass Questionnaire', 'https://hume.la/tempmembership', 5);

  -- Group 2: Membership & Passes
  INSERT INTO public.quick_link_groups (title, display_order, assigned_roles)
  VALUES ('Membership & Passes', 2, '{concierge}')
  RETURNING id INTO _group_id;

  INSERT INTO public.quick_link_items (group_id, name, url, display_order) VALUES
    (_group_id, 'Phase 2 Payment', 'https://app.arketa.co/humeprojects/pricing/checkout/jj7mlhtpv7SylbzrKHDF', 1),
    (_group_id, 'Phase 3 Application (Pt 1)', 'https://hume.la/apply', 2),
    (_group_id, 'Phase 3 Application (Pt 2 - CC Info)', 'https://app.arketa.co/humeprojects/pricing/checkout/TF7S5VWOvSYPPoh20BfL', 3),
    (_group_id, 'Phase 3 Annual', 'https://app.arketa.co/humeprojects/pricing/checkout/lyykBfqD7ByVZqxSJIjZ', 4),
    (_group_id, 'Pause Policy', 'https://hume.la/pausepolicy', 5);

  -- Group 3: Tours & Registration
  INSERT INTO public.quick_link_groups (title, display_order, assigned_roles)
  VALUES ('Tours & Registration', 3, '{concierge}')
  RETURNING id INTO _group_id;

  INSERT INTO public.quick_link_items (group_id, name, url, display_order) VALUES
    (_group_id, 'Club Tour Schedule', 'https://calendly.com/humela/tour/?month=2025-06', 1),
    (_group_id, 'Tour Registration Form', 'https://app.arketa.co/humeprojects/intake-form/8ulXmvYgoqjNyd3o9BiK', 2),
    (_group_id, 'Guest Registration', 'https://hume.la/guestpass', 3),
    (_group_id, 'Cafe Guest Form/Waiver', 'https://app.arketa.co/humeprojects/intake-form/gbDPkFV66FYKVwCGwjXe', 4),
    (_group_id, 'Dylan Gym Floor Walkthrough', 'https://calendly.com/humela/club-tour-clone?back=1&month=2025-09', 5),
    (_group_id, 'Class Schedule', 'https://app.arketa.co/humeprojects/schedule', 6);

  -- Group 4: Private Sessions & Appointments
  INSERT INTO public.quick_link_groups (title, display_order, assigned_roles)
  VALUES ('Private Sessions & Appointments', 4, '{concierge}')
  RETURNING id INTO _group_id;

  INSERT INTO public.quick_link_items (group_id, name, url, display_order) VALUES
    (_group_id, 'Non-Member Private Session Purchase', 'https://app.arketa.co/humeprojects/pricing/checkout/cQahytIcDz2JJcsKs33B', 1),
    (_group_id, 'Private Appt Scheduling (General)', 'https://app.arketa.co/humeprojects/privates/by-service', 2),
    (_group_id, 'Massage Availability (Any Therapist)', 'https://app.arketa.co/humeprojects/privates/by-service/OKbSHlmC3G7H8PEjO90n/date?instructorId=any&locationId=ZpbZcKknSQeHKmmtYtes&roomId=any', 3),
    (_group_id, 'Personal Training Availability', 'https://app.arketa.co/humeprojects/privates/by-service/UB9vTC8QIdZeF3fuikCK/date?instructorId=any&locationId=ZpbZcKknSQeHKmmtYtes&roomId=any&calendarId=&date=2026-01-13&time=', 4),
    (_group_id, 'Trainer/Specialist Availability', 'https://docs.google.com/spreadsheets/d/1_xrQKcHF095-YBkPTLfd6m9MajdlGe3gfmFXarGmlHQ/edit?usp=sharing', 5),
    (_group_id, 'IV Therapy Booking', 'https://hume.nomadmd.app', 6),
    (_group_id, 'Jenna Consultation', 'https://calendly.com/hume-jenna/consult?month=2026-01', 7),
    (_group_id, 'Trainer Bios', 'https://hume.la/trainers', 8),
    (_group_id, 'Q-Intake Form for HBOT & FB Pro', 'https://intakeq.com/new/hhwini/', 9);

  -- Group 5: Events & Gifts
  INSERT INTO public.quick_link_groups (title, display_order, assigned_roles)
  VALUES ('Events & Gifts', 5, '{concierge}')
  RETURNING id INTO _group_id;

  INSERT INTO public.quick_link_items (group_id, name, url, display_order) VALUES
    (_group_id, 'Gift Card', 'https://app.arketa.co/humeprojects/gifting', 1),
    (_group_id, 'Event Inquiries', 'https://hume.la/events', 2);

  -- Group 6: Trackers & References
  INSERT INTO public.quick_link_groups (title, display_order, assigned_roles)
  VALUES ('Trackers & References', 6, '{concierge}')
  RETURNING id INTO _group_id;

  INSERT INTO public.quick_link_items (group_id, name, url, display_order) VALUES
    (_group_id, 'Cancellation Tracker', 'https://docs.google.com/spreadsheets/d/1OA5iIdJyG2lDOt3hRp-Z3yuHSobfeEm80MEjQtw2GGw/edit?usp=sharing', 1),
    (_group_id, 'Lost and Found Tracker', 'https://docs.google.com/spreadsheets/d/1IcW5S8pdyhMdFlQFIGupfdTM2x74CiIUcoVqOAPQKEo/edit?usp=sharing', 2),
    (_group_id, 'OSEA Product Reference', 'https://docs.google.com/document/d/16wXDYQDj2CmhqQpxnCHcg0f5-czo3jFbIhQ0mWGi9y0/edit?usp=sharing', 3),
    (_group_id, 'Hume + Mastercard Overview', 'https://docs.google.com/document/d/1C4uWKLM4y8Eksfyh20lx8ESlqdPknaVoP_oGnESFmQc/edit?usp=sharing', 4),
    (_group_id, 'FOH Closet Index', 'https://docs.google.com/spreadsheets/d/1gPrH9n9eLIps3TYQvdRTA5_ZrcPJuvNQIAU39Sb0AQE/edit?gid=1763833801#gid=1763833801', 5),
    (_group_id, 'Garage Inventory Index', 'https://docs.google.com/spreadsheets/d/17XPgYQw2UHran4cimgwU-r1xUOnfzPTkQH7nLZhBOTE/edit?usp=sharing', 6),
    (_group_id, 'Retail Inventory Report', 'https://docs.google.com/spreadsheets/d/1mpFmLfurC2muE7zXncab5gns4zuZdlH06MSG7dKs6HE/edit?usp=sharing', 7),
    (_group_id, 'Equipment Attachments', 'https://docs.google.com/spreadsheets/d/1IBBDLpNQ16rprnQuvXpfOgJXS0w1Q18OJj6Hq390dao/edit?usp=sharing', 8),
    (_group_id, 'Private Session Pricing', 'https://docs.google.com/document/d/1YsjH2ZkRqVw6ABPhmlqwcS-kVEbD-cuhPjXxhusNWcY/edit?usp=sharing', 9),
    (_group_id, 'Weekly Updates', 'https://docs.google.com/document/d/1ecAGndTbNCg7g9p-8mKY0N8-bnuoiF_x/edit?usp=sharing&ouid=111370512065880803227&rtpof=true&sd=true', 10);

  -- Group 7: Treatment & Equipment Guides
  INSERT INTO public.quick_link_groups (title, display_order, assigned_roles)
  VALUES ('Treatment & Equipment Guides', 7, '{concierge}')
  RETURNING id INTO _group_id;

  INSERT INTO public.quick_link_items (group_id, name, url, display_order) VALUES
    (_group_id, 'Balancer Pro Tutorial', 'https://docs.google.com/document/d/1dOm4-eHkG5TIMQfIetPcAlxjkadZDB0OTRUqGVOcApU/edit?usp=sharing', 1),
    (_group_id, 'HBOT Tutorial', 'https://docs.google.com/document/d/18yqBLWGwfvLU8H2AV-7FCzslb91DHihh99uQNi8B8K4/edit?usp=sharing', 2),
    (_group_id, 'Detox Rebecca Treatment Overview', 'https://docs.google.com/document/d/1AH0wA0Q_8nItv6xPGaTrMY3xf7DqNJFaFXYnHEk3GO4/edit?tab=t.0#heading=h.9trcv997yfgb', 3);

END $$;
