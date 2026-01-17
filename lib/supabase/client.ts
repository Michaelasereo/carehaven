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

  // Set up auth state change listener
  supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session?.user?.id)
    
    if (event === 'SIGNED_IN' && session) {
      // Store session data for debugging
      localStorage.setItem('supabase.auth.token', session.access_token)
    }
    
    if (event === 'SIGNED_OUT') {
      localStorage.removeItem('supabase.auth.token')
    }
  })

  return supabaseClient
}

// Utility function to check if session is valid
export async function getValidSession(): Promise<Session | null> {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    console.error('Session check failed:', error)
    return null
  }
  
  // Check if session is expired or about to expire
  const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now()
  const now = Date.now()
  const bufferTime = 5 * 60 * 1000 // 5 minutes buffer
  
  if (expiresAt - now < bufferTime) {
    console.log('Session near expiry, attempting refresh...')
    const { data: { session: refreshedSession }, error: refreshError } = 
      await supabase.auth.refreshSession()
    
    if (refreshError) {
      console.error('Session refresh failed:', refreshError)
      return null
    }
    
    return refreshedSession
  }
  
  return session
}

