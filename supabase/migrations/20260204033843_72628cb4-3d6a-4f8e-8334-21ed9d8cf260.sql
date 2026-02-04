-- Clear existing pages and insert all application pages with estimated statuses
DELETE FROM public.page_dev_status;

INSERT INTO public.page_dev_status (page_title, page_path, status) VALUES
-- Auth Pages
('Login', '/', 'completed'),
('Signup', '/signup', 'completed'),
('Onboarding', '/onboarding', 'completed'),

-- Role Dashboards
('Admin Dashboard', '/dashboard/admin', 'in_progress'),
('Manager Dashboard', '/dashboard/manager', 'in_progress'),
('Concierge Dashboard', '/dashboard/concierge', 'finishing_touches'),
('Trainer Dashboard', '/dashboard/trainer', 'in_progress'),
('Spa Dashboard', '/dashboard/spa', 'in_progress'),
('Floater Dashboard', '/dashboard/floater', 'in_progress'),
('Cafe Dashboard', '/dashboard/cafe', 'in_progress'),

-- Members Pages
('All Clients', '/dashboard/members/all-clients', 'finishing_touches'),
('Guests', '/dashboard/members/guests', 'in_progress'),
('Application Submitted', '/dashboard/members/application-submitted', 'in_progress'),
('Waitlist', '/dashboard/members/waitlist', 'in_progress'),
('Member Onboarding', '/dashboard/members/onboarding', 'in_progress'),
('Subscription Active', '/dashboard/members/subscription-active', 'in_progress'),
('Subscription Past Due', '/dashboard/members/subscription-past-due', 'in_progress'),
('Temporary Memberships', '/dashboard/members/temporary-memberships', 'in_progress'),
('Pauses', '/dashboard/members/pauses', 'in_progress'),
('Cancellations', '/dashboard/members/cancellations', 'in_progress'),

-- Feature Pages
('Checklists Management', '/dashboard/checklists', 'finishing_touches'),
('My Checklists', '/dashboard/my-checklists', 'finishing_touches'),
('Communications', '/dashboard/communications', 'in_progress'),
('Member Communications', '/dashboard/member-communications', 'in_progress'),
('Shift Report', '/dashboard/shift-report', 'finishing_touches'),
('Reports', '/dashboard/reports', 'in_progress'),
('Training Plans', '/dashboard/training-plans', 'in_progress'),
('Facility Management', '/dashboard/facility', 'in_progress'),
('Analytics', '/dashboard/analytics', 'in_progress'),

-- Admin Pages
('Staff Announcements', '/dashboard/staff-announcements', 'finishing_touches'),
('Sling User Management', '/dashboard/sling-users', 'completed'),
('API Data Mapping', '/dashboard/api-data-mapping', 'in_progress'),
('Backfill Manager', '/dashboard/backfill', 'finishing_touches'),
('User Management', '/dashboard/user-management', 'completed'),
('API Syncing', '/dashboard/api-syncing', 'finishing_touches'),

-- Public Pages
('Public Plan View', '/plan/:shareSlug', 'completed');