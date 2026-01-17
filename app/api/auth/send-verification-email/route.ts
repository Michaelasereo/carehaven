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

    // Send verification email via Brevo (using Supabase's native resend)
    // Note: This uses Supabase's built-in resend which sends via Brevo SMTP
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (resendError) {
        throw resendError
      }

      console.log(`✅ Verification email sent to ${email} via Supabase (Brevo SMTP)`)
      return NextResponse.json({ success: true, message: 'Verification email sent' })
    } catch (emailError: any) {
      console.error('❌ Error sending verification email:', emailError)
      
      // Check for specific errors
      const errorMessage = emailError?.message || 'Unknown error'
      
      return NextResponse.json(
        { 
          error: 'Failed to send verification email',
          details: errorMessage,
          code: 'EMAIL_SEND_ERROR'
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
