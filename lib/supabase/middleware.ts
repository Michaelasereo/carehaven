import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getBaseUrl } from '@/lib/utils/url'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check if environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not set, skipping auth check')
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). The session should be validated first.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // #region agent log
  if (process.env.NODE_ENV === 'development') {
    fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:45',message:'Middleware auth check',data:{path:request.nextUrl.pathname,hasUser:!!user,userId:user?.id,error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H7'})}).catch(()=>{});
  }
  // #endregion

  // Log for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware]', {
      path: request.nextUrl.pathname,
      hasUser: !!user,
      userId: user?.id,
      error: error?.message,
    })
  }

  // Auth routes that don't require authentication
  const authRoutes = ['/auth/signin', '/auth/signup', '/auth/verify-email', '/auth/forgot-password', '/auth/reset-password', '/auth/callback', '/auth/handle-signin', '/admin/login', '/doctor/login']
  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  
  // API auth routes
  const isAuthApiRoute = request.nextUrl.pathname.startsWith('/api/auth/')
  
  // Public routes that don't require auth
  const publicRoutes = ['/', '/about', '/contact', '/pricing', '/doctor-enrollment', '/privacy-policy', '/terms-of-service', '/support', '/how-it-works', '/payment/callback']
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname) || request.nextUrl.pathname.startsWith('/doctor-enrollment')

  // If user is not signed in and the current path is not public or auth route
  if (!user && !isPublicRoute && !isAuthRoute && !isAuthApiRoute) {
    // #region agent log
    if (process.env.NODE_ENV === 'development') {
      fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:72',message:'Middleware redirecting unauthenticated user',data:{path:request.nextUrl.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H7'})}).catch(()=>{});
    }
    // #endregion
    const baseUrl = getBaseUrl(request)
    const url = new URL('/auth/signin', baseUrl)
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If user is signed in and trying to access auth routes
  // Allow handle-signin to process (it will redirect itself)
  if (user && isAuthRoute && request.nextUrl.pathname !== '/auth/callback' && request.nextUrl.pathname !== '/auth/handle-signin') {
    // #region agent log
    if (process.env.NODE_ENV === 'development') {
      fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:79',message:'Middleware checking profile for authenticated user on auth route',data:{path:request.nextUrl.pathname,userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H7'})}).catch(()=>{});
    }
    // #endregion
    // Get user role and redirect to appropriate dashboard
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, profile_completed')
      .eq('id', user.id)
      .single()

    if (!profile?.profile_completed) {
      // #region agent log
      if (process.env.NODE_ENV === 'development') {
        fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:87',message:'Middleware redirecting to complete-profile',data:{profileCompleted:profile?.profile_completed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H7'})}).catch(()=>{});
      }
      // #endregion
      const baseUrl = getBaseUrl(request)
      return NextResponse.redirect(new URL('/complete-profile', baseUrl))
    }

    let redirectPath = '/patient'
    if (profile.role === 'doctor') redirectPath = '/doctor/dashboard'
    if (profile.role === 'admin') redirectPath = '/admin/dashboard'
    if (profile.role === 'super_admin') redirectPath = '/admin/dashboard'

    // #region agent log
    if (process.env.NODE_ENV === 'development') {
      fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:96',message:'Middleware redirecting authenticated user from auth route',data:{redirectPath,role:profile.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H7'})}).catch(()=>{});
    }
    // #endregion
    const baseUrl = getBaseUrl(request)
    return NextResponse.redirect(new URL(redirectPath, baseUrl))
  }

  return response
}

