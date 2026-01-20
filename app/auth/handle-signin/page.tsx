'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function HandleSignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function processSignIn() {
      try {
        // Get the intended redirect path from query params
        const redirectPath = searchParams.get('redirect') || '/patient'
        
        console.log('🔐 Processing sign-in from magic link...')
        console.log(`   Intended redirect: ${redirectPath}`)

        // Check if we have hash fragments (magic link tokens)
        const hash = window.location.hash
        if (hash) {
          console.log('   Hash fragment detected, Supabase will process automatically')
        }

        // Function to get final redirect path based on role
        const getFinalRedirect = async (session: any) => {
          // Check profile completion first
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, profile_completed')
            .eq('id', session.user.id)
            .single()

          if (!profile?.profile_completed) {
            console.log('⚠️ Profile not completed, redirecting to complete-profile')
            return '/complete-profile'
          }

          let finalRedirect = redirectPath

          // If redirect path is not specific, use role-based routing
          if (redirectPath === '/patient' || redirectPath === '/') {
            if (profile?.role === 'doctor') {
              finalRedirect = '/doctor/dashboard'
            } else if (profile?.role === 'admin' || profile?.role === 'super_admin') {
              finalRedirect = '/admin/dashboard'
            } else {
              finalRedirect = '/patient'
            }
          }

          return finalRedirect
        }

        // First, try to get session immediately (Supabase processes hash on page load)
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (initialSession) {
          console.log('✅ Session already established for user:', initialSession.user.email)
          const finalRedirect = await getFinalRedirect(initialSession)
          console.log(`📍 Redirecting to: ${finalRedirect}`)
          setStatus('success')
          setTimeout(() => {
            window.location.href = finalRedirect
          }, 300)
          return
        }

        // If no session yet, listen for auth state change
        // Supabase client SDK processes hash fragments and triggers SIGNED_IN event
        console.log('   Waiting for session establishment...')
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('   Auth state changed:', event)
            
            if (event === 'SIGNED_IN' && session) {
              console.log('✅ User signed in via auth state change')
              console.log('   User:', session.user.email)
              
              const finalRedirect = await getFinalRedirect(session)
              console.log(`📍 Redirecting to: ${finalRedirect}`)
              
              subscription.unsubscribe()
              setStatus('success')
              
              // Small delay to show success state, then redirect
              setTimeout(() => {
                window.location.href = finalRedirect
              }, 300)
            } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
              if (event === 'SIGNED_OUT') {
                console.error('❌ User signed out unexpectedly')
                subscription.unsubscribe()
                setError('Sign-in failed. Please try again.')
                setStatus('error')
              }
              // TOKEN_REFRESHED is fine, just means session was refreshed
            }
          }
        )

        // Also poll for session as backup (in case auth state change doesn't fire)
        let pollAttempts = 0
        const maxPollAttempts = 15
        const pollInterval = setInterval(async () => {
          pollAttempts++
          
          const { data: { session: polledSession } } = await supabase.auth.getSession()
          
          if (polledSession) {
            console.log('✅ Session detected via polling')
            clearInterval(pollInterval)
            subscription.unsubscribe()
            
            const finalRedirect = await getFinalRedirect(polledSession)
            console.log(`📍 Redirecting to: ${finalRedirect}`)
            setStatus('success')
            setTimeout(() => {
              window.location.href = finalRedirect
            }, 300)
          } else if (pollAttempts >= maxPollAttempts) {
            // Timeout after 5 seconds (15 attempts * 333ms)
            console.error('❌ Sign-in timeout - no session established')
            clearInterval(pollInterval)
            subscription.unsubscribe()
            setError('Sign-in is taking too long. Please try signing in manually.')
            setStatus('error')
          }
        }, 333) // Poll every 333ms

        // Cleanup on unmount
        return () => {
          clearInterval(pollInterval)
          subscription.unsubscribe()
        }

      } catch (err: any) {
        console.error('❌ Error processing sign-in:', err)
        setError(err.message || 'Failed to process sign-in. Please try again.')
        setStatus('error')
      }
    }

    processSignIn()
  }, [searchParams, supabase, router])

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sign-in Failed</h1>
            <p className="mt-2 text-gray-600">{error || 'An error occurred during sign-in'}</p>
          </div>
          <div className="space-y-3">
            <a
              href="/auth/signin"
              className="block w-full rounded-md bg-teal-600 px-4 py-2 text-center text-white hover:bg-teal-700"
            >
              Go to Sign In
            </a>
            <a
              href="/"
              className="block w-full rounded-md border border-gray-300 px-4 py-2 text-center text-gray-700 hover:bg-gray-50"
            >
              Go to Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
          <svg
            className="h-6 w-6 text-teal-600 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Signing you in...</h1>
          <p className="mt-2 text-gray-600">
            Please wait while we complete your sign-in.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function HandleSignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <HandleSignInContent />
    </Suspense>
  )
}
