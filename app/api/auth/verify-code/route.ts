import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCode, markCodeAsUsed } from '@/lib/auth/verification-code'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * Helper function to get dashboard redirect path based on user role
 */
async function getDashboardRedirectPath(userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profile?.role === 'doctor') {
    return '/doctor/dashboard'
  } else if (profile?.role === 'admin' || profile?.role === 'super_admin') {
    return '/admin/dashboard'
  } else {
    return '/patient'
  }
}

/**
 * Generate a secure random token
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create an auto-signin token for the user
 * Returns the token that can be used to sign in automatically
 */
async function createAutoSigninToken(userId: string, email: string): Promise<string | null> {
  const token = generateSecureToken()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry

  const { error } = await supabase
    .from('auto_signin_tokens')
    .insert({
      token,
      user_id: userId,
      email,
      expires_at: expiresAt.toISOString(),
      used: false,
    })

  if (error) {
    console.error('❌ Error creating auto-signin token:', error)
    return null
  }

  return token
}

export async function POST(request: Request) {
  try {
    const { code, email } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Verify the code
    const verificationResult = await verifyCode(code, email)

    if (!verificationResult) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    const { userId } = verificationResult

    // Mark code as used
    await markCodeAsUsed(code, email)

    // Confirm email in Supabase
    try {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          email_confirm: true,
        }
      )

      if (updateError) {
        console.error('❌ Error confirming email in Supabase:', updateError)
        return NextResponse.json(
          { error: 'Failed to verify email. Please try again.' },
          { status: 500 }
        )
      }

      console.log(`✅ Email ${email} verified successfully for user ${userId}`)
    } catch (error: any) {
      console.error('❌ Error updating user email confirmation:', error)
      return NextResponse.json(
        { error: 'Failed to verify email. Please try again.' },
        { status: 500 }
      )
    }

    // Get dashboard redirect path based on user role
    const redirectPath = await getDashboardRedirectPath(userId)
    console.log(`📍 Dashboard redirect path for user ${userId}: ${redirectPath}`)

    // Create auto-signin token for seamless redirect
    const autoSigninToken = await createAutoSigninToken(userId, email)

    if (autoSigninToken) {
      // Return auto-signin URL for seamless redirect
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const autoSigninUrl = `${appUrl}/api/auth/auto-signin?token=${autoSigninToken}&redirect=${encodeURIComponent(redirectPath)}`
      
      console.log('✅ Auto-signin token created, returning URL')
      
      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        redirectPath,
        autoSigninUrl, // Client should redirect to this URL for automatic sign-in
      })
    }

    // Fallback: If auto-signin token creation fails, tell client to sign in manually
    console.warn('⚠️ Auto-signin token creation failed, user will need to sign in manually')
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      redirectPath,
      requiresSignIn: true,
    })

  } catch (error: any) {
    console.error('❌ Error in verify-code API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify code' },
      { status: 500 }
    )
  }
}
