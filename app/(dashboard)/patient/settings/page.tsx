import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsNav } from '@/components/settings/settings-nav'

export default async function PatientSettingsPage() {
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

  if (!profile || profile.role !== 'patient') {
    redirect('/patient')
  }

  // Redirect to notifications as default
  redirect('/patient/settings/notifications')
}
