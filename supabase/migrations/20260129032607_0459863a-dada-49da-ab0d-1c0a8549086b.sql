
-- Create announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  target_roles app_role[] NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create announcement read status table
CREATE TABLE public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Create documents table
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  target_roles app_role[] NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create function to check if user has any of the target roles
CREATE OR REPLACE FUNCTION public.user_has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- Announcements policies
CREATE POLICY "Managers can create announcements"
ON public.announcements
FOR INSERT
WITH CHECK (is_manager_or_admin(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can view announcements for their roles"
ON public.announcements
FOR SELECT
USING (
  is_manager_or_admin(auth.uid()) 
  OR user_has_any_role(auth.uid(), target_roles)
);

CREATE POLICY "Creators can update their announcements"
ON public.announcements
FOR UPDATE
USING (created_by = auth.uid() AND is_manager_or_admin(auth.uid()));

CREATE POLICY "Creators can delete their announcements"
ON public.announcements
FOR DELETE
USING (created_by = auth.uid() AND is_manager_or_admin(auth.uid()));

-- Announcement reads policies
CREATE POLICY "Users can mark announcements as read"
ON public.announcement_reads
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own read status"
ON public.announcement_reads
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own read status"
ON public.announcement_reads
FOR DELETE
USING (user_id = auth.uid());

-- Documents policies
CREATE POLICY "Managers can create documents"
ON public.documents
FOR INSERT
WITH CHECK (is_manager_or_admin(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can view documents for their roles"
ON public.documents
FOR SELECT
USING (
  is_manager_or_admin(auth.uid()) 
  OR user_has_any_role(auth.uid(), target_roles)
);

CREATE POLICY "Creators can update their documents"
ON public.documents
FOR UPDATE
USING (created_by = auth.uid() AND is_manager_or_admin(auth.uid()));

CREATE POLICY "Creators can delete their documents"
ON public.documents
FOR DELETE
USING (created_by = auth.uid() AND is_manager_or_admin(auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Managers can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'documents' AND is_manager_or_admin(auth.uid()));

CREATE POLICY "Managers can update their documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'documents' AND is_manager_or_admin(auth.uid()));

CREATE POLICY "Managers can delete documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'documents' AND is_manager_or_admin(auth.uid()));

CREATE POLICY "Authenticated users can view documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
