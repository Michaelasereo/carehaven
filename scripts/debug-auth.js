// Debug authentication flow
const debugAuth = async () => {
  console.log('=== Authentication Debug ===')
  
  // Check localStorage
  console.log('LocalStorage auth data:', {
    supabase_auth_token: localStorage.getItem('supabase.auth.token'),
    supabase_auth_refresh_token: localStorage.getItem('supabase.auth.refresh_token')
  })
  
  // Check cookies
  console.log('Cookies:', document.cookie)
  
  // Check current URL
  console.log('Current URL:', window.location.href)
  
  // Check if we're in an iframe (can cause auth issues)
  console.log('Is in iframe?', window.self !== window.top)
  
  // Check Supabase client if available
  if (typeof window !== 'undefined' && window.supabase) {
    try {
      const { data: { session }, error } = await window.supabase.auth.getSession()
      console.log('Current session:', { session: !!session, error })
      
      if (session) {
        const { data: { user }, error: userError } = await window.supabase.auth.getUser()
        console.log('Current user:', { user: user?.id, email: user?.email, error: userError })
      }
    } catch (err) {
      console.error('Error checking session:', err)
    }
  }
}

// Run on page load
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuth
  console.log('Debug function available: call window.debugAuth() in console')
}

module.exports = { debugAuth }
