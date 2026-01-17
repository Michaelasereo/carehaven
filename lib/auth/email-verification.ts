import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/client'
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
 * Send verification email using Resend
 */
export async function sendVerificationEmail(
  email: string,
  userId: string
): Promise<void> {
  try {
    const token = await generateVerificationToken(userId)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - Care Haven</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #0d9488; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Care Haven</h1>
          </div>
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #111827; margin-top: 0;">Verify Your Email Address</h2>
            <p>Thank you for signing up for Care Haven! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #0d9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't create an account with Care Haven, please ignore this email.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Care Haven. All rights reserved.</p>
          </div>
        </body>
      </html>
    `

    await sendEmail(
      email,
      'Verify Your Email Address - Care Haven',
      htmlContent
    )
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
