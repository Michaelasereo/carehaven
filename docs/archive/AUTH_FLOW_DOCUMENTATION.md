# Authentication & Dashboard Redirect Flow - Complete Code Documentation

This document contains all code related to sign up, sign in, email verification, and dashboard redirect functionality.

---

## Table of Contents

1. [Sign Up Flow](#sign-up-flow)
2. [Sign In Flow](#sign-in-flow)
3. [Email Verification](#email-verification)
4. [Dashboard Redirect](#dashboard-redirect)
5. [Database Schema](#database-schema)
6. [Supabase Client Setup](#supabase-client-setup)
7. [API Routes](#api-routes)

---

## Sign Up Flow

### Component: `components/auth/email-signup-form.tsx`

```tsx
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
      
      // Send custom verification email via Brevo
      try {
        const response = await fetch('/api/auth/send-verification-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })

        const result = await response.json()
        if (!response.ok) {
          console.error('Failed to send verification email:', result.error)
          // Don't fail signup if email sending fails, user can resend
        } else {
          console.log('Verification email sent via Brevo')
        }
      } catch (emailError) {
        console.error('Error calling send-verification-email API:', emailError)
        // Don't fail signup if email sending fails
      }
      
      setSuccess(true)
      // Redirect to email verification page with email parameter
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
    } else {
      setError('Failed to create account. Please try again.')
      setLoading(false)
    }
  }

  // ... rest of component (form UI)
}
```

**Key Points:**
- Creates user account via `supabase.auth.signUp()`
- Sends custom verification email via Brevo API
- Redirects to `/auth/verify-email` page
- Password requirements: 8+ chars, uppercase, lowercase, number, special char

---

## Sign In Flow

### Component: `components/auth/email-signin-form.tsx`

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function EmailSignInForm() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    console.log('Form submitted', { email, passwordLength: password.length })

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (!password) {
      setError('Please enter your password')
      setLoading(false)
      return
    }

    try {
      console.log('Attempting sign in...')
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Sign in response', { 
        user: data?.user?.id, 
        session: !!data?.session,
        error: signInError 
      })

      if (signInError) {
        console.error('Sign in error:', signInError)
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. If you don\'t have an account, please sign up first.')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please verify your email before signing in. Check your inbox for the verification link.')
        } else {
          setError(signInError.message)
        }
        setLoading(false)
        return
      }

      if (!data.session) {
        console.error('No session returned from sign in')
        setError('Failed to create session. Please try again.')
        setLoading(false)
        return
      }

      console.log('Session created:', {
        user: data.user.id,
        hasSession: !!data.session,
        expiresAt: data.session.expires_at
      })

      // Verify session is actually saved by checking it
      const { data: { session: verifySession } } = await supabase.auth.getSession()
      if (!verifySession) {
        console.error('Session not saved after sign-in')
        setError('Session not saved. Please try again.')
        setLoading(false)
        return
      }

      if (data.user) {
        console.log('User signed in:', data.user.id)
        try {
          // Check if email is verified (either via Supabase or our custom verification)
          const { data: verificationToken } = await supabase
            .from('email_verification_tokens')
            .select('id')
            .eq('user_id', data.user.id)
            .eq('used', true)
            .limit(1)
            .maybeSingle()

          // If email is not confirmed in Supabase AND no custom verification token exists, require verification
          if (!data.user.email_confirmed_at && !verificationToken) {
            setError('Please verify your email before signing in. Check your inbox for the verification link.')
            setLoading(false)
            return
          }

          // Get user profile to determine role and profile completion
          console.log('Fetching user profile...')
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, profile_completed')
            .eq('id', data.user.id)
            .single()

          console.log('Profile response:', { profile, profileError })

          if (profileError || !profile) {
            // Profile doesn't exist, redirect to callback to create it
            console.log('Profile not found, redirecting to callback')
            setLoading(false)
            window.location.href = '/auth/callback'
            return
          }

          // Check if profile is complete
          if (!profile.profile_completed) {
            console.log('Profile incomplete, redirecting to complete-profile')
            setLoading(false)
            window.location.href = '/complete-profile'
            return
          }

          // Role-based redirect
          let redirectPath = '/patient'
          if (profile.role === 'doctor') {
            redirectPath = '/doctor'
          } else if (profile.role === 'admin') {
            redirectPath = '/admin'
          } else if (profile.role === 'super_admin') {
            redirectPath = '/super-admin'
          }

          console.log('All checks passed. Redirecting to:', redirectPath)
          setLoading(false)
          
          // Wait a moment to ensure cookies are saved
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Verify session one more time
          const { data: { session: finalSession } } = await supabase.auth.getSession()
          console.log('Final session check:', { hasSession: !!finalSession, userId: finalSession?.user?.id })
          
          if (!finalSession) {
            console.error('Session lost! Retrying sign-in...')
            // Session was lost, try to get it again
            const { data: retryData } = await supabase.auth.getUser()
            if (!retryData.user) {
              setError('Session expired. Please sign in again.')
              return
            }
          }
          
          console.log('Redirecting to:', redirectPath)
          // Use window.location.replace to avoid back button issues
          window.location.replace(redirectPath)
        } catch (err) {
          console.error('Error during sign-in redirect:', err)
          console.error('Error details:', JSON.stringify(err, null, 2))
          setError(`An error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`)
          setLoading(false)
        }
      } else {
        console.log('No user data returned')
        setLoading(false)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  // ... rest of component (form UI)
}
```

**Key Points:**
- Signs in via `supabase.auth.signInWithPassword()`
- Verifies session is saved before redirecting
- Checks email verification (Supabase or custom token)
- Checks profile existence and completion
- Role-based redirect: `/patient`, `/doctor`, `/admin`, `/super-admin`
- 500ms delay before redirect to ensure cookies are saved
- Uses `window.location.replace()` for full page reload

---

## Email Verification

### Custom Email Verification System

**File: `lib/auth/email-verification.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/client'
import * as crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * Generate a verification token for email verification
 */
export async function generateVerificationToken(userId: string): Promise<string> {
  // Create a secure random token
  const randomBytes = crypto.randomBytes(32)
  const token = randomBytes.toString('base64url')
  
  // Store token in database with expiration (24 hours)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)
  
  const { error } = await supabase
    .from('email_verification_tokens')
    .insert({
      user_id: userId,
      token: token,
      expires_at: expiresAt.toISOString(),
    })

  if (error) {
    console.error('Error storing verification token:', error)
  }

  return token
}

/**
 * Send verification email using Brevo
 */
export async function sendVerificationEmail(
  email: string,
  userId: string
): Promise<void> {
  try {
    const token = await generateVerificationToken(userId)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

    const htmlContent = `...` // HTML email template

    await sendEmail(
      email,
      'Verify Your Email Address - Care Haven',
      htmlContent
    )
  } catch (error) {
    console.error('Error sending verification email:', error)
    throw error
  }
}

/**
 * Verify email token
 */
export async function verifyEmailToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    // Check if token exists and is valid
    const { data, error } = await supabase
      .from('email_verification_tokens')
      .select('user_id, expires_at')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (error || !data) {
      console.error('Token not found or already used:', error)
      return null
    }

    // Check expiration
    if (new Date(data.expires_at) < new Date()) {
      console.error('Token expired')
      return null
    }

    // Mark token as used
    await supabase
      .from('email_verification_tokens')
      .update({ used: true })
      .eq('token', token)

    // Get user email
    const { data: user } = await supabase.auth.admin.getUserById(data.user_id)
    
    if (!user?.user) {
      return null
    }
    
    return {
      userId: data.user_id,
      email: user.user.email || '',
    }
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}
```

---

## Dashboard Redirect

### Auth Callback Route: `app/auth/callback/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkProfileCompletion, getUserRole } from '@/lib/auth/profile-check'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  const supabase = await createClient()
  
  // Handle email verification callback (code exchange)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      // Check if it's a token verification (from our custom email flow)
      const token = requestUrl.searchParams.get('token')
      if (token) {
        // This is from our custom email verification, handle it differently
        // The token verification is handled by /api/auth/verify-email
        return NextResponse.redirect(new URL(`/api/auth/verify-email?token=${token}&email=${requestUrl.searchParams.get('email') || ''}`, requestUrl.origin))
      }
      // For Supabase email verification, redirect with error
      return NextResponse.redirect(new URL('/auth/signin?error=invalid_code', requestUrl.origin))
    }
    
    // If we have a session, user is authenticated
    if (data?.session) {
      console.log('Code exchanged successfully, user authenticated')
    }
  }

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin))
  }

  // Check if profile exists, if not create one
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Determine role from user metadata or default to patient
    // For email/password signups, role defaults to patient
    const role = user.user_metadata?.role || 'patient'
    
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        role: role,
        profile_completed: false,
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return NextResponse.redirect(new URL('/auth/signin?error=profile_creation_failed', requestUrl.origin))
    }
  }

  // Check if email is verified (for email/password users)
  // Allow sign-in if verified via our custom flow (check for used verification token)
  const { data: verificationToken } = await supabase
    .from('email_verification_tokens')
    .select('id')
    .eq('user_id', user.id)
    .eq('used', true)
    .limit(1)
    .maybeSingle()

  // Only require email verification if neither Supabase nor custom verification exists
  if (!user.email_confirmed_at && !verificationToken) {
    return NextResponse.redirect(new URL('/auth/verify-email', requestUrl.origin))
  }

  // Check profile completion
  const isProfileComplete = await checkProfileCompletion(user.id)
  
  if (!isProfileComplete) {
    return NextResponse.redirect(new URL('/complete-profile', requestUrl.origin))
  }

  // Get user role and redirect to appropriate dashboard
  const role = await getUserRole(user.id)
  
  let redirectPath = '/patient' // default
  if (role === 'doctor') {
    redirectPath = '/doctor'
  } else if (role === 'admin') {
    redirectPath = '/admin'
  } else if (role === 'super_admin') {
    redirectPath = '/super-admin'
  }
  
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
}
```

### Dashboard Layout: `app/(dashboard)/layout.tsx`

```typescript
import { Sidebar } from '@/components/dashboard/sidebar'
import { DoctorSidebar } from '@/components/dashboard/doctor-sidebar'
import { Header } from '@/components/dashboard/header'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    console.error('Auth error in dashboard layout:', authError.message)
  }

  if (!user) {
    console.log('No user found in dashboard layout, redirecting to sign-in')
    redirect('/auth/signin')
  }
  
  console.log('Dashboard layout - User authenticated:', user.id)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isDoctor = profile?.role === 'doctor'
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  return (
    <div className="flex h-screen">
      {isDoctor ? <DoctorSidebar /> : <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-white p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

**Key Points:**
- Server-side auth check in layout
- Redirects to `/auth/signin` if no user
- Role-based sidebar selection
- All dashboard routes are protected by this layout

---

## Database Schema

### Profiles Table: `supabase/migrations/001_initial_schema.sql`

```sql
-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin', 'super_admin')),
  
  -- Basic info
  full_name TEXT,
  avatar_url TEXT,
  email TEXT UNIQUE,
  
  -- Profile completion status
  profile_completed BOOLEAN DEFAULT FALSE,
  onboarded_at TIMESTAMP WITH TIME ZONE,
  
  -- Patient-specific fields (nullable for doctors)
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  phone TEXT,
  blood_group TEXT,
  allergies TEXT[] DEFAULT '{}',
  chronic_conditions TEXT[] DEFAULT '{}',
  
  -- Doctor-specific fields (nullable for patients)
  license_number TEXT UNIQUE,
  license_verified BOOLEAN DEFAULT FALSE,
  specialty TEXT,
  years_experience INTEGER,
  consultation_fee DECIMAL(10, 2) DEFAULT 20000.00,
  currency TEXT DEFAULT 'NGN',
  bio TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Email Verification Tokens Table: `supabase/migrations/008_email_verification_tokens.sql`

```sql
-- Email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

-- Partial unique index: ensure one active token per user (only when used = FALSE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verification_tokens_unique_active 
  ON email_verification_tokens(user_id, token) 
  WHERE used = FALSE;

-- RLS policies
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage tokens
CREATE POLICY "Service role can manage tokens"
  ON email_verification_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## Supabase Client Setup

### Browser Client: `lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
```

### Server Client: `lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

---

## API Routes

### Send Verification Email: `app/api/auth/send-verification-email/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendVerificationEmail } from '@/lib/auth/email-verification'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get user by email using admin API
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
    const userToVerify = users?.find(u => u.email === email)

    if (!userToVerify) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already verified
    if (userToVerify.email_confirmed_at) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    // Send verification email via Brevo
    await sendVerificationEmail(email, userToVerify.id)

    return NextResponse.json({ success: true, message: 'Verification email sent' })
  } catch (error) {
    console.error('Error sending verification email:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

### Verify Email: `app/api/auth/verify-email/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyEmailToken } from '@/lib/auth/email-verification'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  try {
    const result = await verifyEmailToken(token)

    if (!result) {
      return NextResponse.redirect(
        new URL('/auth/verify-email?error=invalid_token', request.url)
      )
    }

    // Verify email in Supabase
    const { error: verifyError } = await supabase.auth.admin.updateUserById(
      result.userId,
      { email_confirm: true }
    )

    if (verifyError) {
      console.error('Error verifying email:', verifyError)
      return NextResponse.redirect(
        new URL('/auth/verify-email?error=verification_failed', request.url)
      )
    }

    // Redirect to sign in with success message
    return NextResponse.redirect(
      new URL('/auth/signin?verified=true', request.url)
    )
  } catch (error) {
    console.error('Error in email verification:', error)
    return NextResponse.redirect(
      new URL('/auth/verify-email?error=verification_failed', request.url)
    )
  }
}
```

---

## Profile Check Utilities

### File: `lib/auth/profile-check.ts`

```typescript
import { createClient } from '@/lib/supabase/server'

export async function checkProfileCompletion(userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('profile_completed')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return false
  }

  return data.profile_completed ?? false
}

export async function getUserRole(userId: string): Promise<string | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data.role
}
```

---

## Authentication Flow Diagram

```
Sign Up:
1. User fills form → email-signup-form.tsx
2. supabase.auth.signUp() → Creates user in auth.users
3. POST /api/auth/send-verification-email → Sends email via Brevo
4. Redirect to /auth/verify-email
5. User clicks email link → /api/auth/verify-email
6. Token verified → email_confirmed_at set in Supabase
7. Redirect to /auth/signin

