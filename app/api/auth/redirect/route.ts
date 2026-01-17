import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const redirectTo = requestUrl.searchParams.get('redirect') || '/patient'

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/redirect/route.ts:4',message:'Redirect API called',data:{redirectTo:redirectTo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
  // #endregion

  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/redirect/route.ts:11',message:'Redirect API user check',data:{hasUser:!!user,userId:user?.id,userError:userError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
  // #endregion
  
  if (userError || !user) {
    return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin))
  }

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, profile_completed')
    .eq('id', user.id)
    .single()

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/redirect/route.ts:22',message:'Redirect API profile check',data:{hasProfile:!!profile,role:profile?.role,profileCompleted:profile?.profile_completed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
  // #endregion

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

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/redirect/route.ts:37',message:'Redirect API final redirect',data:{redirectPath,role:profile?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
  // #endregion

  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
}
