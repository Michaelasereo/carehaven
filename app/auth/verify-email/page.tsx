'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    // Get email from URL parameter or from session
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Try to get from current user session
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          setEmail(user.email)
        }
      })
    }
  }, [searchParams, supabase])

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit verification code')
      setLoading(false)
      return
    }

    if (!email) {
      setError('Email is required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to verify code')
        setLoading(false)
        return
      }

      // Code verified successfully
      setVerified(true)
      
      // Check if this is an admin verification
      const isAdmin = searchParams.get('admin') === 'true'
      
      // If magic link is provided, use it to create session
      if (result.magicLink) {
        // Redirect to magic link which will create session and redirect to dashboard
        console.log('🔗 Redirecting to magic link for session creation')
        window.location.href = result.magicLink
        return
      }

      // If requiresSignIn flag is set, the magic link generation failed
      // But since verification is successful, redirect to dashboard
      // The user will need to sign in manually, but we preserve the verified state
      if (result.requiresSignIn) {
        console.warn('⚠️ Magic link generation failed, redirecting to login with verified flag')
        const redirectPath = result.redirectPath || (isAdmin ? '/admin/dashboard' : '/patient')
        // Store redirect path in sessionStorage so login can redirect after sign-in
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('postVerifyRedirect', redirectPath)
        }
        if (isAdmin) {
          router.push(`/admin/login?email=${encodeURIComponent(email || '')}&verified=true`)
        } else {
          router.push(`/auth/signin?email=${encodeURIComponent(email || '')}&verified=true`)
        }
        return
      }

      // Try to refresh session
      await supabase.auth.refreshSession()
      
      // Check if session exists
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // No session, redirect to sign-in with verified flag
        if (isAdmin) {
          router.push(`/admin/login?email=${encodeURIComponent(email || '')}&verified=true`)
        } else {
          router.push(`/auth/signin?email=${encodeURIComponent(email || '')}&verified=true`)
        }
        return
      }
      
      // Session exists, redirect to appropriate dashboard
      // For admin flow, always redirect to admin dashboard (respect admin flag even if role differs)
      if (isAdmin) {
        router.push('/admin/dashboard')
      } else {
        // Use redirectPath from server (which is role-based) or default to /patient
        const redirectPath = result.redirectPath || '/patient'
        router.push(redirectPath)
      }
    } catch (error: any) {
      console.error('Error verifying code:', error)
      setError('Failed to verify code. Please try again.')
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) {
      setError('Email is required')
      return
    }

    setResending(true)
    setError(null)

    try {
      // Try to get user ID from session first
      let userId: string | null = null
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        userId = user.id
      } else {
        // If no session, try to find user by email via API
        // This handles cases where session expired but user exists
        try {
          const userResponse = await fetch(`/api/auth/get-user-by-email?email=${encodeURIComponent(email)}`)
          if (userResponse.ok) {
            const userData = await userResponse.json()
            userId = userData.userId
          }
        } catch (err) {
          console.warn('Could not fetch user by email:', err)
        }
      }
      
      if (!userId) {
        setError('User not found. Please try signing up again.')
        setResending(false)
        return
      }

      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Show more user-friendly error message based on error type
        const errorMsg = result.error || 'Failed to resend verification code'
        let displayError = errorMsg
        
        if (errorMsg.includes('wait') || errorMsg.includes('60 seconds') || response.status === 429) {
          displayError = 'Please wait 60 seconds before requesting another code.'
        } else if (errorMsg.includes('not configured') || errorMsg.includes('Email service')) {
          displayError = 'Email service is temporarily unavailable. Please try again later or contact support.'
        } else if (errorMsg.includes('not found') || response.status === 404) {
          displayError = 'User not found. Please try signing up again.'
        } else if (response.status === 400) {
          displayError = 'Invalid request. Please check your email address and try again.'
        } else if (response.status >= 500) {
          displayError = 'Server error. Please try again in a moment or contact support if the issue persists.'
        }
        
        setError(displayError)
        setResending(false)
        return
      }

      // Show success message
      setError(null)
      // Note: Toast notifications would require ToastProvider in this layout
      // For now, show inline success message
      setResending(false)
    } catch (error: any) {
      console.error('Error resending code:', error)
      setError('Failed to resend verification code. Please try again.')
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/carehaven-logo.svg"
              alt="Care Haven Logo"
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
          <div className="mt-4 space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
              <svg
                className="h-6 w-6 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            {verified ? (
              <>
                <p className="text-green-600 font-semibold">
                  Email verified successfully!
                </p>
                <p className="text-gray-600">
                  Redirecting you to your dashboard...
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600">
                  We've sent a 6-digit verification code {email ? `to ${email}` : 'to your email'}. 
                  Please enter the code below to verify your account.
                </p>
                <form onSubmit={handleVerifyCode} className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="verification-code">Verification Code</Label>
                    <Input
                      id="verification-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="000000"
                      value={code}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '') // Only allow digits
                        setCode(value.slice(0, 6)) // Limit to 6 digits
                      }}
                      disabled={loading}
                      required
                      className="text-center text-2xl tracking-widest font-mono"
                      aria-invalid={error ? 'true' : 'false'}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-700"
                    disabled={loading || code.length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </Button>
                </form>
                <div className="space-y-2 mt-4">
                  <p className="text-sm text-gray-500">
                    Didn't receive the code? Check your spam folder.
                  </p>
                  <Button
                    onClick={handleResendCode}
                    disabled={resending}
                    variant="outline"
                    className="w-full"
                  >
                    {resending ? 'Sending...' : 'Resend Verification Code'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <Link href="/auth/signin">
            <Button variant="outline" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
