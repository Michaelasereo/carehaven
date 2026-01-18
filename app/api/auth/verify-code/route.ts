import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCode, markCodeAsUsed } from '@/lib/auth/verification-code'

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
      const { data: user, error: updateError } = await supabase.auth.admin.updateUserById(
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

    // Generate a magic link to create a session for the verified user
    // This allows the user to be automatically signed in after verification
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const callbackUrl = `${appUrl}/auth/callback?next=${encodeURIComponent(redirectPath)}`
      
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: callbackUrl,
        },
      })

      if (linkError || !linkData?.properties?.action_link) {
        console.error('❌ Error generating magic link:', linkError)
        // If magic link generation fails, return redirect path and let client handle sign-in
        return NextResponse.json({
          success: true,
          message: 'Email verified successfully',
          redirectPath,
          requiresSignIn: true, // Flag to indicate user needs to sign in
        })
      }

      // Return the magic link URL that will create a session when visited
      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        redirectPath,
        magicLink: linkData.properties.action_link, // This link will create a session when visited
      })
    } catch (linkErr: any) {
      console.error('❌ Error generating magic link:', linkErr)
      // Fallback: return redirect path
      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        redirectPath,
        requiresSignIn: true,
      })
    }
  } catch (error: any) {
    console.error('❌ Error in verify-code API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify code' },
      { status: 500 }
    )
  }
}
