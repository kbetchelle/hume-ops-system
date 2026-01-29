-- Create api_credentials table for storing OAuth tokens securely
CREATE TABLE public.api_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_name TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;

-- Only service_role can access this table (no policies = no access for anon/authenticated)
-- Service role bypasses RLS by default

-- Add comment for documentation
COMMENT ON TABLE public.api_credentials IS 'Stores OAuth tokens for external API integrations. Only accessible via service_role.';

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_api_credentials_updated_at
BEFORE UPDATE ON public.api_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();