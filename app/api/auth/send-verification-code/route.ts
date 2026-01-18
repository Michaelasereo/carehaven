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

  // Check if a code was sent in the last 60 seconds using created_at
  const codeCreatedAt = new Date(latestCode.created_at).getTime()
  const now = Date.now()
  const timeSinceLastCode = now - codeCreatedAt
  
  if (timeSinceLastCode < 60 * 1000) {
    // Less than 60 seconds since last code was sent
    return false
  }

  return true
}

export async function POST(request: Request) {
  try {
    // Validate environment variables
    if (!process.env.BREVO_API_KEY) {
      console.error('❌ BREVO_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Email service is not configured. Please contact support.' },
        { status: 500 }
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase environment variables are missing')
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    const { email, userId } = await request.json()

    // Validate email format
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Validate userId format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 })
    }

    // Rate limiting check
    const canSend = await checkRateLimit(email)
    if (!canSend) {
      return NextResponse.json(
        { error: 'Please wait before requesting another code. You can request a new code in 60 seconds.' },
        { status: 429 }
      )
    }

    // Generate 6-digit verification code
    const code = generateVerificationCode()

    // Store code in database with expiration (15 minutes)
    await storeVerificationCode(userId, email, code)

    // Send verification code email via Brevo
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; text-align: center;">
            <h1 style="color: #0d9488; margin-bottom: 20px;">Verify Your Email</h1>
            <p style="font-size: 16px; margin-bottom: 30px;">
              Your verification code is:
            </p>
            <div style="background-color: #ffffff; border: 2px solid #0d9488; border-radius: 8px; padding: 20px; margin: 20px 0; display: inline-block;">
              <h2 style="color: #0d9488; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: monospace;">${code}</h2>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              This code will expire in 15 minutes.
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
          <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
            This is an automated email from Care Haven. Please do not reply to this email.
          </p>
        </body>
      </html>
    `

    const emailText = `
Verify Your Email

Your verification code is: ${code}

This code will expire in 15 minutes.

If you didn't request this code, please ignore this email.

This is an automated email from Care Haven. Please do not reply to this email.
    `

    try {
      await sendEmail(email, 'Verify Your Email - Care Haven', emailHtml)
      console.log(`✅ Verification code sent to ${email}`)
      console.log(`   Code: ${code} (for debugging only)`)
    } catch (emailError: any) {
      console.error('❌ Error sending verification code email:', emailError)
      console.error('   Error message:', emailError.message)
      console.error('   Error stack:', emailError.stack)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to send verification code. Please try again.'
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

    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent to your email' 
    })
  } catch (error: any) {
    console.error('❌ Error in send-verification-code API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send verification code' },
      { status: 500 }
    )
  }
}
