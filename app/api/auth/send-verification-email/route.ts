import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get user by email using admin API
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
    const userToVerify = users?.find(u => u.email === email)

    if (!userToVerify) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already verified
    if (userToVerify.email_confirmed_at) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    // Send verification email via Supabase native email service
    // Note: SMTP is disabled, using Supabase's built-in email service
    try {
      console.log(`📧 Attempting to send verification email to ${email}...`)
      const { data: resendData, error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (resendError) {
        console.error('❌ Supabase auth.resend() error:', {
          message: resendError.message,
          status: resendError.status,
          name: resendError.name,
        })
        throw resendError
      }

      console.log(`✅ Verification email sent to ${email} via Supabase native email service`)
      console.log(`   Response data:`, resendData)
      return NextResponse.json({ success: true, message: 'Verification email sent' })
    } catch (emailError: any) {
      console.error('❌ Error sending verification email:', {
        message: emailError?.message,
        status: emailError?.status,
        code: emailError?.code,
        name: emailError?.name,
      })
      
      // Check for specific errors and provide helpful messages
      const errorMessage = emailError?.message || 'Unknown error'
      let userFriendlyMessage = 'Failed to send verification email'
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
        userFriendlyMessage = 'Email sending rate limit reached. Please try again in a few minutes.'
      } else if (errorMessage.includes('disabled') || errorMessage.includes('not enabled')) {
        userFriendlyMessage = 'Email confirmations are disabled in Supabase. Please enable them in the dashboard.'
      } else if (errorMessage.includes('invalid')) {
        userFriendlyMessage = 'Invalid email address format.'
      }
      
      return NextResponse.json(
        { 
          error: userFriendlyMessage,
          details: errorMessage,
          code: 'EMAIL_SEND_ERROR',
          status: emailError?.status || 500,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Error in send-verification-email route:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
