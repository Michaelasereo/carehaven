'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Client-side component specifically for homepage to handle auth hash fragments
 * This ensures authenticated users are redirected to their dashboard
 */
export function HomepageAuthHandler() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function handleAuthHash() {
      // Only run on homepage
      if (window.location.pathname !== '/') {
        return
      }

      // Check if we have hash fragments (magic link tokens)
      const hash = window.location.hash
      
      if (hash && hash.includes('access_token')) {
        console.log('🔐 Homepage: Auth hash fragment detected, processing...')
        
        // Parse hash to extract tokens
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
          console.log('   Tokens found, setting session...')
          
          try {
            // Set the session directly using the tokens from hash
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            
            if (sessionError) {
              console.error('❌ Error setting session:', sessionError)
              return
            }
            
            if (session) {
              console.log('✅ Session established')
              console.log(`   User: ${session.user.email}`)
              console.log(`   User ID: ${session.user.id}`)
              
              // Use metadata role immediately (fastest path - no database query needed)
              const metadataRole = session.user.user_metadata?.role
              console.log(`   Metadata role: ${metadataRole}`)
              
              let redirectPath = '/patient'
              
              // Determine redirect based on metadata role (immediate, no DB query)
              if (metadataRole === 'doctor') {
                redirectPath = '/doctor/dashboard'
              } else if (metadataRole === 'admin' || metadataRole === 'super_admin') {
                redirectPath = '/admin/dashboard'
              }
              
              console.log(`📍 Redirecting to: ${redirectPath} (using metadata role)`)
              
              // Clear hash and redirect immediately (don't wait for profile query)
              window.history.replaceState(null, '', '/')
              
              // Redirect immediately - metadata role is set during signup and is reliable
              window.location.href = redirectPath
              return
            }
          } catch (err: any) {
            console.error('❌ Exception setting session:', err)
          }
        }
        
        // Fallback: Listen for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              console.log('✅ User signed in via auth state change')
              
              // Use metadata role for immediate redirect
              const metadataRole = session.user.user_metadata?.role
              let redirectPath = '/patient'
              
              if (metadataRole === 'doctor') {
                redirectPath = '/doctor/dashboard'
              } else if (metadataRole === 'admin' || metadataRole === 'super_admin') {
                redirectPath = '/admin/dashboard'
              }

              console.log(`📍 Redirecting to: ${redirectPath} (via auth state change)`)
              subscription.unsubscribe()
              window.history.replaceState(null, '', '/')
              window.location.href = redirectPath
            }
          }
        )

        // Cleanup after 10 seconds
        setTimeout(() => {
          subscription.unsubscribe()
        }, 10000)
      }
    }

    handleAuthHash()
  }, [router, supabase])

  return null
}
