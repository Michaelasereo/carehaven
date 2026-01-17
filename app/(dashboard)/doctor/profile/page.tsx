import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DoctorProfileForm } from '@/components/doctor/profile-form'

export default async function DoctorProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'doctor') {
    redirect('/doctor/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your professional profile information</p>
      </div>
      <DoctorProfileForm profile={profile} />
    </div>
  )
}
