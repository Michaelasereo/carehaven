import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Admin client for database operations
const adminClient = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * Auto-signin endpoint that exchanges a one-time token for a session
 * This is used after email verification to automatically sign in the user
 * 
 * Flow:
 * 1. User verifies email via verify-code API
 * 2. verify-code API creates a one-time auto-signin token
 * 3. User is redirected to this endpoint with the token
 * 4. This endpoint verifies the token, generates a magic link, and redirects through it
 * 5. Supabase handles the session creation via the callback route
 */
export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const token = requestUrl.searchParams.get('token')
    const redirect = requestUrl.searchParams.get('redirect') || '/patient'

    if (!token) {
      console.error('❌ Auto-signin: No token provided')
      return NextResponse.redirect(new URL('/auth/signin?error=missing_token', requestUrl.origin))
    }

    // Verify the token exists and is valid
    const { data: tokenData, error: tokenError } = await adminClient
      .from('auto_signin_tokens')
      .select('user_id, email, expires_at, used')
      .eq('token', token)
      .single()

    if (tokenError || !tokenData) {
      console.error('❌ Auto-signin: Token not found or error:', tokenError)
      return NextResponse.redirect(new URL('/auth/signin?error=invalid_token', requestUrl.origin))
    }

    // Check if token is already used
    if (tokenData.used) {
      console.error('❌ Auto-signin: Token already used')
      return NextResponse.redirect(new URL('/auth/signin?error=token_used', requestUrl.origin))
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)
    if (now > expiresAt) {
      console.error('❌ Auto-signin: Token expired')
      return NextResponse.redirect(new URL('/auth/signin?error=token_expired', requestUrl.origin))
    }

    // Mark token as used immediately to prevent replay attacks
    await adminClient
      .from('auto_signin_tokens')
      .update({ used: true })
      .eq('token', token)

    console.log('✅ Auto-signin: Token validated for user:', tokenData.user_id)

    // Generate a magic link for the user
    // The callback route will handle the session creation properly
    const callbackUrl = `${requestUrl.origin}/auth/callback?next=${encodeURIComponent(redirect)}`
    
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: tokenData.email,
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('❌ Auto-signin: Failed to generate magic link:', linkError)
      // Fallback: redirect to sign-in with verified flag
      const fallbackUrl = redirect.startsWith('/doctor') 
        ? `/doctor/login?email=${encodeURIComponent(tokenData.email)}&verified=true`
        : redirect.startsWith('/admin')
        ? `/admin/login?email=${encodeURIComponent(tokenData.email)}&verified=true`
        : `/auth/signin?email=${encodeURIComponent(tokenData.email)}&verified=true`
      return NextResponse.redirect(new URL(fallbackUrl, requestUrl.origin))
    }

    // Redirect to the magic link action URL
    // Supabase will handle the auth flow and redirect to the callback
    console.log('✅ Auto-signin: Redirecting to magic link for:', tokenData.email)
    return NextResponse.redirect(linkData.properties.action_link)

  } catch (error: any) {
    console.error('❌ Auto-signin: Unexpected error:', error)
    return NextResponse.redirect(new URL('/auth/signin?error=auto_signin_failed', new URL(request.url).origin))
  }
}
