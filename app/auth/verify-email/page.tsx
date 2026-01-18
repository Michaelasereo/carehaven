'use client'

import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'
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
      
      // Refresh session to ensure it's updated
      await supabase.auth.refreshSession()
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        const redirectPath = result.redirectPath || '/patient'
        router.push(redirectPath)
      }, 1500)
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
      // Get user ID from session
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('User not found. Please sign up again.')
        setResending(false)
        return
      }

      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId: user.id }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to resend verification code')
        setResending(false)
        return
      }

      // Show success message
      setError(null)
      alert('Verification code sent! Please check your email.')
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
            <Image
              src="/carehaven-logo.svg"
              alt="Care Haven Logo"
              width={200}
              height={64}
              className="h-16 w-auto"
              priority
              unoptimized
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
