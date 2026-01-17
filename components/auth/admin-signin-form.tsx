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

export function AdminSignInForm() {
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
  const redirectTo = searchParams.get('redirect') || '/admin/dashboard'

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
    setSuccess(false)

    if (!checkRateLimit(formData.email)) {
      return
    }

    setLoading(true)

    try {
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        // Update rate limit
        const attempts = signInAttempts.get(formData.email) || { count: 0, lastAttempt: 0 }
        attempts.count += 1
        attempts.lastAttempt = Date.now()
        signInAttempts.set(formData.email, attempts)

        setError(signInError.message)
        setLoading(false)
        return
      }

      if (!data.session) {
        setError('No session created. Please try again.')
        setLoading(false)
        return
      }

      // Verify user is admin or super_admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        await supabase.auth.signOut()
        setError('Access denied. Admin credentials required.')
        setLoading(false)
        return
      }

      // Use API route to set cookies properly
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to sign in')
        setLoading(false)
        return
      }

      // Wait a moment for cookies to be set from the API response
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check if cookies are set
      const hasAuthCookies = document.cookie.includes('sb-') || document.cookie.includes('auth-debug')
      console.log('🍪 Has auth cookies:', hasAuthCookies)
      
      if (!hasAuthCookies) {
        console.warn('⚠️ No auth cookies detected - forcing reload to sync cookies')
        window.location.reload()
        return
      }

      // Redirect to callback route which will handle server-side session validation and redirect
      const redirectUrl = `/auth/callback?next=${encodeURIComponent(redirectTo || '/admin/dashboard')}`
      
      console.log('🔄 Redirecting to admin dashboard:', redirectUrl)
      window.location.replace(redirectUrl)
      return

    } catch (err) {
      console.error('Unexpected error during admin sign in:', err)
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
        <Label htmlFor="email">Admin Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="admin@example.com"
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
          {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
        </Button>
        
        <p className="text-center text-sm text-gray-600">
          Need to sign in as a different user?{' '}
          <Link href="/auth/signin" className="text-teal-600 hover:text-teal-700 hover:underline font-medium">
            Go to regular sign in
          </Link>
        </p>
      </div>
    </form>
  )
}
