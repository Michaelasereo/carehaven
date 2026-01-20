'use client'

import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuthSessionContextValue {
  isSessionReady: boolean
  syncSession: () => Promise<boolean>
}

const AuthSessionContext = createContext<AuthSessionContextValue>({
  isSessionReady: false,
  syncSession: async () => false,
})

export function useAuthSession() {
  return useContext(AuthSessionContext)
}

interface AuthSessionProviderProps {
  children: ReactNode
}

/**
 * AuthSessionProvider
 * 
 * This provider ensures the client-side Supabase session (localStorage) is
 * synchronized with the server-side session (cookies).
 * 
 * Problem: The app uses two different session storage mechanisms:
 * - Server: Cookie-based auth via @supabase/ssr
 * - Client: localStorage-based auth via standard supabase-js
 * 
 * When a user is authenticated via cookies (server), the localStorage (client)
 * may be empty if the sign-in flow didn't properly sync the session.
 * 
 * Solution: On mount, check if client has a session. If not, fetch session
 * tokens from the server (which reads from cookies) and hydrate the client.
 */
export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const [isSessionReady, setIsSessionReady] = useState(false)
  const [hasSynced, setHasSynced] = useState(false)

  const syncSession = useCallback(async (): Promise<boolean> => {
    const supabase = createClient()
    
    try {
      // Check if client already has a valid session
      const { data: { session: existingSession } } = await supabase.auth.getSession()
      
      if (existingSession?.access_token) {
        // Session exists in localStorage, we're good
        console.log('[AuthSessionProvider] Client session exists')
        return true
      }
      
      // No client session, try to sync from server (cookies)
      console.log('[AuthSessionProvider] No client session, syncing from server...')
      
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include', // Include cookies
      })
      
      if (!res.ok) {
        console.log('[AuthSessionProvider] Server returned no session')
        return false
      }
      
      const data = await res.json()
      
      if (!data.access_token || !data.refresh_token) {
        console.log('[AuthSessionProvider] No tokens in server response')
        return false
      }
      
      // Hydrate the client session with tokens from server
      console.log('[AuthSessionProvider] Hydrating client session from server...')
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })
      
      if (setSessionError) {
        console.error('[AuthSessionProvider] Failed to set session:', setSessionError.message)
        return false
      }
      
      console.log('[AuthSessionProvider] Session synced successfully')
      return true
    } catch (err) {
      console.error('[AuthSessionProvider] Error syncing session:', err)
      return false
    }
  }, [])

  useEffect(() => {
    if (hasSynced) return
    
    let mounted = true
    
    async function initSession() {
      await syncSession()
      
      if (mounted) {
        setIsSessionReady(true)
        setHasSynced(true)
      }
    }
    
    initSession()
    
    return () => {
      mounted = false
    }
  }, [hasSynced, syncSession])

  // Also listen for auth state changes to keep isSessionReady accurate
  useEffect(() => {
    const supabase = createClient()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsSessionReady(false)
        setHasSynced(false)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setIsSessionReady(true)
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthSessionContext.Provider value={{ isSessionReady, syncSession }}>
      {children}
    </AuthSessionContext.Provider>
  )
}
