import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * Generate a verification token for email verification
 */
export async function generateVerificationToken(userId: string): Promise<string> {
  // Create a secure random token
  const randomBytes = crypto.randomBytes(32)
  const token = randomBytes.toString('base64url')
  
  // Store token in database with expiration (24 hours)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)
  
  const { error } = await supabase
    .from('email_verification_tokens')
    .insert({
      user_id: userId,
      token: token,
      expires_at: expiresAt.toISOString(),
    })

  if (error) {
    console.error('Error storing verification token:', error)
    // If table doesn't exist, we'll still return the token
    // but verification will need to work differently
  }

  return token
}

/**
 * Send verification email using Supabase native email service
 * Note: SMTP is disabled, using Supabase's built-in email service
 */
export async function sendVerificationEmail(
  email: string,
  userId: string
): Promise<void> {
  try {
    // Use Supabase's native email verification via auth.resend()
    // This uses Supabase's built-in email service (SMTP disabled)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })

    if (error) {
      console.error('Error sending verification email via Supabase:', error)
      throw error
    }

    console.log(`✅ Verification email sent to ${email} via Supabase native email service`)
  } catch (error) {
    console.error('Error sending verification email:', error)
    throw error
  }
}

/**
 * Verify email token
 */
export async function verifyEmailToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    // Check if token exists and is valid
    const { data, error } = await supabase
      .from('email_verification_tokens')
      .select('user_id, expires_at')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (error || !data) {
      console.error('Token not found or already used:', error)
      return null
    }

    // Check expiration
    if (new Date(data.expires_at) < new Date()) {
      console.error('Token expired')
      return null
    }

    // Mark token as used
    await supabase
      .from('email_verification_tokens')
      .update({ used: true })
      .eq('token', token)

    // Get user email
    const { data: user } = await supabase.auth.admin.getUserById(data.user_id)
    
    if (!user?.user) {
      return null
    }
    
    return {
      userId: data.user_id,
      email: user.user.email || '',
    }
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}
