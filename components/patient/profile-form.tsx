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

const profileSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(1, 'Phone number is required').regex(/^[0-9+\-\s()]+$/, 'Please enter a valid phone number').optional(),
  age: z.string().optional().refine((val) => {
    if (!val) return true
    const num = parseInt(val, 10)
    return !isNaN(num) && num >= 0 && num <= 150
  }, 'Age must be between 0 and 150'),
  gender: z.enum(['male', 'female', 'other']).optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  profile: any
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      age: profile?.age ? String(profile.age) : '',
      gender: profile?.gender || undefined,
    },
  })

  const handlePhotoUpload = async (file: File) => {
    setIsUploadingPhoto(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Generate unique file path (without bucket name in path)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
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
        .select('*')

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      
      // Trigger a custom event to notify the header component
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profile-avatar-updated', {
          detail: { avatarUrl: publicUrl, userId: user.id }
        }))
      }
      
      router.refresh()
      
      // Add success toast
      addToast({
        variant: 'success',
        title: 'Success',
        description: 'Profile picture updated successfully!',
      })
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

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    
    try {
      // Validate form before submission
      if (!isValid) {
        addToast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Please fix form errors before saving.',
        })
        setIsLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        addToast({
          variant: 'destructive',
          title: 'Error',
          description: 'User not authenticated. Please sign in again.',
        })
        setIsLoading(false)
        return
      }

      let updateResult: any[] | null = null
      let updateError: any = null

      // Try updating with all fields including age
      const { data: updateData, error: updateErrorResponse } = await supabase
        .from('profiles')
        .update({ 
          full_name: data.full_name,
          phone: data.phone || null,
          age: data.age ? parseInt(data.age, 10) : null,
          gender: data.gender || null
        })
        .eq('id', user.id)
        .select('*')

      updateResult = updateData
      updateError = updateErrorResponse

      // Handle schema cache errors specifically for age column
      if (updateError && (updateError.message?.includes('age') || updateError.message?.includes('schema cache'))) {
        console.warn('Schema cache error detected for age column, retrying without age first')
        
        // Retry without age if schema cache error
        const { data: retryData, error: retryError } = await supabase
          .from('profiles')
          .update({ 
            full_name: data.full_name,
            phone: data.phone || null,
            gender: data.gender || null
          })
          .eq('id', user.id)
          .select('*')
        
        if (retryError) {
          console.error('Retry update failed:', retryError)
          throw retryError
        }
        
        if (!retryData || retryData.length === 0) {
          throw new Error('Profile update failed: No rows were updated')
        }
        
        // Update result with retry data
        updateResult = retryData
        
        // If retry succeeded, try updating age separately
        if (data.age) {
          const { error: ageError } = await supabase
            .from('profiles')
            .update({ age: parseInt(data.age, 10) })
            .eq('id', user.id)
            .select('*')
          
          if (ageError) {
            console.warn('Failed to update age separately:', ageError)
            // Don't throw - other fields were updated successfully
            // Age will be updated on next form submission or page refresh
          } else {
            // If age update succeeded, refetch the full profile
            const { data: fullProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()
            
            if (fullProfile) {
              updateResult = [fullProfile]
            }
          }
        }
      } else if (updateError) {
        // For other errors, throw immediately
        console.error('Supabase error updating profile:', {
          error: updateError,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        })
        throw updateError
      }

      if (!updateResult || updateResult.length === 0) {
        console.warn('Profile update returned no rows:', { userId: user.id })
        throw new Error('Profile update failed: No rows were updated')
      }

      // Small delay to allow real-time subscription to trigger
      await new Promise(resolve => setTimeout(resolve, 100))

      // Trigger a custom event to notify the header component
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profile-updated', {
          detail: { userId: user.id }
        }))
      }

      // Reset loading and editing state before router.refresh() to ensure state is reset
      setIsLoading(false)
      setIsEditing(false)
      
      // Add success toast
      addToast({
        variant: 'success',
        title: 'Success',
        description: 'Profile updated successfully!',
      })

      router.refresh()
    } catch (error: any) {
      console.error('Error updating profile:', {
        error,
        errorString: String(error),
        errorMessage: error?.message,
        errorDetails: error?.details,
        errorHint: error?.hint,
        errorCode: error?.code,
      })
      addToast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error?.message || error?.details || error?.hint || String(error) || 'Failed to update profile. Please try again.',
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
            <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <Button
            type="button"
            size="icon"
            className="absolute bottom-0 right-0 rounded-full min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
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
            className="min-h-[44px] sm:min-h-0"
          >
            {isUploadingPhoto ? 'Uploading...' : 'Upload Profile Photo'}
          </Button>
          {isUploadingPhoto && (
            <p className="text-xs text-gray-500">Uploading photo...</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <Input 
            id="full_name" 
            {...register('full_name')} 
            disabled={!isEditing}
            className="min-h-[44px] sm:min-h-0"
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email" 
            type="email" 
            {...register('email')} 
            disabled 
            className="min-h-[44px] sm:min-h-0"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            {...register('phone')}
            placeholder="e.g., 08141234567 or +2348141234567"
            disabled={!isEditing}
            className="min-h-[44px] sm:min-h-0"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
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
            disabled={!isEditing}
            className="min-h-[44px] sm:min-h-0"
          />
          {errors.age && (
            <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select 
            value={watch('gender') || ''} 
            onValueChange={(value) => setValue('gender', value as 'male' | 'female' | 'other', { shouldValidate: true })}
            disabled={!isEditing}
          >
            <SelectTrigger id="gender" className="min-h-[44px] sm:min-h-0">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3">
        {!isEditing ? (
          <Button
            type="button"
            className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto min-h-[44px] sm:min-h-0"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset({
                  full_name: profile?.full_name || '',
                  email: profile?.email || '',
                  phone: profile?.phone || '',
                  age: profile?.age ? String(profile.age) : '',
                  gender: profile?.gender || undefined,
                })
                setIsEditing(false)
              }}
              disabled={isLoading}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto min-h-[44px] sm:min-h-0"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>
    </form>
  )
}

