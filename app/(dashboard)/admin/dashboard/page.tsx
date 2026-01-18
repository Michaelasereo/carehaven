import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Activity, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AdminMetricsGrid } from '@/components/admin/admin-metrics-grid'
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client'
import { ConsultationPriceManager } from '@/components/admin/consultation-price-manager'
import { ConsultationDurationManager } from '@/components/admin/consultation-duration-manager'
import { 
  getTimeRange, 
  calculateTrend, 
  getActiveUsers, 
  calculateARPU, 
  getConversionRate 
} from '@/lib/admin/analytics'
import { subDays } from 'date-fns'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    redirect('/patient')
  }

  const timeRange = getTimeRange('30d')
  const previousTimeRange = {
    start: subDays(timeRange.start, 30),
    end: subDays(timeRange.end, 30),
  }

  // Fetch current period statistics
  const [
    { count: totalPatients },
    { count: totalDoctors },
    { count: totalAppointments },
    { count: pendingVerifications },
    { count: patientsPrevious },
    { count: doctorsPrevious },
    { count: appointmentsPrevious },
    { count: activeUsers7d },
    { count: activeUsers30d },
    { count: signups },
    { count: profileCompletions },
    { count: firstAppointments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'doctor'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'doctor')
      .eq('license_verified', false),
    // Previous period for trends
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'patient')
      .lt('created_at', previousTimeRange.end.toISOString()),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'doctor')
      .lt('created_at', previousTimeRange.end.toISOString()),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', previousTimeRange.end.toISOString()),
    // Active users (using updated_at as proxy for last activity)
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', subDays(new Date(), 7).toISOString()),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', subDays(new Date(), 30).toISOString()),
    // Conversion metrics
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString()),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('profile_completed', true)
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString()),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString()),
  ])

  // Calculate revenue efficiently
  const { data: paidAppointments } = await supabase
    .from('appointments')
    .select('amount')
    .eq('payment_status', 'paid')
    .gte('scheduled_at', timeRange.start.toISOString())
    .lte('scheduled_at', timeRange.end.toISOString())

  const totalRevenue = paidAppointments?.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0

  // Calculate previous period revenue
  const { data: paidAppointmentsPrevious } = await supabase
    .from('appointments')
    .select('amount')
    .eq('payment_status', 'paid')
    .gte('scheduled_at', previousTimeRange.start.toISOString())
    .lte('scheduled_at', previousTimeRange.end.toISOString())

  const previousRevenue = paidAppointmentsPrevious?.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0

  // Calculate trends
  const patientsTrend = await calculateTrend(totalPatients || 0, patientsPrevious || 0)
  const doctorsTrend = await calculateTrend(totalDoctors || 0, doctorsPrevious || 0)
  const appointmentsTrend = await calculateTrend(totalAppointments || 0, appointmentsPrevious || 0)
  const revenueTrend = previousRevenue > 0 
    ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
    : totalRevenue > 0 ? 100 : 0

  // Calculate ARPU
  const arpu = await calculateARPU(totalRevenue, (totalPatients || 0) + (totalDoctors || 0))

  // Calculate conversion rates
  const signupToProfileRate = await getConversionRate(profileCompletions || 0, signups || 0)
  const profileToAppointmentRate = await getConversionRate(firstAppointments || 0, profileCompletions || 0)

  const stats = [
    {
      title: 'Total Patients',
      value: totalPatients || 0,
      iconName: 'Users' as const,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: { value: patientsTrend, period: 'last month' },
      realtimeTable: 'profiles' as const,
      realtimeFilter: { role: 'patient' },
    },
    {
      title: 'Total Doctors',
      value: totalDoctors || 0,
      iconName: 'Stethoscope' as const,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      trend: { value: doctorsTrend, period: 'last month' },
      realtimeTable: 'profiles' as const,
      realtimeFilter: { role: 'doctor' },
    },
    {
      title: 'Total Appointments',
      value: totalAppointments || 0,
      iconName: 'Calendar' as const,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: { value: appointmentsTrend, period: 'last month' },
      realtimeTable: 'appointments' as const,
    },
    {
      title: 'Total Revenue',
      value: `₦${(totalRevenue / 100).toLocaleString()}`,
      iconName: 'DollarSign' as const,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: { value: revenueTrend, period: 'last month' },
    },
    {
      title: 'Pending Verifications',
      value: pendingVerifications || 0,
      iconName: 'UserCheck' as const,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform overview and management</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/doctors">
            <Button variant="outline">Manage Doctors</Button>
          </Link>
          <Link href="/admin/patients">
            <Button variant="outline">Manage Patients</Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards with Real-time Updates */}
      <AdminMetricsGrid stats={stats} />

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users (7d)</p>
              <p className="text-2xl font-bold mt-2">{activeUsers7d || 0}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users (30d)</p>
              <p className="text-2xl font-bold mt-2">{activeUsers30d || 0}</p>
            </div>
            <div className="bg-teal-50 p-3 rounded-lg">
              <Activity className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ARPU</p>
              <p className="text-2xl font-bold mt-2">₦{Math.round(arpu / 100).toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold mt-2">{signupToProfileRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Signup → Profile</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Consultation Settings Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConsultationPriceManager />
        <ConsultationDurationManager />
      </div>

      {/* Quick Actions with Recent Activity */}
      <AdminDashboardClient 
        pendingVerifications={pendingVerifications || 0}
        profileToAppointmentRate={profileToAppointmentRate}
      />
    </div>
  )
}
