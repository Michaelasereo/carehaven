'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import {
  logProfileUpdateError,
  getProfileUpdateErrorMessage,
  sanitizeGender,
  sanitizeAge,
} from '@/lib/utils/profile-update-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(1, 'Phone number is required').regex(/^[0-9+\-\s()]+$/, 'Please enter a valid phone number'),
  age: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function CompleteProfileForm() {
  const router = useRouter()
  const supabase = createClient()
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/signin')
        return
      }

      const gender = sanitizeGender(data.gender)
      const age = sanitizeAge(data.age)
      // Omit age from main update to avoid "age column not in schema cache" 400.
      const mainPayload = {
        full_name: data.full_name,
        phone: data.phone || null,
        gender,
        profile_completed: true,
        onboarded_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .update(mainPayload)
        .eq('id', user.id)

      if (error) {
        logProfileUpdateError('complete-profile update', error)
        addToast({
          variant: 'destructive',
          title: 'Update Failed',
          description: getProfileUpdateErrorMessage(error),
        })
        setIsLoading(false)
        return
      }

      if (age != null) {
        const { error: ageErr } = await supabase
          .from('profiles')
          .update({ age })
          .eq('id', user.id)
        if (ageErr) {
          console.warn('[Complete profile] Age update skipped (schema cache?):', ageErr.message)
        }
      }

      // Get user role and redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const redirectPath = profile?.role === 'doctor' ? '/doctor/dashboard' : '/patient'
      
      // Use full page navigation to ensure proper session handling and middleware checks
      window.location.href = redirectPath
    } catch (error) {
      logProfileUpdateError('complete-profile (catch)', error)
      addToast({
        variant: 'destructive',
        title: 'Error',
        description: getProfileUpdateErrorMessage(error),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          {...register('full_name')}
          placeholder="Enter your full name"
        />
        {errors.full_name && (
          <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          {...register('phone')}
          placeholder="e.g., 08141234567 or +2348141234567"
          required
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Required for SMS appointment notifications
        </p>
      </div>

      <div>
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          type="number"
          min="0"
          max="150"
          placeholder="Enter your age"
          {...register('age')}
        />
      </div>

      <div>
        <Label htmlFor="gender">Gender</Label>
        <Select onValueChange={(value) => setValue('gender', value as 'male' | 'female' | 'other')}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        className="w-full bg-teal-600 hover:bg-teal-700"
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Complete Profile'}
      </Button>
    </form>
  )
}

