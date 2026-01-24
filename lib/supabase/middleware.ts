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
    const baseUrl = getBaseUrl(request)
    const url = new URL('/auth/signin', baseUrl)
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If user is signed in and trying to access auth routes
  // Allow handle-signin to process (it will redirect itself)
  if (user && isAuthRoute && request.nextUrl.pathname !== '/auth/callback' && request.nextUrl.pathname !== '/auth/handle-signin') {
    // Get user role and redirect to appropriate dashboard
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, profile_completed')
      .eq('id', user.id)
      .single()

    if (!profile?.profile_completed) {
      const baseUrl = getBaseUrl(request)
      return NextResponse.redirect(new URL('/complete-profile', baseUrl))
    }

    let redirectPath = '/patient'
    if (profile.role === 'doctor') redirectPath = '/doctor/dashboard'
    if (profile.role === 'admin') redirectPath = '/admin/dashboard'
    if (profile.role === 'super_admin') redirectPath = '/admin/dashboard'

    const baseUrl = getBaseUrl(request)
    return NextResponse.redirect(new URL(redirectPath, baseUrl))
  }

  return response
}

