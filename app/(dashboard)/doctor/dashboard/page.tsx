import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Stethoscope, 
  Calendar, 
  FileText, 
  DollarSign, 
  Users, 
  TrendingUp,
  Clock,
  Bell
} from 'lucide-react'
import { MetricsCard } from '@/components/doctor/metrics-card'
import { DoctorDashboardClient } from '@/components/doctor/dashboard-client'
import { 
  getTimeRange, 
  calculateTrend, 
  getUniquePatients,
  getRepeatVisitRate,
  getCompletionRate,
  getCancellationRate
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
    { count: investigations },
    { count: consultationsPrevious },
    { count: upcomingPrevious },
    { data: newPatientsThisMonth },
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
    supabase
      .from('investigations')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', user.id),
    // Previous period for trends
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', user.id)
      .eq('status', 'completed')
      .gte('scheduled_at', previousTimeRange.start.toISOString())
      .lte('scheduled_at', previousTimeRange.end.toISOString()),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', user.id)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_at', new Date().toISOString())
      .lt('scheduled_at', subDays(new Date(), 30).toISOString()),
    // New patients this month
    supabase
      .from('appointments')
      .select('patient_id')
      .eq('doctor_id', user.id)
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString()),
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

  // Calculate metrics
  const uniquePatientIds = new Set((newPatientsThisMonth || [])?.map((apt: any) => apt.patient_id) || [])
  const newPatientsCount = uniquePatientIds.size
  const repeatVisitRate = await getRepeatVisitRate(user.id)
  const completionRate = await getCompletionRate(user.id, timeRange.start, timeRange.end)
  const cancellationRate = await getCancellationRate(user.id, timeRange.start, timeRange.end)

  // Calculate average consultation fee
  const avgConsultationFee = totalConsultations && totalConsultations > 0
    ? totalRevenue / totalConsultations
    : Number(profile.consultation_fee || 0)

  const stats = [
    {
      title: 'Total Consultations',
      value: totalConsultations || 0,
      icon: Stethoscope,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      trend: { value: consultationsTrend, period: 'last month' },
      realtimeTable: 'appointments' as const,
      realtimeFilter: { doctor_id: user.id, status: 'completed' },
    },
    {
      title: 'Upcoming Appointments',
      value: upcomingAppointments || 0,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      realtimeTable: 'appointments' as const,
      realtimeFilter: { doctor_id: user.id },
    },
    {
      title: 'Total Revenue',
      value: `₦${Math.round(totalRevenue / 100).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: { value: revenueTrend, period: 'last month' },
    },
    {
      title: 'Total Patients',
      value: totalPatients || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your practice</p>
        </div>
        <div className="flex gap-2">
          <Link href="/doctor/appointments">
            <Button variant="outline">View All Appointments</Button>
          </Link>
          <Link href="/doctor/analytics">
            <Button variant="outline">View Analytics</Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards with Real-time Updates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <MetricsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            bgColor={stat.bgColor}
            trend={stat.trend}
            realtimeTable={stat.realtimeTable}
            realtimeFilter={stat.realtimeFilter}
          />
        ))}
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Patients (30d)</p>
              <p className="text-2xl font-bold mt-2">{newPatientsCount}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Repeat Visit Rate</p>
              <p className="text-2xl font-bold mt-2">{repeatVisitRate}%</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold mt-2">{completionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Cancellation: {cancellationRate}%</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Consultation Fee</p>
              <p className="text-2xl font-bold mt-2">₦{Math.round(avgConsultationFee / 100).toLocaleString()}</p>
            </div>
            <div className="bg-teal-50 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions with Recent Activity */}
      <DoctorDashboardClient 
        doctorId={user.id}
        unreadNotifications={unreadNotifications || 0}
      />
    </div>
  )
}
