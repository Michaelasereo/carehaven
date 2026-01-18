import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkProfileCompletion, getUserRole } from '@/lib/auth/profile-check'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  const supabase = await createClient()
  
  // Handle email verification callback (code exchange)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      // Check if it's a token verification (from our custom email flow)
      const token = requestUrl.searchParams.get('token')
      if (token) {
        // This is from our custom email verification, handle it differently
        // The token verification is handled by /api/auth/verify-email
        return NextResponse.redirect(new URL(`/api/auth/verify-email?token=${token}&email=${requestUrl.searchParams.get('email') || ''}`, requestUrl.origin))
      }
      // For Supabase email verification, redirect with error
      return NextResponse.redirect(new URL('/auth/signin?error=invalid_code', requestUrl.origin))
    }
    
    // If we have a session, user is authenticated
    if (data?.session) {
      console.log('Code exchanged successfully, user authenticated')
    }
  }

  // Note: Hash tokens (#access_token=...) are only available client-side
  // Magic links with hash tokens are handled by Supabase client SDK automatically
  // If no code parameter and no user session, this might be a magic link
  // The client SDK should have already processed hash tokens before this route runs
  
  // Get the current user (session should exist if magic link was processed client-side)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    // No session - might be magic link that needs client-side processing
    // Redirect to a page that will handle hash tokens, or back to sign-in
    return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin))
  }

  // Check if profile exists, if not create one
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Determine role from user metadata or default to patient
    // For email/password signups, role defaults to patient
    const role = user.user_metadata?.role || 'patient'
    
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        role: role,
        profile_completed: false,
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return NextResponse.redirect(new URL('/auth/signin?error=profile_creation_failed', requestUrl.origin))
    }
  }

  // Check if email is verified (for email/password users)
  // Allow sign-in if verified via our custom flow (check for used verification token)
  const { data: verificationToken } = await supabase
    .from('email_verification_tokens')
    .select('id')
    .eq('user_id', user.id)
    .eq('used', true)
    .limit(1)
    .maybeSingle()

  // Only require email verification if neither Supabase nor custom verification exists
  if (!user.email_confirmed_at && !verificationToken) {
    return NextResponse.redirect(new URL('/auth/verify-email', requestUrl.origin))
  }

  // Check profile completion
  const isProfileComplete = await checkProfileCompletion(user.id)
  
  if (!isProfileComplete) {
    return NextResponse.redirect(new URL('/complete-profile', requestUrl.origin))
  }

  // Get user role and redirect to appropriate dashboard
  const role = await getUserRole(user.id)
  
  // Use 'next' parameter if provided and valid, otherwise use role-based routing
  let redirectPath = '/patient' // default
  if (next && next !== '/' && !next.startsWith('/auth') && (next.startsWith('/patient') || next.startsWith('/doctor') || next.startsWith('/admin'))) {
    // Use provided next path if it's a valid dashboard route
    redirectPath = next
  } else {
    // Role-based redirect
    if (role === 'doctor') {
      redirectPath = '/doctor/dashboard'
    } else if (role === 'admin') {
      redirectPath = '/admin/dashboard'
    } else if (role === 'super_admin') {
      redirectPath = '/admin/dashboard' // super_admin also goes to admin dashboard
    } else {
      redirectPath = '/patient'
    }
  }
  
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
}

