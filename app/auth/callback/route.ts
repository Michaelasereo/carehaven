import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkProfileCompletion, getUserRole } from '@/lib/auth/profile-check'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if profile exists, if not create one
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // Create profile from Google OAuth data
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
              role: 'patient',
              profile_completed: false,
            })

          if (profileError) {
            console.error('Error creating profile:', profileError)
          }
        }

        // Check profile completion
        const isProfileComplete = await checkProfileCompletion(user.id)
        
        if (!isProfileComplete) {
          return NextResponse.redirect(new URL('/complete-profile', requestUrl.origin))
        }

        // Get user role and redirect to appropriate dashboard
        const role = await getUserRole(user.id)
        const redirectPath = role === 'doctor' ? '/doctor' : '/patient'
        
      return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
      }
    }
  }

  // Error or no code, redirect to sign in
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin))
}

