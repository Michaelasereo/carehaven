import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PatientDemographics } from '@/components/dashboard/patient-demographics'
import { AppointmentsListClient } from '@/components/patient/appointments-list-client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar } from 'lucide-react'

export default async function AppointmentsPage() {
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
    .in('payment_status', ['paid', 'waived'])
    .order('scheduled_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Upcoming Appointments
        </h1>
        <Link href="/patient/appointments/book">
          <Button className="bg-teal-600 hover:bg-teal-700">
            + Book Appointment
          </Button>
        </Link>
      </div>

      {profile && (
        <PatientDemographics
          name={profile.full_name}
          age={profile.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : undefined}
          sex={profile.gender?.charAt(0).toUpperCase()}
          occupation={profile.occupation}
          maritalStatus={profile.marital_status}
        />
      )}

      <AppointmentsListClient
        patientId={user.id}
        initialAppointments={appointments || []}
      />
    </div>
  )
}

