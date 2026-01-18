'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface PasswordRequirements {
  minLength: boolean
  hasUpperCase: boolean
  hasLowerCase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
}

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [codeVerified, setCodeVerified] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get code and email from URL params
    const urlCode = searchParams.get('code')
    const urlEmail = searchParams.get('email')
    
    if (urlCode && urlEmail) {
      setCode(urlCode)
      setEmail(urlEmail)
      // Auto-verify code if provided in URL
      handleVerifyCode(urlCode, urlEmail)
    }
  }, [searchParams])

  const handleVerifyCode = async (codeToVerify: string, emailToVerify: string) => {
    setVerifyingCode(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToVerify, email: emailToVerify }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Invalid or expired reset code')
        setVerifyingCode(false)
        return
      }

      setCodeVerified(true)
      setUserId(result.userId)
      setVerifyingCode(false)
    } catch (err: any) {
      setError('Failed to verify reset code. Please try again.')
      setVerifyingCode(false)
    }
  }

  const checkPasswordRequirements = (pwd: string): PasswordRequirements => {
    return {
      minLength: pwd.length >= 8,
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    }
  }

  const passwordRequirements = checkPasswordRequirements(password)
  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean)
  const passwordsMatch = password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // If code not verified yet, verify it first
    if (!codeVerified) {
      if (!code || !email) {
        setError('Reset code and email are required')
        setLoading(false)
        return
      }
      await handleVerifyCode(code, email)
      if (!codeVerified) {
        setLoading(false)
        return
      }
    }

    if (!allRequirementsMet) {
      setError('Password does not meet all requirements')
      setLoading(false)
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (!userId) {
      setError('User ID not found. Please request a new password reset.')
      setLoading(false)
      return
    }

    // Update password using service role (since user is not authenticated)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to reset password')
        setLoading(false)
        return
      }

      setSuccess(true)
      // Redirect to sign in after a short delay
      setTimeout(() => {
        router.push('/auth/signin?passwordReset=true')
      }, 2000)
    } catch (err: any) {
      setError('Failed to reset password. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">Password reset successfully!</p>
          <p className="mt-2">
            Your password has been updated. You can now sign in with your new password.
          </p>
        </div>
        <Link href="/auth/signin">
          <Button className="w-full bg-teal-600 hover:bg-teal-700">
            Go to Sign In
          </Button>
        </Link>
      </div>
    )
  }

  // Show code verification step if code/email provided but not verified
  if (!codeVerified && (code || email)) {
    return (
      <div className="space-y-4">
        {verifyingCode ? (
          <div className="text-center py-4">
            <p className="text-gray-600">Verifying reset code...</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="reset-code">Reset Code</Label>
              <Input
                id="reset-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                disabled={verifyingCode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={verifyingCode}
              />
            </div>
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
            <Button
              type="button"
              onClick={() => handleVerifyCode(code, email)}
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={!code || !email || verifyingCode || code.length !== 6}
            >
              {verifyingCode ? 'Verifying...' : 'Verify Code'}
            </Button>
            <p className="text-center text-sm text-gray-600">
              <Link href="/auth/reset-password" className="text-teal-600 hover:text-teal-700 hover:underline">
                Request a new reset code
              </Link>
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {codeVerified && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Reset code verified. Please enter your new password.
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="reset-password">New Password</Label>
        <div className="relative">
          <Input
            id="reset-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            aria-invalid={error && error.includes('password') ? 'true' : 'false'}
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
        {password && (
          <div className="rounded-md bg-gray-50 p-3 text-xs">
            <p className="mb-2 font-medium">Password requirements:</p>
            <ul className="space-y-1">
              <li className={passwordRequirements.minLength ? 'text-green-600' : 'text-gray-600'}>
                {passwordRequirements.minLength ? '✓' : '○'} At least 8 characters
              </li>
              <li className={passwordRequirements.hasUpperCase ? 'text-green-600' : 'text-gray-600'}>
                {passwordRequirements.hasUpperCase ? '✓' : '○'} One uppercase letter
              </li>
              <li className={passwordRequirements.hasLowerCase ? 'text-green-600' : 'text-gray-600'}>
                {passwordRequirements.hasLowerCase ? '✓' : '○'} One lowercase letter
              </li>
              <li className={passwordRequirements.hasNumber ? 'text-green-600' : 'text-gray-600'}>
                {passwordRequirements.hasNumber ? '✓' : '○'} One number
              </li>
              <li className={passwordRequirements.hasSpecialChar ? 'text-green-600' : 'text-gray-600'}>
                {passwordRequirements.hasSpecialChar ? '✓' : '○'} One special character
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-confirm-password">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="reset-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
            aria-invalid={error && error.includes('match') ? 'true' : 'false'}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {showConfirmPassword ? (
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
        {confirmPassword && !passwordsMatch && (
          <p className="text-xs text-red-600">Passwords do not match</p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-teal-600 hover:bg-teal-700"
        disabled={loading || !password || !confirmPassword || !allRequirementsMet || !passwordsMatch}
      >
        {loading ? 'Resetting password...' : 'Reset Password'}
      </Button>
    </form>
  )
}
