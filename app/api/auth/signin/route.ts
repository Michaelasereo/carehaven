import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    console.log('📝 Sign-in attempt for:', email)
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Create server client
    const supabase = await createClient()
    
    // Sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ Sign-in error:', error.message)
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (!data.session) {
      console.error('❌ No session created')
      return NextResponse.json(
        { error: 'No session created' },
        { status: 401 }
      )
    }

    console.log('✅ Sign-in successful for user:', data.user.id)

    // Extract project ref from URL for cookie name
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || 'default'
    const cookieName = `sb-${projectRef}-auth-token`
    
    console.log('🍪 Cookie name:', cookieName)
    console.log('🍪 Project ref:', projectRef)

    // Calculate expiration date
    const expiresAt = data.session.expires_at
      ? new Date(data.session.expires_at * 1000)
      : new Date(Date.now() + 3600 * 1000) // Default 1 hour

    console.log('📅 Cookie expires at:', expiresAt.toISOString())

    // Create the token payload (Supabase SSR expects this format)
    const tokenPayload = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
      user: data.session.user,
    }

    // Create response
    const response = NextResponse.json({ 
      success: true,
      user: { 
        id: data.user.id, 
        email: data.user.email,
        email_confirmed: !!data.user.email_confirmed_at,
      }
    })

    // Set the cookie manually (this is the key fix)
    response.cookies.set({
      name: cookieName,
      value: JSON.stringify(tokenPayload),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    })

    // Also set a simpler cookie for debugging
    response.cookies.set({
      name: 'auth-debug',
      value: 'authenticated',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    })

    console.log('✅ Cookies set in response')
    
    // Log cookie headers
    const cookieHeaders = response.headers.getSetCookie()
    console.log('📋 Set-Cookie headers count:', cookieHeaders.length)

    return response

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
