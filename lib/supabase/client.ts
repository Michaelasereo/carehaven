import { createBrowserClient } from '@supabase/ssr'
import type { Session } from '@supabase/supabase-js'

// Singleton client to avoid multiple instances
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }

  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true, // Critical for session maintenance
      detectSessionInUrl: true,
      flowType: 'pkce', // Use PKCE for better security
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null
          return window.localStorage.getItem(key)
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return
          window.localStorage.setItem(key, value)
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return
          window.localStorage.removeItem(key)
        },
      },
    },
  })

  // Set up auth state change listener with error handling
  // Only set up listener on client-side to prevent SSR errors
  if (typeof window !== 'undefined') {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' && session) {
        // Store session data for debugging
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('supabase.auth.token', session.access_token)
        }
      }
      
      if (event === 'SIGNED_OUT') {
        // Clear invalid tokens and auth data on sign out
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('supabase.auth.token')
          
          // Clear any stale auth data from localStorage
          const keys = Object.keys(window.localStorage)
          keys.forEach(key => {
            if (key.startsWith('sb-') && (key.includes('auth-token') || key.includes('auth'))) {
              window.localStorage.removeItem(key)
            }
          })
        }
      }
    })
  }

  return supabaseClient
}

// Utility function to check if session is valid
export async function getValidSession(): Promise<Session | null> {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    // Handle refresh token errors gracefully
    if (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token')) {
      console.warn('Invalid refresh token detected, clearing session...')
      // Sign out to clear invalid session
      await supabase.auth.signOut()
      return null
    }
    console.error('Session check failed:', error)
    return null
  }
  
  if (!session) {
    return null
  }
  
  // Check if session is expired or about to expire
  const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now()
  const now = Date.now()
  const bufferTime = 5 * 60 * 1000 // 5 minutes buffer
  
  if (expiresAt - now < bufferTime) {
    console.log('Session near expiry, attempting refresh...')
    try {
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession()
      
      if (refreshError) {
        // Handle refresh token errors
        if (refreshError.message?.includes('refresh_token_not_found') || refreshError.message?.includes('Invalid Refresh Token')) {
          console.warn('Invalid refresh token during refresh, clearing session...')
          await supabase.auth.signOut()
        }
        console.error('Session refresh failed:', refreshError)
        return null
      }
      
      return refreshedSession
    } catch (err) {
      console.error('Unexpected error during session refresh:', err)
      return null
    }
  }
  
  return session
}

