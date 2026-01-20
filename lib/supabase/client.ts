import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Session } from '@supabase/supabase-js'

// Singleton client for browser-side only
let browserClient: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }

  // During SSR/build time (when window is undefined), create a new client each time
  // This avoids issues with cookies not being available during static generation
  if (typeof window === 'undefined') {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Don't persist during SSR
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }

  // On client-side, use singleton pattern for better performance
  if (browserClient) return browserClient

  // Browser client: use supabase-js default (localStorage) session persistence.
  // This avoids cookie adapter issues and ensures authenticated calls (e.g. Storage signed URLs).
  browserClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  })

  // Set up auth state change listener
  browserClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session?.user?.id)
    
    if (event === 'SIGNED_OUT') {
      // Clear any stale auth data from localStorage (legacy cleanup)
      const keys = Object.keys(window.localStorage)
      keys.forEach(key => {
        if (key.startsWith('sb-') && (key.includes('auth-token') || key.includes('auth'))) {
          window.localStorage.removeItem(key)
        }
      })
    }
  })

  return browserClient
}

// Utility function to check if session is valid
export async function getValidSession(): Promise<Session | null> {
  const supabase = createClient()
  
  // First, try to get session from cache
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    // Handle refresh token errors gracefully
    if (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token')) {
      console.warn('Invalid refresh token detected, clearing session...')
      await supabase.auth.signOut()
      return null
    }
    console.error('Session check failed:', error)
    // Don't return null yet - try getUser as a fallback
  }
  
  // If we have a valid session with an access token, check expiry
  if (session?.access_token) {
    const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now()
    const now = Date.now()
    const bufferTime = 5 * 60 * 1000 // 5 minutes buffer
    
    if (expiresAt - now < bufferTime) {
      console.log('Session near expiry, attempting refresh...')
      try {
        const { data: { session: refreshedSession }, error: refreshError } = 
          await supabase.auth.refreshSession()
        
        if (refreshError) {
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
  
  // No session in cache - check if user is actually authenticated via getUser()
  // This validates against the server and is more reliable than cached session
  console.log('No session in cache, checking user authentication...')
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    // User is genuinely not authenticated
    if (userError) {
      console.log('getUser failed:', userError.message)
    }
    return null
  }
  
  // User is authenticated but we don't have a session - try to refresh
  console.log('User authenticated but no session, attempting refresh...')
  try {
    const { data: { session: refreshedSession }, error: refreshError } = 
      await supabase.auth.refreshSession()
    
    if (refreshError) {
      console.error('Session refresh failed after getUser success:', refreshError)
      return null
    }
    
    return refreshedSession
  } catch (err) {
    console.error('Unexpected error during session refresh:', err)
    return null
  }
}

