import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * Generate a 6-digit numeric verification code
 */
export function generateVerificationCode(): string {
  // Generate a random 6-digit code (000000 to 999999)
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  return code
}

/**
 * Store verification code in database with expiration (15 minutes)
 */
export async function storeVerificationCode(
  userId: string,
  email: string,
  code: string
): Promise<void> {
  // Set expiration to 15 minutes from now
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 15)

  // Invalidate any existing unused codes for this email
  await supabase
    .from('email_verification_codes')
    .update({ used: true })
    .eq('email', email)
    .eq('used', false)

  // Insert new code
  const { error } = await supabase
    .from('email_verification_codes')
    .insert({
      user_id: userId,
      email: email,
      code: code,
      expires_at: expiresAt.toISOString(),
      used: false,
    })

  if (error) {
    console.error('Error storing verification code:', error)
    throw new Error(`Failed to store verification code: ${error.message}`)
  }
}

/**
 * Verify code is valid, not expired, and not used
 * Returns user_id and email if valid, null otherwise
 */
export async function verifyCode(
  code: string,
  email: string
): Promise<{ userId: string; email: string } | null> {
  try {
    // Find the code
    const { data, error } = await supabase
      .from('email_verification_codes')
      .select('id, user_id, email, expires_at, used')
      .eq('code', code)
      .eq('email', email)
      .eq('used', false)
      .single()

    if (error || !data) {
      console.error('Code not found or already used:', error)
      return null
    }

    // Check expiration
    if (new Date(data.expires_at) < new Date()) {
      console.error('Verification code expired')
      return null
    }

    return {
      userId: data.user_id,
      email: data.email,
    }
  } catch (error) {
    console.error('Error verifying code:', error)
    return null
  }
}

/**
 * Mark verification code as used
 */
export async function markCodeAsUsed(code: string, email: string): Promise<void> {
  const { error } = await supabase
    .from('email_verification_codes')
    .update({ used: true })
    .eq('code', code)
    .eq('email', email)

  if (error) {
    console.error('Error marking code as used:', error)
    throw new Error(`Failed to mark code as used: ${error.message}`)
  }
}

/**
 * Get the latest unused code for an email (for resend logic)
 */
export async function getLatestCodeForEmail(
  email: string
): Promise<{ code: string; expires_at: string; created_at: string } | null> {
  const { data, error } = await supabase
    .from('email_verification_codes')
    .select('code, expires_at, created_at')
    .eq('email', email)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    return null
  }

  return data
}
