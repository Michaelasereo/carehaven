'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Camera, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

const doctorProfileSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  gender: z.enum(['male', 'female', 'other']).optional(),
  marital_status: z.string().optional(),
  phone: z.string().optional(),
  license_number: z.string().optional(),
  specialty: z.string().optional(),
  years_experience: z.string().optional(),
  consultation_fee: z.string().optional(),
  bio: z.string().optional(),
})

type DoctorProfileFormData = z.infer<typeof doctorProfileSchema>

interface DoctorProfileFormProps {
  profile: any
}

export function DoctorProfileForm({ profile }: DoctorProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DoctorProfileFormData>({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      gender: profile?.gender || undefined,
      marital_status: profile?.marital_status || '',
      phone: profile?.phone || '',
      license_number: profile?.license_number || '',
      specialty: profile?.specialty || '',
      years_experience: profile?.years_experience?.toString() || '',
      consultation_fee: profile?.consultation_fee?.toString() || '',
      bio: profile?.bio || '',
    },
  })

  const handlePhotoUpload = async (file: File) => {
    setIsUploadingPhoto(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Generate unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `avatars/${user.id}/${Date.now()}.${fileExt}`
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      router.refresh()
    } catch (error: any) {
      console.error('Error uploading photo:', error)
      addToast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Failed to upload photo. Please try again.',
      })
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        addToast({
          variant: 'destructive',
          title: 'Invalid File',
          description: 'Please select an image file',
        })
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          variant: 'destructive',
          title: 'File Too Large',
          description: 'Image size must be less than 5MB',
        })
        return
      }

      handlePhotoUpload(file)
    }
  }

  const onSubmit = async (data: DoctorProfileFormData) => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Convert string fields to appropriate types
      const updateData: any = {
        full_name: data.full_name,
        email: data.email,
        gender: data.gender,
        marital_status: data.marital_status,
        phone: data.phone,
        license_number: data.license_number,
        specialty: data.specialty,
        bio: data.bio,
      }

      // Convert numeric fields
      if (data.years_experience) {
        updateData.years_experience = parseInt(data.years_experience, 10)
      }
      if (data.consultation_fee) {
        updateData.consultation_fee = parseFloat(data.consultation_fee)
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      router.refresh()
      addToast({
        variant: 'success',
        title: 'Success',
        description: 'Profile updated successfully!',
      })
    } catch (error: any) {
      console.error('Error updating profile:', error)
      addToast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update profile. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl || profile?.avatar_url} />
            <AvatarFallback>{profile?.full_name?.charAt(0) || 'D'}</AvatarFallback>
          </Avatar>
          <Button
            type="button"
            size="icon"
            className="absolute bottom-0 right-0 rounded-full"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
          >
            {isUploadingPhoto ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
          >
            {isUploadingPhoto ? 'Uploading...' : 'Upload Profile Photo'}
          </Button>
          {isUploadingPhoto && (
            <p className="text-xs text-gray-500">Uploading photo...</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label htmlFor="full_name">Full Name *</Label>
          <Input id="full_name" {...register('full_name')} />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input id="email" type="email" {...register('email')} disabled />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={watch('gender')}
            onValueChange={(value) => setValue('gender', value as 'male' | 'female' | 'other')}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="marital_status">Marital Status</Label>
          <Input id="marital_status" {...register('marital_status')} />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" type="tel" {...register('phone')} />
        </div>

        <div>
          <Label htmlFor="license_number">License Number</Label>
          <Input id="license_number" {...register('license_number')} />
        </div>

        <div>
          <Label htmlFor="specialty">Specialty</Label>
          <Input id="specialty" {...register('specialty')} placeholder="e.g., Cardiology, Pediatrics" />
        </div>

        <div>
          <Label htmlFor="years_experience">Years of Experience</Label>
          <Input id="years_experience" type="number" {...register('years_experience')} />
        </div>

        <div>
          <Label htmlFor="consultation_fee">Consultation Fee (NGN)</Label>
          <Input id="consultation_fee" type="number" step="0.01" {...register('consultation_fee')} />
        </div>
      </div>

      <div>
        <Label htmlFor="bio">Professional Summary / Bio</Label>
        <Textarea
          id="bio"
          {...register('bio')}
          rows={5}
          placeholder="Tell us about your experience and approach to patient care..."
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          className="bg-teal-600 hover:bg-teal-700"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
