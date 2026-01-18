import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateVerificationCode, storeVerificationCode, getLatestCodeForEmail } from '@/lib/auth/verification-code'
import { sendEmail } from '@/lib/email/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * Rate limiting: prevent sending too many codes (max 1 code per 60 seconds per email)
 */
async function checkRateLimit(email: string): Promise<boolean> {
  const latestCode = await getLatestCodeForEmail(email)
  
  if (!latestCode) {
    return true // No recent code, allow
  }

  // Check if a code was sent in the last 60 seconds
  const codeAge = Date.now() - new Date(latestCode.expires_at).getTime() + (15 * 60 * 1000) // Time since creation
  
  if (codeAge < 60 * 1000) {
    // Less than 60 seconds since last code was sent
    return false
  }

  return true
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ 
        success: true, 
        message: 'If an account exists with this email, a password reset code has been sent.' 
      })
    }

    const userId = profile.id

    // Rate limiting check
    const canSend = await checkRateLimit(email)
    if (!canSend) {
      return NextResponse.json(
        { error: 'Please wait before requesting another code. You can request a new code in 60 seconds.' },
        { status: 429 }
      )
    }

    // Generate 6-digit reset code
    const code = generateVerificationCode()

    // Store code in database with expiration (15 minutes)
    await storeVerificationCode(userId, email, code)

    // Build reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password/confirm?code=${code}&email=${encodeURIComponent(email)}`

    // Send password reset code email via Brevo
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; text-align: center;">
            <h1 style="color: #0d9488; margin-bottom: 20px;">Reset Your Password</h1>
            <p style="font-size: 16px; margin-bottom: 30px;">
              Your password reset code is:
            </p>
            <div style="background-color: #ffffff; border: 2px solid #0d9488; border-radius: 8px; padding: 20px; margin: 20px 0; display: inline-block;">
              <h2 style="color: #0d9488; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: monospace;">${code}</h2>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Or click the link below to reset your password:
            </p>
            <div style="margin: 20px 0;">
              <a href="${resetUrl}" style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              This code will expire in 15 minutes.
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">
              If you didn't request this password reset, please ignore this email.
            </p>
          </div>
          <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
            This is an automated email from Care Haven. Please do not reply to this email.
          </p>
        </body>
      </html>
    `

    const emailText = `
Reset Your Password

Your password reset code is: ${code}

Or visit this link to reset your password: ${resetUrl}

This code will expire in 15 minutes.

If you didn't request this password reset, please ignore this email.

This is an automated email from Care Haven. Please do not reply to this email.
    `

    try {
      await sendEmail(email, 'Reset Your Password - Care Haven', emailHtml)
      console.log(`✅ Password reset code sent to ${email}`)
      console.log(`   Code: ${code} (for debugging only)`)
    } catch (emailError: any) {
      console.error('❌ Error sending password reset code email:', emailError)
      console.error('   Error message:', emailError.message)
      console.error('   Error stack:', emailError.stack)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to send password reset code. Please try again.'
      if (emailError.message?.includes('BREVO_API_KEY')) {
        errorMessage = 'Email service not configured. Please contact support.'
      } else if (emailError.message?.includes('sender') || emailError.message?.includes('unverified')) {
        errorMessage = 'Sender email not verified. Please verify the sender email in Brevo dashboard.'
      } else if (emailError.message?.includes('rate limit')) {
        errorMessage = 'Too many emails sent. Please wait a moment and try again.'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: emailError.message, // Include details for debugging
        },
        { status: 500 }
      )
    }

    // Return success message (don't reveal if user exists)
    return NextResponse.json({ 
      success: true, 
      message: 'If an account exists with this email, a password reset code has been sent.' 
    })
  } catch (error: any) {
    console.error('❌ Error in send-reset-code API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send password reset code' },
      { status: 500 }
    )
  }
}
