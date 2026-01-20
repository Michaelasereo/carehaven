import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/auth/session
 * 
 * Returns the current session tokens from server-side cookies.
 * Used by client-side code to sync the session to localStorage when
 * the server has a valid session but the client doesn't.
 * 
 * This is needed because:
 * - Server uses cookie-based auth (@supabase/ssr)
 * - Client uses localStorage-based auth (standard supabase-js)
 * - When a user signs in, the session may be in cookies but not localStorage
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the session from cookies
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('[/api/auth/session] Error getting session:', error.message)
      return NextResponse.json({ session: null, error: error.message }, { status: 401 })
    }
    
    if (!session) {
      return NextResponse.json({ session: null })
    }
    
    // Return tokens for client to hydrate its session
    // Note: We only return what's needed for setSession()
    return NextResponse.json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
    })
  } catch (err: any) {
    console.error('[/api/auth/session] Unexpected error:', err)
    return NextResponse.json(
      { session: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
