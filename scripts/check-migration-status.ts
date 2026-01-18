/**
 * Check if email_verification_codes migration has been applied
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function checkMigration() {
  console.log('🔍 Checking email_verification_codes table status...\n')

  try {
    // Try to query the table directly
    const { data, error } = await supabase
      .from('email_verification_codes')
      .select('count')
      .limit(1)
    
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        console.error('❌ Table does NOT exist or not in schema cache')
        console.log('\n💡 SOLUTION: Apply the migration')
        console.log('\nOption 1: Via Supabase Dashboard')
        console.log('1. Go to Supabase Dashboard → SQL Editor')
        console.log('2. Copy contents of: supabase/migrations/013_email_verification_codes.sql')
        console.log('3. Paste and run the SQL')
        
        console.log('\nOption 2: Via Supabase CLI')
        console.log('Run: supabase migration up')
        
        console.log('\nOption 3: Manual SQL')
        console.log('Run this in Supabase SQL Editor:')
        console.log(`
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_user_id ON email_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_code ON email_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON email_verification_codes(expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verification_codes_unique_active 
  ON email_verification_codes(email, code) 
  WHERE used = FALSE;

ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage codes"
  ON email_verification_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);
        `)
        return
      } else {
        console.error('❌ Error checking table:', error.message)
        return
      }
    }

    console.log('✅ Table exists and is accessible!')
    console.log('   If emails still not working, check:')
    console.log('   1. Sender email verification in Brevo')
    console.log('   2. Spam folder')
    console.log('   3. Rate limiting (60 second cooldown)')
    console.log('   4. Server logs for API errors')
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message)
  }
}

checkMigration()
