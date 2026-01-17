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
import Image from 'next/image'

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
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Terms of Service and Privacy Policy',
  }),
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
        email: data.email,
        password: `TempPass${Math.random().toString(36).slice(-8)}!`, // Temporary password
        options: {
          data: {
            role: 'doctor',
            full_name: `${data.firstName} ${data.lastName}`,
            license_type: data.licenseType,
            specialty: data.specialty,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.')
        } else {
          setError(signUpError.message)
        }
        setLoading(false)
        return
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
        <Image
          src="/carehaven%20logo.svg"
          alt="Care Haven Logo"
          width={150}
          height={40}
          className="h-10 w-auto mx-auto mb-4"
          unoptimized
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

        {/* Row 3: Specialty */}
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
