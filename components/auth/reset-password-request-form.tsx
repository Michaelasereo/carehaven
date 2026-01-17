'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export function ResetPasswordRequestForm() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">Password reset email sent!</p>
          <p className="mt-2">
            We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and click the link to reset your password.
          </p>
          <p className="mt-2 text-xs">
            The link will expire in 24 hours. If you don't see the email, check your spam folder.
          </p>
        </div>
        <Link href="/auth/signin">
          <Button className="w-full bg-teal-600 hover:bg-teal-700">
            Back to Sign In
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          aria-invalid={error ? 'true' : 'false'}
        />
        <p className="text-xs text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-teal-600 hover:bg-teal-700"
        disabled={loading || !email}
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Remember your password?{' '}
        <Link href="/auth/signin" className="text-teal-600 hover:text-teal-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
