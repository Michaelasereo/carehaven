import { createBrowserClient } from '@supabase/ssr'
import type { Session } from '@supabase/supabase-js'

// Singleton client for browser-side only
let browserClient: ReturnType<typeof createBrowserClient> | null = null

// Helper to parse cookies safely
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  try {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift()
    }
  } catch (e) {
    console.warn('Cookie get error:', e)
  }
  return undefined
}

// Helper to set cookies safely
function setCookie(name: string, value: string, options?: { path?: string; maxAge?: number; sameSite?: string; secure?: boolean }) {
  if (typeof document === 'undefined') return
  try {
    let cookieStr = `${name}=${value}`
    if (options?.path) cookieStr += `; path=${options.path}`
    if (options?.maxAge) cookieStr += `; max-age=${options.maxAge}`
    if (options?.sameSite) cookieStr += `; samesite=${options.sameSite}`
    if (options?.secure) cookieStr += `; secure`
    document.cookie = cookieStr
  } catch (e) {
    console.warn('Cookie set error:', e)
  }
}

// Helper to remove cookies safely
function removeCookie(name: string, options?: { path?: string }) {
  if (typeof document === 'undefined') return
  try {
    document.cookie = `${name}=; path=${options?.path || '/'}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  } catch (e) {
    console.warn('Cookie remove error:', e)
  }
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }

  // During SSR/build time (when window is undefined), create a new client each time
  // This avoids issues with cookies not being available during static generation
  if (typeof window === 'undefined') {
    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Don't persist during SSR
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }

  // On client-side, use singleton pattern for better performance
  if (browserClient) return browserClient

  // Create client with explicit cookie handling to avoid undefined storage errors
  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return getCookie(name)
      },
      set(name: string, value: string, options: { path?: string; maxAge?: number; sameSite?: string; secure?: boolean }) {
        setCookie(name, value, options)
      },
      remove(name: string, options: { path?: string }) {
        removeCookie(name, options)
      },
    },
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

