'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const enrollmentSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Please select your gender',
  }),
  age: z.string().min(1, 'Please enter your age'),
  licenseType: z.string().min(1, 'Please select license type'),
  specialty: z.string().min(1, 'Please select your specialty'),
  professionalSummary: z.string().min(10, 'Please provide a professional summary'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Terms of Service and Privacy Policy',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type EnrollmentFormData = z.infer<typeof enrollmentSchema>

const specialties = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'General Practice',
  'Internal Medicine',
  'Neurology',
  'Obstetrics & Gynecology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Urology',
]

export function DoctorEnrollmentForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      agreeToTerms: false,
    },
  })

  const agreeToTerms = watch('agreeToTerms')

  const onSubmit = async (data: EnrollmentFormData) => {
    setLoading(true)
    setError(null)

    try {
      // Sign up the doctor
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          data: {
            role: 'doctor',
            full_name: `${data.firstName} ${data.lastName}`,
            license_type: data.licenseType,
            specialty: data.specialty,
          },
          // Omit emailRedirectTo - we handle verification via codes instead
        },
      })

      if (signUpError) {
        console.error('Signup error details:', {
          message: signUpError.message,
          status: signUpError.status,
          name: signUpError.name,
          error: signUpError,
        })
        
        // Log the full error for debugging 422 errors
        if (signUpError.status === 422) {
          console.error('422 Error - Full error object:', JSON.stringify(signUpError, null, 2))
        }
        
        // Handle specific error cases
        if (signUpError.message.includes('already registered') || 
            signUpError.message.includes('already exists') ||
            signUpError.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.')
          setLoading(false)
          return
        } else if (signUpError.message.includes('Invalid email') || 
                   signUpError.message.includes('email format')) {
          setError('Please enter a valid email address.')
          setLoading(false)
          return
        } else if (signUpError.message.includes('Password') || 
                   signUpError.message.includes('password')) {
          setError('Password does not meet requirements. Please check and try again.')
          setLoading(false)
          return
        } else if (signUpError.status === 422) {
          // 422 Unprocessable Entity - usually means validation failed
          setError(signUpError.message || 'Invalid signup data. Please check all fields and try again.')
          setLoading(false)
          return
        } else {
          // Ignore email sending errors since we handle verification via codes
          if (signUpError.message.includes('Error sending confirmation email') || 
              signUpError.message.includes('email confirmation') ||
              signUpError.message.includes('Failed to send email')) {
            console.warn('Supabase email confirmation error ignored - using verification codes instead')
            // Continue with enrollment flow even if Supabase email fails
          } else {
            setError(signUpError.message || 'Failed to create account. Please try again.')
            setLoading(false)
            return
          }
        }
      }

      if (signUpData.user) {
        // Update profile with enrollment details
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: `${data.firstName} ${data.lastName}`,
            gender: data.gender,
            specialty: data.specialty,
            license_number: `${data.licenseType}-${Date.now()}`, // Generate temporary license number
            license_verified: false,
            bio: data.professionalSummary,
            role: 'doctor',
          })
          .eq('id', signUpData.user.id)

        if (profileError) {
          console.error('Error updating profile:', profileError)
        }

        // Send verification code via Brevo SMTP
        try {
          const response = await fetch('/api/auth/send-verification-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: data.email, userId: signUpData.user.id }),
          })

          const result = await response.json()
          if (!response.ok) {
            console.warn('⚠️  Failed to send verification code:', result.error)
            // Don't fail enrollment if email sending fails - user can resend from verify-email page
          } else {
            console.log('✅ Verification code sent via Brevo')
          }
        } catch (emailError) {
          console.error('Error calling send-verification-code API:', emailError)
          // Don't fail enrollment if email sending fails - user can resend from verify-email page
        }

        // Redirect to email verification
        router.push('/auth/verify-email?email=' + encodeURIComponent(data.email))
      }
    } catch (err: any) {
      console.error('Error during enrollment:', err)
      setError(err.message || 'Failed to complete enrollment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <img
          src="/carehaven-logo.svg"
          alt="Care Haven Logo"
          className="h-10 w-auto mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor's Enrollment</h1>
        <p className="text-gray-600 italic">Made Simple & Secure</p>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Join our platform as a licensed healthcare provider and start connecting with patients 
          through secure video consultations.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Row 1: First Name, Last Name, Gender */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              {...register('firstName')}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              {...register('lastName')}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="gender">Gender *</Label>
            <Select onValueChange={(value) => setValue('gender', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
            )}
          </div>
        </div>

        {/* Row 2: Email, Age, License Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="john.doe@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="age">Age *</Label>
            <Input
              id="age"
              type="number"
              {...register('age')}
              placeholder="35"
              min="18"
              max="100"
            />
            {errors.age && (
              <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="licenseType">License Type *</Label>
            <Select onValueChange={(value) => setValue('licenseType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select license" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MBBS">MBBS</SelectItem>
                <SelectItem value="MD">MD</SelectItem>
                <SelectItem value="DO">DO</SelectItem>
                <SelectItem value="NP">NP</SelectItem>
                <SelectItem value="PA">PA</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.licenseType && (
              <p className="mt-1 text-sm text-red-600">{errors.licenseType.message}</p>
            )}
          </div>
        </div>

        {/* Row 3: Password, Confirm Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {/* Row 4: Specialty */}
        <div>
          <Label htmlFor="specialty">Specialty *</Label>
          <Select onValueChange={(value) => setValue('specialty', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your specialty" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((spec) => (
                <SelectItem key={spec} value={spec}>
                  {spec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.specialty && (
            <p className="mt-1 text-sm text-red-600">{errors.specialty.message}</p>
          )}
        </div>

        {/* Professional Summary */}
        <div>
          <Label htmlFor="professionalSummary">Professional Summary *</Label>
          <Textarea
            id="professionalSummary"
            {...register('professionalSummary')}
            rows={5}
            placeholder="Tell us about your professional background, experience, and areas of expertise..."
          />
          {errors.professionalSummary && (
            <p className="mt-1 text-sm text-red-600">{errors.professionalSummary.message}</p>
          )}
        </div>

        {/* Terms Agreement */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="agreeToTerms"
            {...register('agreeToTerms')}
            className="mt-1"
          />
          <Label htmlFor="agreeToTerms" className="text-sm cursor-pointer">
            I hereby agree to the{' '}
            <Link href="/terms-of-service" className="text-teal-600 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy-policy" className="text-teal-600 hover:underline">
              Privacy Policy
            </Link>{' '}
            of CareHaven *
          </Label>
        </div>
        {errors.agreeToTerms && (
          <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading || !agreeToTerms}
            className="bg-teal-600 hover:bg-teal-700"
            size="lg"
          >
            {loading ? 'Submitting...' : 'Complete Enrollment'}
          </Button>
        </div>
      </form>
    </div>
  )
}
