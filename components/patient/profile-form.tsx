'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'

const profileSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      gender: profile?.gender || undefined,
      marital_status: profile?.marital_status || '',
      occupation: profile?.occupation || '',
    },
  })

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
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <Button
            type="button"
            size="icon"
            className="absolute bottom-0 right-0 rounded-full"
            variant="secondary"
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
        <Button type="button" variant="outline">
          Upload Profile Photo
        </Button>
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

