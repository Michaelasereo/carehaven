import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DoctorMetricsGrid } from '@/components/doctor/doctor-metrics-grid'
import { DoctorDashboardClient } from '@/components/doctor/dashboard-client'
import { 
  getTimeRange, 
  calculateTrend, 
  getUniquePatients
} from '@/lib/doctor/analytics'
import { subDays, format } from 'date-fns'
import Link from 'next/link'

export default async function DoctorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/doctor/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'doctor') {
    redirect('/patient')
  }

  const timeRange = getTimeRange('30d')
  const previousTimeRange = {
    start: subDays(timeRange.start, 30),
    end: subDays(timeRange.end, 30),
  }

  // Fetch current period statistics
  const [
    { count: totalConsultations },
    { count: upcomingAppointments },
    { count: consultationsPrevious },
    { data: paidAppointments },
    { data: paidAppointmentsPrevious },
    { count: unreadNotifications },
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', user.id)
      .eq('status', 'completed')
      .gte('scheduled_at', timeRange.start.toISOString())
      .lte('scheduled_at', timeRange.end.toISOString()),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', user.id)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_at', new Date().toISOString()),
    // Previous period for trends
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', user.id)
      .eq('status', 'completed')
      .gte('scheduled_at', previousTimeRange.start.toISOString())
      .lte('scheduled_at', previousTimeRange.end.toISOString()),
    // Revenue
    supabase
      .from('appointments')
      .select('amount')
      .eq('doctor_id', user.id)
      .eq('payment_status', 'paid')
      .gte('scheduled_at', timeRange.start.toISOString())
      .lte('scheduled_at', timeRange.end.toISOString()),
    supabase
      .from('appointments')
      .select('amount')
      .eq('doctor_id', user.id)
      .eq('payment_status', 'paid')
      .gte('scheduled_at', previousTimeRange.start.toISOString())
      .lte('scheduled_at', previousTimeRange.end.toISOString()),
    // Notifications
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false),
  ])

  // Get total unique patients
  const totalPatients = await getUniquePatients(user.id)

  const totalRevenue = paidAppointments?.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0
  const previousRevenue = paidAppointmentsPrevious?.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0

  // Calculate trends
  const consultationsTrend = await calculateTrend(totalConsultations || 0, consultationsPrevious || 0)
  const revenueTrend = previousRevenue > 0 
    ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
    : totalRevenue > 0 ? 100 : 0

  // Metrics removed - no longer displaying additional summary cards

  const stats = [
    {
      title: 'Total Consultations',
      value: totalConsultations || 0,
      iconName: 'Stethoscope',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      trend: { value: consultationsTrend, period: 'last month' },
      realtimeTable: 'appointments' as const,
      realtimeFilter: { doctor_id: user.id, status: 'completed' },
      realtimeQueryType: 'count' as const,
      realtimeQueryConfig: {
        dateRange: {
          start: timeRange.start.toISOString(),
          end: timeRange.end.toISOString(),
        },
      },
    },
    {
      title: 'Upcoming Appointments',
      value: upcomingAppointments || 0,
      iconName: 'Calendar',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      realtimeTable: 'appointments' as const,
      realtimeFilter: { doctor_id: user.id },
      realtimeQueryType: 'count' as const,
      realtimeQueryConfig: {
        statusFilter: ['scheduled', 'confirmed'],
        dateFilter: { gte: new Date().toISOString() },
      },
    },
    {
      title: 'Total Revenue',
      value: `₦${Math.round(totalRevenue / 100).toLocaleString()}`,
      iconName: 'DollarSign',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: { value: revenueTrend, period: 'last month' },
      realtimeTable: 'appointments' as const,
      realtimeFilter: { doctor_id: user.id, payment_status: 'paid' },
      realtimeQueryType: 'sum' as const,
      realtimeQueryConfig: {
        sumField: 'amount',
        dateRange: {
          start: timeRange.start.toISOString(),
          end: timeRange.end.toISOString(),
        },
      },
    },
    {
      title: 'Total Patients',
      value: totalPatients || 0,
      iconName: 'Users',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      realtimeTable: 'appointments' as const,
      realtimeFilter: { doctor_id: user.id },
      realtimeQueryType: 'unique' as const,
      realtimeQueryConfig: {
        uniqueField: 'patient_id',
      },
    },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Overview of your practice</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/doctor/appointments" className="flex-1 sm:flex-initial">
            <Button variant="outline" className="w-full sm:w-auto min-h-[44px] sm:min-h-0">View All Appointments</Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards with Real-time Updates */}
      <DoctorMetricsGrid stats={stats} />

      {/* Quick Actions with Recent Activity */}
      <DoctorDashboardClient 
        doctorId={user.id}
        unreadNotifications={unreadNotifications || 0}
      />
    </div>
  )
}