Sign In:
1. User fills form → email-signin-form.tsx
2. supabase.auth.signInWithPassword() → Creates session
3. Check email verification (Supabase or custom token)
4. Fetch profile from profiles table
5. Check profile_completed
6. Determine role → Redirect to /patient, /doctor, /admin, or /super-admin
7. Dashboard layout checks auth → If no user, redirect to /auth/signin
```

---

## Known Issues & Current Behavior

### Issue: Sign-in not redirecting to dashboard

**Symptoms:**
- User signs in successfully
- Session is created
- But stays on sign-in page instead of redirecting

**Possible Causes:**
1. Cookies not being set properly before redirect
2. Server-side layout checking auth before cookies are available
3. Race condition between client-side redirect and server-side auth check

**Current Mitigations:**
- 500ms delay before redirect
- Session verification before redirect
- Using `window.location.replace()` for full page reload
- Server-side logging to debug

**Next Steps for Senior Developer:**
1. Check browser Network tab for cookie headers
2. Check server logs for "No user found in dashboard layout"
3. Verify Supabase SSR cookie handling
4. Consider using middleware for auth checks instead of layout
5. Check if cookies are being set with correct domain/path

---

## Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BREVO_API_KEY=your-brevo-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
```

---

## Testing

Test scripts available:
- `scripts/test-signin.js` - Test sign-in flow
- `scripts/test-signup-email.js` - Test sign-up and email verification

Run with: `node scripts/test-signin.js`
