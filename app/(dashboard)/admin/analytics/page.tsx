'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
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
import { format } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}&metric=all`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
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

  const revenueChartData = analytics.revenue?.byDay?.map((item: any) => ({
    date: format(new Date(item.date), 'MMM d'),
    revenue: item.revenue / 100, // Convert from kobo to naira
  })) || []

  const appointmentStatusData = [
    { name: 'Completed', value: analytics.appointments?.completed || 0 },
    { name: 'Cancelled', value: analytics.appointments?.cancelled || 0 },
    { name: 'Scheduled', value: (analytics.appointments?.current || 0) - (analytics.appointments?.completed || 0) - (analytics.appointments?.cancelled || 0) },
  ]

  const COLORS = ['#10b981', '#ef4444', '#6366f1']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-2xl font-bold mt-2">{analytics.users?.total || 0}</p>
          <p className="text-sm text-gray-500 mt-1">
            {analytics.users?.growthRate >= 0 ? '+' : ''}{analytics.users?.growthRate || 0}% vs previous period
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600">Active Users (7d)</p>
          <p className="text-2xl font-bold mt-2">{analytics.users?.active7d || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Active Users (30d): {analytics.users?.active30d || 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold mt-2">₦{Math.round((analytics.revenue?.current || 0) / 100).toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">
            {analytics.revenue?.growthRate >= 0 ? '+' : ''}{analytics.revenue?.growthRate || 0}% vs previous period
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600">Appointments</p>
          <p className="text-2xl font-bold mt-2">{analytics.appointments?.current || 0}</p>
          <p className="text-sm text-gray-500 mt-1">
            {analytics.appointments?.completionRate || 0}% completion rate
          </p>
        </Card>
      </div>

      {/* Revenue Chart */}
      {revenueChartData.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueChartData}>
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

      {/* Appointment Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Appointment Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={appointmentStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {appointmentStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Appointment Metrics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Completion Rate</span>
              <span className="font-semibold">{analytics.appointments?.completionRate || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cancellation Rate</span>
              <span className="font-semibold">{analytics.appointments?.cancellationRate || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Completed</span>
              <span className="font-semibold">{analytics.appointments?.completed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Cancelled</span>
              <span className="font-semibold">{analytics.appointments?.cancelled || 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
