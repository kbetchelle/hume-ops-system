-- Package Tracking System
-- Allows staff to scan packages, track locations with photos, and notify recipients

-- Create packages table
CREATE TABLE IF NOT EXISTS public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code text NOT NULL,
  recipient_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_name text, -- Fallback for non-users
  status text NOT NULL DEFAULT 'pending_pickup' 
    CHECK (status IN ('pending_pickup', 'picked_up', 'archived')),
  
  -- Timestamps
  arrived_at timestamptz NOT NULL DEFAULT now(),
  picked_up_at timestamptz,
  archived_at timestamptz,
  
  -- Location tracking
  current_location text NOT NULL,
  location_photo_url text NOT NULL, -- Required photo
  
  -- Metadata
  notes text,
  scanned_by_user_id uuid REFERENCES auth.users(id),
  marked_opened_by_user_id uuid REFERENCES auth.users(id),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create package location history table
CREATE TABLE IF NOT EXISTS public.package_location_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid REFERENCES public.packages(id) ON DELETE CASCADE,
  location text NOT NULL,
  location_photo_url text NOT NULL,
  moved_by_user_id uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_packages_recipient ON public.packages(recipient_user_id);
CREATE INDEX idx_packages_status ON public.packages(status);
CREATE INDEX idx_packages_arrived_at ON public.packages(arrived_at DESC);
CREATE INDEX idx_packages_tracking ON public.packages(tracking_code);
CREATE INDEX idx_package_history_package ON public.package_location_history(package_id);

-- Create storage bucket for package photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('package-photos', 'package-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for package-photos bucket
CREATE POLICY "Authenticated users can upload package photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'package-photos');

CREATE POLICY "Anyone can view package photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'package-photos');

CREATE POLICY "Authenticated users can update their uploaded photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'package-photos')
  WITH CHECK (bucket_id = 'package-photos');

CREATE POLICY "Admins can delete package photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'package-photos' 
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up archived packages after 30 days
CREATE OR REPLACE FUNCTION cleanup_archived_packages()
RETURNS void AS $$
BEGIN
  -- Hard delete packages archived 30+ days ago
  DELETE FROM public.packages 
  WHERE status = 'archived' 
    AND archived_at < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Queue package photos for deletion when packages are deleted
CREATE OR REPLACE FUNCTION queue_package_photo_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue main location photo
  IF OLD.location_photo_url IS NOT NULL THEN
    INSERT INTO storage_deletion_queue (bucket_name, file_path)
    VALUES ('package-photos', regexp_replace(OLD.location_photo_url, '^.*/package-photos/', ''));
  END IF;
  
  -- Queue history photos
  INSERT INTO storage_deletion_queue (bucket_name, file_path)
  SELECT 'package-photos', regexp_replace(location_photo_url, '^.*/package-photos/', '')
  FROM public.package_location_history
  WHERE package_id = OLD.id AND location_photo_url IS NOT NULL;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER queue_package_photos_on_delete
  BEFORE DELETE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION queue_package_photo_deletion();

-- RLS Policies for packages table
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all packages"
  ON public.packages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert packages"
  ON public.packages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update packages"
  ON public.packages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only admins can delete packages"
  ON public.packages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for package_location_history table
ALTER TABLE public.package_location_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view package history"
  ON public.package_location_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert package history"
  ON public.package_location_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only admins can delete package history"
  ON public.package_location_history FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add package_arrived notification type (if staff_notifications table exists)
DO $$
BEGIN
  -- This is a soft addition - if the notification system evolves, 
  -- the type will be handled in the application layer
  NULL;
END $$;

-- Schedule cleanup job and reminders only if pg_cron is available (cron schema exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cron') THEN
    PERFORM cron.schedule(
      'cleanup-archived-packages',
      '0 2 * * *',
      'SELECT cleanup_archived_packages();'
    );
    PERFORM cron.schedule(
      'send-package-reminders',
      '0 9 * * *',
      $cron$
      SELECT net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/send-package-reminders',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
        )
      );
      $cron$
    );
  END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON public.packages TO authenticated;
GRANT ALL ON public.package_location_history TO authenticated;
