'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { format, subDays } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function DoctorAnalyticsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = new Date()
      let startDate: Date
      
      switch (period) {
        case '7d':
          startDate = subDays(now, 7)
          break
        case '30d':
          startDate = subDays(now, 30)
          break
        case '90d':
          startDate = subDays(now, 90)
          break
        default:
          startDate = subDays(now, 30)
      }

      // Fetch appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('scheduled_at, status, amount, payment_status')
        .eq('doctor_id', user.id)
        .gte('scheduled_at', startDate.toISOString())
        .order('scheduled_at', { ascending: true })

      // Calculate metrics
      const totalAppointments = appointments?.length || 0
      const completedAppointments = appointments?.filter(apt => apt.status === 'completed').length || 0
      const cancelledAppointments = appointments?.filter(apt => apt.status === 'cancelled').length || 0
      
      const paidAppointments = appointments?.filter(apt => apt.payment_status === 'paid') || []
      const totalRevenue = paidAppointments.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0)

      // Revenue by day
      const revenueByDay = new Map<string, number>()
      paidAppointments.forEach((apt) => {
        const date = format(new Date(apt.scheduled_at), 'MMM d')
        const current = revenueByDay.get(date) || 0
        revenueByDay.set(date, current + (Number(apt.amount) || 0))
      })

      // Appointments by status
      const statusData = [
        { name: 'Completed', value: completedAppointments },
        { name: 'Cancelled', value: cancelledAppointments },
        { name: 'Scheduled', value: totalAppointments - completedAppointments - cancelledAppointments },
      ]

      // Appointments by day
      const appointmentsByDay = new Map<string, number>()
      appointments?.forEach((apt) => {
        const date = format(new Date(apt.scheduled_at), 'MMM d')
        const current = appointmentsByDay.get(date) || 0
        appointmentsByDay.set(date, current + 1)
      })

      setAnalytics({
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        totalRevenue,
        revenueByDay: Array.from(revenueByDay.entries()).map(([date, revenue]) => ({
          date,
          revenue: revenue / 100, // Convert from kobo to naira
        })),
        statusData,
        appointmentsByDay: Array.from(appointmentsByDay.entries()).map(([date, count]) => ({
          date,
          count,
        })),
        completionRate: totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0,
        cancellationRate: totalAppointments > 0 ? Math.round((cancelledAppointments / totalAppointments) * 100) : 0,
        avgRevenue: paidAppointments.length > 0 ? totalRevenue / paidAppointments.length : 0,
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!analytics) return

    const csv = [
      ['Metric', 'Value'].join(','),
      ['Total Appointments', analytics.totalAppointments].join(','),
      ['Completed Appointments', analytics.completedAppointments].join(','),
      ['Cancelled Appointments', analytics.cancelledAppointments].join(','),
      ['Total Revenue', analytics.totalRevenue / 100].join(','),
      ['Completion Rate', `${analytics.completionRate}%`].join(','),
      ['Cancellation Rate', `${analytics.cancellationRate}%`].join(','),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `doctor-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <Card className="p-12 text-center">
          <p className="text-gray-600">No analytics data available</p>
        </Card>
      </div>
    )
  }

  const COLORS = ['#10b981', '#ef4444', '#6366f1']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Revenue</h1>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-gray-600">Total Appointments</p>
          <p className="text-2xl font-bold mt-2">{analytics.totalAppointments}</p>
          <p className="text-sm text-gray-500 mt-1">
            {analytics.completedAppointments} completed
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold mt-2">₦{Math.round(analytics.totalRevenue / 100).toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">
            Avg: ₦{Math.round(analytics.avgRevenue / 100).toLocaleString()}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600">Completion Rate</p>
          <p className="text-2xl font-bold mt-2">{analytics.completionRate}%</p>
          <p className="text-sm text-gray-500 mt-1">
            Cancellation: {analytics.cancellationRate}%
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600">Avg Revenue/Visit</p>
          <p className="text-2xl font-bold mt-2">₦{Math.round(analytics.avgRevenue / 100).toLocaleString()}</p>
        </Card>
      </div>

      {/* Revenue Chart */}
      {analytics.revenueByDay.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#059669"
                name="Revenue (NGN)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Appointments Chart */}
      {analytics.appointmentsByDay.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Appointments Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.appointmentsByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#6366f1" name="Appointments" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Appointment Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.statusData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Completion Rate</span>
              <span className="font-semibold">{analytics.completionRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cancellation Rate</span>
              <span className="font-semibold">{analytics.cancellationRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Completed</span>
              <span className="font-semibold">{analytics.completedAppointments}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Cancelled</span>
              <span className="font-semibold">{analytics.cancelledAppointments}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold">₦{Math.round(analytics.totalRevenue / 100).toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
