import { createClient } from '@/lib/supabase/client'

/**
 * Validates and refreshes session if needed
 */
export async function validateSession() {
  const supabase = createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session validation error:', error)
      return { valid: false, session: null, error }
    }
    
    if (!session) {
      return { valid: false, session: null, error: new Error('No session found') }
    }
    
    // Check if session needs refresh (within 5 minutes of expiry)
    const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now()
    const now = Date.now()
    const bufferTime = 5 * 60 * 1000 // 5 minutes
    
    if (expiresAt - now < bufferTime) {
      console.log('Session near expiry, refreshing...')
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('Session refresh error:', refreshError)
        return { valid: false, session: null, error: refreshError }
      }
      
      return { valid: true, session: refreshedSession, error: null }
    }
    
    return { valid: true, session, error: null }
  } catch (err) {
    console.error('Unexpected session validation error:', err)
    return { valid: false, session: null, error: err }
  }
}

/**
 * Ensures user has valid session before proceeding
 */
export async function requireAuth() {
  const { valid, session, error } = await validateSession()
  
  if (!valid || !session) {
    // Clear any invalid session data
    const supabase = createClient()
    await supabase.auth.signOut()
    
    throw new Error('Authentication required')
  }
  
  return session
}

/**
 * Gets current user with session validation
 */
export async function getCurrentUser() {
  const session = await requireAuth()
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Failed to get user')
  }
  
  return { user, session }
}
