import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AvailabilityManager } from '@/components/doctor/availability-manager'

export default async function AvailabilityPage() {
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
    redirect('/patient')
  }

  // Fetch existing availability
  const { data: availability } = await supabase
    .from('doctor_availability')
    .select('*')
    .eq('doctor_id', user.id)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Availability</h1>
        <p className="text-gray-600 mt-2">
          Set your available hours for each day of the week. Patients can only book appointments during these times.
        </p>
      </div>

      <AvailabilityManager doctorId={user.id} initialAvailability={availability || []} />
    </div>
  )
}
