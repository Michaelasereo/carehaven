import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PatientDemographics } from '@/components/dashboard/patient-demographics'
import { MetricCard } from '@/components/patient/metric-card'
import { Stethoscope, Calendar, FileText } from 'lucide-react'
import { AppointmentCard } from '@/components/patient/appointment-card'

export default async function PatientDashboardPage() {
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

  if (!profile || !profile.profile_completed) {
    redirect('/complete-profile')
  }

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, profiles!appointments_doctor_id_fkey(*)')
    .eq('patient_id', user.id)
    .order('scheduled_at', { ascending: true })
    .limit(5)

  const { count: totalConsultations } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', user.id)
    .eq('status', 'completed')

  const { count: upcomingAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', user.id)
    .in('status', ['scheduled', 'confirmed'])

  const { count: investigations } = await supabase
    .from('investigations')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', user.id)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      
      <PatientDemographics
        name={profile.full_name}
        age={profile.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : undefined}
        sex={profile.gender?.charAt(0).toUpperCase()}
        occupation={profile.occupation}
        maritalStatus={profile.marital_status}
      />

      <div className="grid grid-cols-3 gap-6">
        <MetricCard
          icon={Stethoscope}
          value={totalConsultations || 0}
          label="Total Consultations"
        />
        <MetricCard
          icon={Calendar}
          value={upcomingAppointments || 0}
          label="Upcoming Appointments"
        />
        <MetricCard
          icon={FileText}
          value={investigations || 0}
          label="Investigations"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Appointments
        </h2>
        <div className="grid gap-4">
          {appointments && appointments.length > 0 ? (
            appointments.map((appointment: any) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <p className="text-gray-500">No upcoming appointments</p>
          )}
        </div>
      </div>
    </div>
  )
}

