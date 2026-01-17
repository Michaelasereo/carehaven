import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    console.log('🔍 Verifying cookies...')
    
    // Check incoming cookies
    const cookieHeader = request.headers.get('cookie') || ''
    console.log('🍪 Request cookies:', cookieHeader ? 'Present' : 'None')
    
    // Extract project ref for cookie name
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || 'default'
    const cookieName = `sb-${projectRef}-auth-token`
    
    const cookieMatch = cookieHeader.match(new RegExp(`${cookieName}=([^;]+)`))
    if (cookieMatch) {
      console.log('✅ Found Supabase auth cookie')
      try {
        const tokenData = JSON.parse(decodeURIComponent(cookieMatch[1]))
        console.log('🔍 Token data:', {
          user_id: tokenData.user?.id,
          expires_at: tokenData.expires_at,
          expires_in: tokenData.expires_in,
        })
      } catch (e) {
        console.log('❌ Could not parse token data')
      }
    } else {
      console.log('❌ No Supabase auth cookie found')
    }
    
    // Create client and check session
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.log('🔍 Session check result:', {
      hasSession: !!session,
      userId: session?.user?.id,
      error: error?.message,
    })
    
    if (error || !session) {
      return NextResponse.json({
        success: false,
        message: 'No valid session found',
        error: error?.message,
        cookies: cookieHeader || 'none',
      })
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        email_confirmed: !!session.user.email_confirmed_at,
      },
      session: {
        expires_at: session.expires_at,
        expires_in: session.expires_in,
      },
    })
    
  } catch (error) {
    console.error('❌ Cookie verification error:', error)
    return NextResponse.json({
      success: false,
      message: 'Verification failed',
      error: String(error),
    }, { status: 500 })
  }
}
