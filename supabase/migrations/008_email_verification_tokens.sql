-- Email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

-- Partial unique index: ensure one active token per user (only when used = FALSE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verification_tokens_unique_active 
  ON email_verification_tokens(user_id, token) 
  WHERE used = FALSE;

-- RLS policies
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage tokens
CREATE POLICY "Service role can manage tokens"
  ON email_verification_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);
