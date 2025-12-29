import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PatientDemographics } from '@/components/dashboard/patient-demographics'
import { SessionCard } from '@/components/patient/session-card'
import { Calendar } from 'lucide-react'

export default async function SessionsPage() {
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

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, profiles!appointments_doctor_id_fkey(*)')
    .eq('patient_id', user.id)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Session Notes</h1>

      {profile && (
        <PatientDemographics
          name={profile.full_name}
          age={profile.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : undefined}
          sex={profile.gender?.charAt(0).toUpperCase()}
          occupation={profile.occupation}
          maritalStatus={profile.marital_status}
        />
      )}

      <div className="grid gap-4">
        {appointments && appointments.length > 0 ? (
          appointments.map((appointment: any) => (
            <SessionCard key={appointment.id} appointment={appointment} />
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No session notes available</p>
        )}
      </div>
    </div>
  )
}

