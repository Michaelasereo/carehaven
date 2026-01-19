-- Create auto_signin_tokens table for post-verification automatic sign-in
-- These tokens are one-time use and expire quickly (5 minutes)

CREATE TABLE IF NOT EXISTS auto_signin_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick token lookup
CREATE INDEX IF NOT EXISTS idx_auto_signin_tokens_token ON auto_signin_tokens(token);

-- Index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_auto_signin_tokens_expires_at ON auto_signin_tokens(expires_at);

-- Enable RLS
ALTER TABLE auto_signin_tokens ENABLE ROW LEVEL SECURITY;

-- Only server (service role) should access this table
-- No client-side access needed
CREATE POLICY "Service role only" ON auto_signin_tokens
  FOR ALL USING (false);

-- Grant access to service role
GRANT ALL ON auto_signin_tokens TO service_role;
