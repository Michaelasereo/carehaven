'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const profileSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(1, 'Phone number is required').regex(/^[0-9+\-\s()]+$/, 'Please enter a valid phone number').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  marital_status: z.string().optional(),
  occupation: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  profile: any
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      gender: profile?.gender || undefined,
      marital_status: profile?.marital_status || '',
      occupation: profile?.occupation || '',
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
      alert(error.message || 'Failed to upload photo. Please try again.')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }

      handlePhotoUpload(file)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Error updating profile:', error)
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
            <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
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
          <Label htmlFor="full_name">First Name</Label>
          <Input id="full_name" {...register('full_name')} />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" {...register('email')} disabled />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            {...register('phone')}
            placeholder="e.g., 08141234567 or +2348141234567"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="gender">Gender</Label>
          <Input id="gender" {...register('gender')} />
        </div>

        <div>
          <Label htmlFor="marital_status">Marital Status</Label>
          <Input id="marital_status" {...register('marital_status')} />
        </div>

        <div>
          <Label htmlFor="occupation">Occupation</Label>
          <Input id="occupation" {...register('occupation')} />
        </div>
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

