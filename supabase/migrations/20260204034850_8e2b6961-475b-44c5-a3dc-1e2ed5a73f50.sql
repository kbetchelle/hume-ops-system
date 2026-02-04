-- Add role_category column to page_dev_status table
ALTER TABLE public.page_dev_status 
ADD COLUMN role_category TEXT DEFAULT '';

-- Update existing records with role categories
UPDATE public.page_dev_status SET role_category = 'Auth' WHERE page_path IN ('/', '/signup', '/onboarding');
UPDATE public.page_dev_status SET role_category = 'Admin' WHERE page_path LIKE '/dashboard/admin%' OR page_path IN ('/dashboard/staff-announcements', '/dashboard/sling-users', '/dashboard/api-data-mapping', '/dashboard/backfill', '/dashboard/user-management', '/dashboard/api-syncing');
UPDATE public.page_dev_status SET role_category = 'Manager' WHERE page_path LIKE '/dashboard/manager%';
UPDATE public.page_dev_status SET role_category = 'Concierge' WHERE page_path LIKE '/dashboard/concierge%';
UPDATE public.page_dev_status SET role_category = 'Trainer' WHERE page_path LIKE '/dashboard/trainer%';
UPDATE public.page_dev_status SET role_category = 'Spa' WHERE page_path LIKE '/dashboard/spa%';
UPDATE public.page_dev_status SET role_category = 'Floater' WHERE page_path LIKE '/dashboard/floater%';
UPDATE public.page_dev_status SET role_category = 'Cafe' WHERE page_path LIKE '/dashboard/cafe%';
UPDATE public.page_dev_status SET role_category = 'Members' WHERE page_path LIKE '/dashboard/members%';
UPDATE public.page_dev_status SET role_category = 'Shared' WHERE page_path IN ('/dashboard/checklists', '/dashboard/my-checklists', '/dashboard/communications', '/dashboard/member-communications', '/dashboard/shift-report', '/dashboard/reports', '/dashboard/training-plans', '/dashboard/facility', '/dashboard/analytics');
UPDATE public.page_dev_status SET role_category = 'Public' WHERE page_path LIKE '/plan/%';