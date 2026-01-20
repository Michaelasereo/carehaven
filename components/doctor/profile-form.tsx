'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
import { Card } from '@/components/ui/card'
import { Camera, Loader2, Edit, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

const doctorProfileSchema = z.object({
  bio: z.string().optional(),
  years_experience: z.enum(['1-5', '>5']).optional(),
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
  const [avatarUrl, setAvatarUrl] = useState<string>(profile?.avatar_url || '')
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentBio, setCurrentBio] = useState(profile?.bio || '')
  const [currentYearsExperience, setCurrentYearsExperience] = useState<string>(
    profile?.years_experience === '1-5' || profile?.years_experience === '>5' 
      ? profile.years_experience
      : profile?.years_experience ? '>5' : ''
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Sync avatarUrl when profile prop changes (e.g., after enrollment or page refresh)
  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url)
    } else {
      // Clear avatarUrl if profile doesn't have one
      setAvatarUrl('')
    }
  }, [profile?.avatar_url, profile?.id])

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DoctorProfileFormData>({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: {
      bio: profile?.bio || '',
      years_experience: currentYearsExperience as '1-5' | '>5' | undefined,
    },
  })

  const bioValue = watch('bio')

  // Subscribe to real-time profile changes (bio and avatar)
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel(`profile-updates-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          const newData = payload.new as any
          if (newData.bio !== undefined && newData.bio !== currentBio) {
            setCurrentBio(newData.bio || '')
            setValue('bio', newData.bio || '')
          }
          if (newData.avatar_url !== undefined && newData.avatar_url !== avatarUrl) {
            setAvatarUrl(newData.avatar_url || '')
          }
          if (newData.years_experience !== undefined) {
            const yearsExp = newData.years_experience === '1-5' || newData.years_experience === '>5'
              ? newData.years_experience
              : newData.years_experience ? '>5' : ''
            setCurrentYearsExperience(yearsExp)
            setValue('years_experience', yearsExp as '1-5' | '>5' | undefined)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, supabase, currentBio, avatarUrl, setValue])

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

      // Update profile with new avatar URL (real-time sync will handle UI updates)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      router.refresh()
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

  const onSubmit = async (data: DoctorProfileFormData) => {
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Only update bio and years_experience
      const updateData: any = {
        bio: data.bio || '',
      }

      // Update years_experience if provided
      if (data.years_experience) {
        updateData.years_experience = data.years_experience
      }

      const { data: updateResult, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()

      if (error) {
        console.error('Supabase error updating profile:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          updateData,
          userId: user.id
        })
        throw error
      }

      if (!updateResult || updateResult.length === 0) {
        console.warn('Profile update returned no rows:', { userId: user.id, updateData })
        throw new Error('Profile update failed: No rows were updated')
      }

      setCurrentBio(data.bio || '')
      setCurrentYearsExperience(data.years_experience || '')
      setIsEditMode(false)
      router.refresh()
      addToast({
        variant: 'success',
        title: 'Success',
        description: 'Profile updated successfully!',
      })
    } catch (error: any) {
      console.error('Error updating profile:', {
        error,
        errorString: String(error),
        errorMessage: error?.message,
        errorDetails: error?.details,
        errorHint: error?.hint,
        errorCode: error?.code,
        errorStack: error?.stack,
        errorType: typeof error,
        errorKeys: error ? Object.keys(error) : []
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

  const handleCancel = () => {
    setValue('bio', currentBio)
    setValue('years_experience', currentYearsExperience as '1-5' | '>5' | undefined)
    setIsEditMode(false)
  }

  // Display mode
  if (!isEditMode) {
    // Use avatarUrl state first, then fall back to profile.avatar_url, ensuring we get the latest value
    const displayAvatarUrl = (avatarUrl || profile?.avatar_url || '').trim()
    const displayYearsExp = currentYearsExperience || 
      (profile?.years_experience === '1-5' || profile?.years_experience === '>5' 
        ? profile.years_experience
        : profile?.years_experience ? '>5' : '')
    
    // Debug: Log if avatar_url is missing (only in development)
    if (process.env.NODE_ENV === 'development' && !displayAvatarUrl && profile?.id) {
      console.log('Profile avatar_url missing for profile:', profile.id, 'Profile data:', {
        hasAvatarUrl: !!profile?.avatar_url,
        avatarUrlState: avatarUrl,
        profileAvatarUrl: profile?.avatar_url
      })
    }

    return (
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {displayAvatarUrl ? (
                  <AvatarImage 
                    src={displayAvatarUrl} 
                    alt={profile?.full_name || 'Doctor'}
                    onError={() => {
                      // If image fails to load, clear the avatarUrl to show fallback
                      console.warn('Failed to load avatar image:', displayAvatarUrl)
                      setAvatarUrl('')
                    }}
                  />
                ) : null}
                <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl font-semibold">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'D'}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name || 'Doctor'}</h2>
              <p className="text-gray-600 mt-1">{profile?.email || 'No email'}</p>
              {profile?.specialty && (
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">Specialty:</span> {profile.specialty}
                </p>
              )}
              {displayYearsExp && (
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">Experience:</span> {displayYearsExp === '1-5' ? '1-5 years' : '5+ years'}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={() => setIsEditMode(true)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm font-medium text-gray-500">Full Name</p>
            <p className="text-gray-900 mt-1">{profile?.full_name || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-gray-900 mt-1">{profile?.email || 'Not set'}</p>
          </div>
          {profile?.specialty && (
            <div>
              <p className="text-sm font-medium text-gray-500">Specialty</p>
              <p className="text-gray-900 mt-1">{profile.specialty}</p>
            </div>
          )}
          {displayYearsExp && (
            <div>
              <p className="text-sm font-medium text-gray-500">Years of Experience</p>
              <p className="text-gray-900 mt-1">
                {displayYearsExp === '1-5' ? '1-5 years' : '5+ years'}
              </p>
            </div>
          )}
          {profile?.license_number && (
            <div>
              <p className="text-sm font-medium text-gray-500">License Number</p>
              <p className="text-gray-900 mt-1">{profile.license_number}</p>
            </div>
          )}
        </div>

        {currentBio && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Summary</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{currentBio}</p>
          </div>
        )}
      </Card>
    )
  }

  // Edit mode
  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              {(avatarUrl || profile?.avatar_url) ? (
                <AvatarImage 
                  src={avatarUrl || profile?.avatar_url || ''} 
                  alt={profile?.full_name || 'Doctor'}
                  onError={() => {
                    console.warn('Failed to load avatar image in edit mode')
                    setAvatarUrl('')
                  }}
                />
              ) : null}
              <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl font-semibold">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'D'}
              </AvatarFallback>
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
              {isUploadingPhoto ? 'Uploading...' : 'Change Profile Picture'}
            </Button>
            {isUploadingPhoto && (
              <p className="text-xs text-gray-500">Uploading photo...</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="years_experience">Years of Experience</Label>
          <Select
            value={watch('years_experience')}
            onValueChange={(value) => setValue('years_experience', value as '1-5' | '>5')}
          >
            <SelectTrigger id="years_experience">
              <SelectValue placeholder="Select years of experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-5">1-5 years</SelectItem>
              <SelectItem value=">5">5+ years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="bio">Professional Summary / Bio</Label>
          <Textarea
            id="bio"
            value={bioValue || ''}
            onChange={(e) => setValue('bio', e.target.value)}
            rows={5}
            placeholder="Tell us about your experience and approach to patient care..."
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-teal-600 hover:bg-teal-700"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Card>
  )
}