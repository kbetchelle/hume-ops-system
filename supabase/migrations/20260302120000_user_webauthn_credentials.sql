-- WebAuthn / passkey credentials for biometric login
CREATE TABLE IF NOT EXISTS public.user_webauthn_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id text NOT NULL,
  public_key text NOT NULL,
  device_name text,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE(user_id, credential_id)
);

CREATE INDEX IF NOT EXISTS idx_user_webauthn_credentials_user_id
  ON public.user_webauthn_credentials(user_id);

ALTER TABLE public.user_webauthn_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own webauthn credentials" ON public.user_webauthn_credentials;
CREATE POLICY "Users can manage own webauthn credentials"
  ON public.user_webauthn_credentials
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_webauthn_credentials TO authenticated;
GRANT ALL ON public.user_webauthn_credentials TO service_role;
