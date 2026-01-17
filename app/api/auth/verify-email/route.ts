import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyEmailToken } from '@/lib/auth/email-verification'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  try {
    const result = await verifyEmailToken(token)

    if (!result) {
      return NextResponse.redirect(
        new URL('/auth/verify-email?error=invalid_token', request.url)
      )
    }

    // Verify email in Supabase
    const { error: verifyError } = await supabase.auth.admin.updateUserById(
      result.userId,
      { email_confirm: true }
    )

    if (verifyError) {
      console.error('Error verifying email:', verifyError)
      return NextResponse.redirect(
        new URL('/auth/verify-email?error=verification_failed', request.url)
      )
    }

    // Redirect to sign in with success message
    return NextResponse.redirect(
      new URL('/auth/signin?verified=true', request.url)
    )
  } catch (error) {
    console.error('Error in email verification:', error)
    return NextResponse.redirect(
      new URL('/auth/verify-email?error=verification_failed', request.url)
    )
  }
}
