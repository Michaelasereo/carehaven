import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DoctorSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'doctor') {
    redirect('/doctor/dashboard')
  }

  // Redirect to notifications as default
  redirect('/doctor/settings/notifications')
}
