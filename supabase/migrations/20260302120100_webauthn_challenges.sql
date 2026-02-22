-- WebAuthn assertion challenges (one-time, short-lived)
CREATE TABLE IF NOT EXISTS public.webauthn_challenges (
  challenge_token text PRIMARY KEY,
  challenge text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Allow service role only (edge functions use service role)
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;

-- No policies: only service_role can access (no GRANT to anon/authenticated)
GRANT ALL ON public.webauthn_challenges TO service_role;

-- Optional: index for cleanup of old challenges
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_created_at
  ON public.webauthn_challenges(created_at);
