import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PatientMetricsGrid } from '@/components/patient/patient-metrics-grid'
import { PatientDashboardClient } from '@/components/patient/dashboard-client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
      .in('payment_status', ['paid', 'waived'])
      .order('scheduled_at', { ascending: true })
      .limit(3),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', user.id)
      .eq('status', 'completed'),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', user.id)
      .in('payment_status', ['paid', 'waived'])
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
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Welcome Card */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-600">Welcome back</p>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
              {profile.full_name || 'Patient'}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/patient/appointments/book">
              <Button className="bg-teal-600 hover:bg-teal-700 min-h-[44px]">Book New Appointment</Button>
            </Link>
            <Link href="/patient/prescriptions">
              <Button variant="outline" className="min-h-[44px]">View Prescriptions</Button>
            </Link>
          </div>
        </div>
      </Card>

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
        profile={{ full_name: profile.full_name }}
        initialAppointments={appointments || []}
        unreadNotifications={unreadNotifications || 0}
      />
    </div>
  )
}

