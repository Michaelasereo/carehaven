'use client'

import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ResendVerificationButton } from '@/components/auth/resend-verification-button'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    // Check for verification token in URL
    const token = searchParams.get('token')
    const emailParam = searchParams.get('email')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError('Verification failed. Please try resending the email.')
    }

    if (token && emailParam) {
      // Token is handled by the API route, just show success
      setVerified(true)
      setEmail(emailParam)
    } else if (emailParam) {
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/carehaven%20logo.svg"
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
                  Your email address has been verified. You can now sign in to your account.
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600">
                  We've sent a verification email {email ? `to ${email}` : 'to your inbox'}. Please check your email and click the verification link to activate your account.
                </p>
                <p className="text-sm text-gray-500">
                  Didn't receive the email? Check your spam folder.
                </p>
                {error && (
                  <p className="text-sm text-red-600 mt-2">{error}</p>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          {email && (
            <ResendVerificationButton email={email} />
          )}
          <Link href="/auth/signin">
            <Button className="w-full bg-teal-600 hover:bg-teal-700">
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
