-- Apply this migration in Supabase Dashboard → SQL Editor
-- This creates the email_verification_codes table required for verification codes

-- Email verification codes table
-- Stores 6-digit verification codes for email verification during signup
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL, -- 6-digit numeric code
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_user_id ON email_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_code ON email_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON email_verification_codes(expires_at);

-- Partial unique index: ensure one active code per email (only when used = FALSE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verification_codes_unique_active 
  ON email_verification_codes(email, code) 
  WHERE used = FALSE;

-- RLS policies
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage codes
DROP POLICY IF EXISTS "Service role can manage codes" ON email_verification_codes;
CREATE POLICY "Service role can manage codes"
  ON email_verification_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);
