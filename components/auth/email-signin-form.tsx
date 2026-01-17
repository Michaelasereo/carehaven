'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Rate limiting state
const signInAttempts = new Map<string, { count: number, lastAttempt: number }>()

export function EmailSignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Check for redirect parameter
  const redirectTo = searchParams.get('redirect') || '/'

  // Check for verified parameter
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccess(true)
      setError(null)
    }
  }, [searchParams])

  // Rate limiting check
  const checkRateLimit = (email: string): boolean => {
    const now = Date.now()
    const attempts = signInAttempts.get(email) || { count: 0, lastAttempt: 0 }
    
    // Reset counter if last attempt was more than 15 minutes ago
    if (now - attempts.lastAttempt > 15 * 60 * 1000) {
      attempts.count = 0
    }
    
    // Block if more than 5 attempts in 15 minutes
    if (attempts.count >= 5) {
      const timeLeft = Math.ceil((15 * 60 * 1000 - (now - attempts.lastAttempt)) / 1000 / 60)
      setError(`Too many attempts. Please try again in ${timeLeft} minutes.`)
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-signin-form.tsx:60',message:'handleSubmit called',data:{email:formData.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    // Validate inputs
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    // Check rate limiting
    if (!checkRateLimit(formData.email)) {
      setLoading(false)
      return
    }

    try {
      // Update rate limiting
      const attempts = signInAttempts.get(formData.email) || { count: 0, lastAttempt: 0 }
      attempts.count++
      attempts.lastAttempt = Date.now()
      signInAttempts.set(formData.email, attempts)

      console.log('Attempting sign in via server API...')

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-signin-form.tsx:87',message:'Calling server-side sign-in API',data:{email:formData.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'COOKIE_FIX'})}).catch(()=>{});
      // #endregion

      // Use server-side API route which sets cookies properly
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // IMPORTANT: Include cookies in request/response
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const apiData = await response.json()

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-signin-form.tsx:105',message:'Server API response',data:{success:apiData.success,hasUser:!!apiData.user,error:apiData.error,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'COOKIE_FIX'})}).catch(()=>{});
      // #endregion

      if (!response.ok || !apiData.success) {
        // User-friendly error messages
        const errorMsg = apiData.error || 'Unable to sign in. Please try again later.'
        if (errorMsg.includes('Invalid login credentials') || errorMsg.includes('Invalid')) {
          setError('Invalid email or password. Please try again.')
        } else if (errorMsg.includes('Email not confirmed')) {
          setError('Please verify your email before signing in. Check your inbox or request a new verification email.')
        } else if (errorMsg.includes('rate limit')) {
          setError('Too many attempts. Please wait a few minutes and try again.')
        } else {
          setError(errorMsg)
        }
        
        setLoading(false)
        return
      }

      console.log('✅ Server-side sign-in successful')
      console.log('📥 Response data:', apiData)

      // Reset rate limiting on successful sign in
      signInAttempts.delete(formData.email)

      // Check if cookies were set
      console.log('🍪 Current cookies after sign-in:', document.cookie)
      
      const hasAuthCookies = document.cookie.includes('sb-') || document.cookie.includes('auth-debug')
      console.log('🍪 Has auth cookies:', hasAuthCookies)
      
      if (!hasAuthCookies) {
        console.warn('⚠️ No auth cookies detected immediately after sign-in')
        // Wait a moment for cookies to be set, then check again
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log('🍪 Cookies after delay:', document.cookie)
        
        const hasCookiesAfterDelay = document.cookie.includes('sb-') || document.cookie.includes('auth-debug')
        if (!hasCookiesAfterDelay) {
          console.warn('⚠️ Still no cookies - forcing reload to sync cookies')
          // Force a reload to sync cookies from response headers
          window.location.reload()
          return
        }
      }

      // Redirect to callback route which will handle server-side session validation and redirect
      const redirectUrl = `/auth/callback?next=${encodeURIComponent(redirectTo || '/patient')}`
      
      console.log('🔄 Redirecting to callback:', redirectUrl)
      window.location.href = redirectUrl
      return

    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8cdf461f-7383-47f6-8fc5-cfaafbecd6c6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-signin-form.tsx:217',message:'Unexpected error in handleSubmit',data:{error:String(err),stack:err instanceof Error?err.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ALL'})}).catch(()=>{});
      // #endregion
      console.error('Unexpected error during sign in:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
          Email verified successfully! You can now sign in.
        </div>
      )}
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="you@example.com"
          required
        />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/auth/reset-password"
            className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="remember-me"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
        />
        <Label htmlFor="remember-me" className="ml-2 text-sm font-normal">
          Remember me
        </Label>
      </div>
      
      <div className="space-y-3">
        <Button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700">
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
        
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-teal-600 hover:text-teal-700 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </form>
  )
}
