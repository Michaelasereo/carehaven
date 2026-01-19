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

    // Create session securely using server-side approach
    // This sets HTTP-only cookies instead of exposing tokens to client
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const callbackUrl = `${appUrl}/auth/callback?next=${encodeURIComponent(redirectPath)}`
      
      // Generate magic link to get hashed token
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: callbackUrl,
        },
      })

      if (linkError || !linkData?.properties?.hashed_token) {
        console.error('❌ Error generating magic link:', linkError)
        console.error('   Callback URL:', callbackUrl)
        console.error('   User ID:', userId)
        // If magic link generation fails, return redirect path and let client handle sign-in
        return NextResponse.json({
          success: true,
          message: 'Email verified successfully',
          redirectPath,
          requiresSignIn: true, // Flag to indicate user needs to sign in
        })
      }

      // Verify the token to get a session
      const tokenHash = linkData.properties.hashed_token
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'magiclink',
        email: email,
      })

      if (verifyError || !verifyData?.session) {
        console.error('❌ Error verifying token to create session:', verifyError)
        // Fallback: return redirect path
        return NextResponse.json({
          success: true,
          message: 'Email verified successfully',
          redirectPath,
          requiresSignIn: true,
        })
      }

      const session = verifyData.session
      console.log('✅ Session created successfully after verification')
      console.log('   Redirect path:', redirectPath)

      // Create response with success message (NO TOKENS IN RESPONSE)
      const response = NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        redirectPath,
        // DO NOT include session tokens - they're set in cookies below
      })

      // Set secure HTTP-only cookies server-side (following signin route pattern)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || 'default'
      const cookieName = `sb-${projectRef}-auth-token`
      
      // Calculate expiration date
      const expiresAt = session.expires_at
        ? new Date(session.expires_at * 1000)
        : new Date(Date.now() + 3600 * 1000) // Default 1 hour

      // Create the token payload (Supabase SSR expects this format)
      const tokenPayload = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: session.user,
      }

      // Set secure HTTP-only cookie (tokens never exposed to client-side JS)
      response.cookies.set({
        name: cookieName,
        value: JSON.stringify(tokenPayload),
        httpOnly: true, // Prevents JavaScript access
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax', // CSRF protection
        path: '/',
        expires: expiresAt,
      })

      console.log('✅ Secure cookies set server-side')
      return response
    } catch (linkErr: any) {
      console.error('❌ Error creating session after verification:', linkErr)
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
