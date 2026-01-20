'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Client-side component to handle auth hash fragments on any page
 * This is a fallback for when Supabase magic links redirect to unexpected URLs
 */
export function AuthHandler() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function handleAuthHash() {
      // Check if we have hash fragments (magic link tokens)
      const hash = window.location.hash
      
      if (hash && hash.includes('access_token')) {
        console.log('🔐 Auth hash fragment detected on page, processing...')
        console.log(`   Hash: ${hash.substring(0, 50)}...`)
        
        // Parse hash to extract tokens
        // Hash format: #access_token=xxx&refresh_token=yyy&expires_in=3600&token_type=bearer&type=magiclink
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const expiresIn = hashParams.get('expires_in')
        
        console.log(`   Parsed hash - access_token: ${accessToken ? 'found' : 'missing'}, refresh_token: ${refreshToken ? 'found' : 'missing'}`)
        
        if (accessToken && refreshToken) {
          console.log('   Tokens found in hash, setting session...')
          
          try {
            // Set the session directly using the tokens from hash
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            
            if (sessionError) {
              console.error('❌ Error setting session:', sessionError)
              console.error('   Error details:', {
                message: sessionError.message,
                status: sessionError.status,
                name: sessionError.name,
              })
              // Continue to fallback method
            } else if (session) {
              console.log('✅ Session established from hash fragment')
              console.log(`   User: ${session.user.email}`)
              console.log(`   User ID: ${session.user.id}`)
              
              // Check profile completion before redirecting
              const { data: profile } = await supabase
                .from('profiles')
                .select('profile_completed, role')
                .eq('id', session.user.id)
                .single()

              if (!profile?.profile_completed) {
                console.log('⚠️ Profile not completed, redirecting to complete-profile')
                window.history.replaceState(null, '', window.location.pathname)
                window.location.href = '/complete-profile'
                return
              }

              // Use profile role (more reliable than metadata)
              const role = profile?.role || session.user.user_metadata?.role || 'patient'
              let redirectPath = '/patient'
              
              if (role === 'doctor') {
                redirectPath = '/doctor/dashboard'
              } else if (role === 'admin' || role === 'super_admin') {
                redirectPath = '/admin/dashboard'
              }

              console.log(`📍 Redirecting authenticated user to: ${redirectPath} (role: ${role})`)
              
              // Clear hash and redirect
              window.history.replaceState(null, '', window.location.pathname)
              window.location.href = redirectPath
              return
            } else {
              console.warn('⚠️ setSession returned no session and no error')
            }
          } catch (err: any) {
            console.error('❌ Exception setting session:', err)
          }
        } else {
          console.warn('⚠️ Missing tokens in hash:', { accessToken: !!accessToken, refreshToken: !!refreshToken })
        }
        
        // Fallback: Listen for auth state change (Supabase SDK may process hash automatically)
        console.log('   Waiting for Supabase SDK to process hash...')
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log(`   Auth state changed: ${event}`)
            
            if (event === 'SIGNED_IN' && session) {
              console.log('✅ User signed in via auth state change')
              console.log(`   User: ${session.user.email}`)
              
              // Check profile completion before redirecting
              const { data: profile } = await supabase
                .from('profiles')
                .select('profile_completed, role')
                .eq('id', session.user.id)
                .single()

              if (!profile?.profile_completed) {
                console.log('⚠️ Profile not completed, redirecting to complete-profile')
                subscription.unsubscribe()
                window.history.replaceState(null, '', window.location.pathname)
                window.location.href = '/complete-profile'
                return
              }

              // Use profile role (more reliable than metadata)
              const role = profile?.role || session.user.user_metadata?.role || 'patient'
              let redirectPath = '/patient'
              
              if (role === 'doctor') {
                redirectPath = '/doctor/dashboard'
              } else if (role === 'admin' || role === 'super_admin') {
                redirectPath = '/admin/dashboard'
              }

              console.log(`📍 Redirecting to: ${redirectPath} (role: ${role})`)
              subscription.unsubscribe()
              window.history.replaceState(null, '', window.location.pathname)
              window.location.href = redirectPath
            }
          }
        )

        // Also poll for session as backup
        let pollAttempts = 0
        const maxPollAttempts = 20
        const pollInterval = setInterval(async () => {
          pollAttempts++
          
          const { data: { session: polledSession } } = await supabase.auth.getSession()
          
          if (polledSession) {
            console.log('✅ Session detected via polling')
            clearInterval(pollInterval)
            subscription.unsubscribe()
            
            // Check profile completion before redirecting
            const { data: profile } = await supabase
              .from('profiles')
              .select('profile_completed, role')
              .eq('id', polledSession.user.id)
              .single()

            if (!profile?.profile_completed) {
              console.log('⚠️ Profile not completed, redirecting to complete-profile')
              window.history.replaceState(null, '', window.location.pathname)
              window.location.href = '/complete-profile'
              return
            }

            // Use profile role (more reliable than metadata)
            const role = profile?.role || polledSession.user.user_metadata?.role || 'patient'
            let redirectPath = '/patient'
            
            if (role === 'doctor') {
              redirectPath = '/doctor/dashboard'
            } else if (role === 'admin' || role === 'super_admin') {
              redirectPath = '/admin/dashboard'
            }

            console.log(`📍 Redirecting to: ${redirectPath} (role: ${role})`)
            window.history.replaceState(null, '', window.location.pathname)
            window.location.href = redirectPath
          } else if (pollAttempts >= maxPollAttempts) {
            clearInterval(pollInterval)
            subscription.unsubscribe()
            console.error('❌ Timeout waiting for session')
          }
        }, 250)

        // Cleanup after 10 seconds
        setTimeout(() => {
          clearInterval(pollInterval)
          subscription.unsubscribe()
        }, 10000)
      }
    }

    handleAuthHash()
  }, [router, supabase])

  return null // This component doesn't render anything
}
