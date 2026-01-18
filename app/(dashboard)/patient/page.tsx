import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PatientMetricsGrid } from '@/components/patient/patient-metrics-grid'
import { PatientDashboardClient } from '@/components/patient/dashboard-client'

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

  // Fetch initial data for SSR
  const [
    { data: appointments },
    { count: totalConsultations },
    { count: upcomingAppointments },
    { count: investigations },
    { count: unreadNotifications },
  ] = await Promise.all([
    supabase
    .from('appointments')
    .select('*, profiles!appointments_doctor_id_fkey(*)')
    .eq('patient_id', user.id)
    .order('scheduled_at', { ascending: true })
      .limit(5),
    supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', user.id)
      .eq('status', 'completed'),
    supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', user.id)
      .in('status', ['scheduled', 'confirmed']),
    supabase
    .from('investigations')
    .select('*', { count: 'exact', head: true })
      .eq('patient_id', user.id),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false),
  ])

  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Statistics Cards with Real-time Updates */}
      <PatientMetricsGrid
        metrics={[
          {
            iconName: 'Stethoscope',
            value: totalConsultations || 0,
            label: 'Total Consultations',
            color: 'text-teal-600',
            bgColor: 'bg-teal-100',
            realtimeTable: 'appointments',
            realtimeFilter: { patient_id: user.id, status: 'completed' },
          },
          {
            iconName: 'Calendar',
            value: upcomingAppointments || 0,
            label: 'Upcoming Appointments',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            realtimeTable: 'appointments',
            realtimeFilter: { patient_id: user.id },
          },
          {
            iconName: 'FileText',
            value: investigations || 0,
            label: 'Investigations',
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            realtimeTable: 'investigations',
            realtimeFilter: { patient_id: user.id },
          },
        ]}
      />

      {/* Client Component with Real-time Updates */}
      <PatientDashboardClient
        patientId={user.id}
        initialAppointments={appointments || []}
        unreadNotifications={unreadNotifications || 0}
      />
    </div>
  )
}

