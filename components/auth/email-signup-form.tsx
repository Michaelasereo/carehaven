'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PasswordRequirements {
  minLength: boolean
  hasUpperCase: boolean
  hasLowerCase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
}

export function EmailSignUpForm() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
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

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          // Add any additional metadata if needed
        },
      },
    })

    if (signUpError) {
      console.error('Sign up error:', signUpError)
      if (signUpError.message.includes('already registered')) {
        setError('An account with this email already exists. Please sign in instead.')
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
      return
    }

    if (data.user) {
      console.log('User created:', data.user.id)
      console.log('Email confirmed:', data.user.email_confirmed_at)
      
      // Supabase automatically sends verification email via Brevo SMTP (configured in Supabase dashboard)
      console.log('✅ Account created. Supabase will send verification email via Brevo SMTP')
      
      setSuccess(true)
      // Redirect to email verification page with email parameter
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
    } else {
      setError('Failed to create account. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">Account created successfully!</p>
          <p className="mt-2">
            We've sent a verification email to <strong>{email}</strong>. Please check your inbox and click the verification link to activate your account.
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
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          aria-invalid={error && error.includes('email') ? 'true' : 'false'}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
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
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
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

      <div className="space-y-3">
        <Button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700"
          disabled={loading || !email || !password || !confirmPassword || !allRequirementsMet || !passwordsMatch}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
        
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-teal-600 hover:text-teal-700 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  )
}
