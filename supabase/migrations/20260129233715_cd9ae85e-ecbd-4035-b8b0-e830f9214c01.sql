-- Rename members table to arketa_clients
ALTER TABLE IF EXISTS public.members RENAME TO arketa_clients;

-- Rename member_sync_log table to client_sync_log
ALTER TABLE IF EXISTS public.member_sync_log RENAME TO client_sync_log;

-- Update foreign key references in member_notes (points to members table)
-- The FK constraint name is member_notes_member_id_fkey
ALTER TABLE IF EXISTS public.member_notes 
  DROP CONSTRAINT IF EXISTS member_notes_member_id_fkey;

ALTER TABLE IF EXISTS public.member_notes 
  ADD CONSTRAINT member_notes_member_id_fkey 
  FOREIGN KEY (member_id) REFERENCES public.arketa_clients(id);

-- Update foreign key references in member_communications (points to members table)
ALTER TABLE IF EXISTS public.member_communications 
  DROP CONSTRAINT IF EXISTS member_communications_member_id_fkey;

ALTER TABLE IF EXISTS public.member_communications 
  ADD CONSTRAINT member_communications_member_id_fkey 
  FOREIGN KEY (member_id) REFERENCES public.arketa_clients(id);

-- Update foreign key references in activity_logs (points to members table)
ALTER TABLE IF EXISTS public.activity_logs 
  DROP CONSTRAINT IF EXISTS activity_logs_member_id_fkey;

ALTER TABLE IF EXISTS public.activity_logs 
  ADD CONSTRAINT activity_logs_member_id_fkey 
  FOREIGN KEY (member_id) REFERENCES public.arketa_clients(id);

-- Update sync_schedule entries from arketa_members to arketa_clients
UPDATE public.sync_schedule 
SET sync_type = 'arketa_clients' 
WHERE sync_type = 'arketa_members';