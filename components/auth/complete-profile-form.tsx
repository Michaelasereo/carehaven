'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
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

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(1, 'Phone number is required').regex(/^[0-9+\-\s()]+$/, 'Please enter a valid phone number'),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function CompleteProfileForm() {
  const router = useRouter()
  const supabase = createClient()
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

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          date_of_birth: data.date_of_birth ? new Date(data.date_of_birth).toISOString() : null,
          gender: data.gender,
          profile_completed: true,
          onboarded_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating profile:', error)
        alert('Failed to update profile. Please try again.')
        return
      }

      // Get user role and redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const redirectPath = profile?.role === 'doctor' ? '/doctor/dashboard' : '/patient'
      router.push(redirectPath)
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
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
        <Label htmlFor="date_of_birth">Date of Birth</Label>
        <Input
          id="date_of_birth"
          type="date"
          {...register('date_of_birth')}
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

