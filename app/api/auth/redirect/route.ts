import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const redirectTo = requestUrl.searchParams.get('redirect') || '/patient'

  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin))
  }

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, profile_completed')
    .eq('id', user.id)
    .single()

  // Check if profile completion is needed
  if (profile && !profile.profile_completed) {
    return NextResponse.redirect(new URL('/complete-profile', requestUrl.origin))
  }

  // Role-based redirect
  let redirectPath = redirectTo
  if (profile?.role) {
    if (profile.role === 'doctor') redirectPath = '/doctor/dashboard'
    else if (profile.role === 'admin') redirectPath = '/admin/dashboard'
    else if (profile.role === 'super_admin') redirectPath = '/admin/dashboard'
    else redirectPath = '/patient'
  }

  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
}
