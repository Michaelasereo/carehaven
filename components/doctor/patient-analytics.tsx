'use client'

import { Card } from '@/components/ui/card'
import { format, subDays } from 'date-fns'
import { TrendingUp, Calendar, DollarSign, Clock } from 'lucide-react'

interface PatientAnalyticsProps {
  patientId: string
  doctorId: string
  appointments: any[]
  totalSpent: number
}

export function PatientAnalytics({ patientId, doctorId, appointments, totalSpent }: PatientAnalyticsProps) {
  // Calculate engagement metrics
  const totalAppointments = appointments.length
  const completedAppointments = appointments.filter(apt => apt.status === 'completed').length
  const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled').length
  
  // Calculate visit frequency
  const appointmentsLast30d = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduled_at)
    return aptDate >= subDays(new Date(), 30)
  }).length

  const appointmentsLast90d = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduled_at)
    return aptDate >= subDays(new Date(), 90)
  }).length

  // Calculate average time between appointments
  let avgDaysBetween = 0
  if (appointments.length > 1) {
    const sortedAppts = [...appointments].sort((a, b) => 
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    )
    const intervals: number[] = []
    for (let i = 1; i < sortedAppts.length; i++) {
      const days = Math.floor(
        (new Date(sortedAppts[i].scheduled_at).getTime() - new Date(sortedAppts[i-1].scheduled_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      intervals.push(days)
    }
    if (intervals.length > 0) {
      avgDaysBetween = Math.round(intervals.reduce((sum, days) => sum + days, 0) / intervals.length)
    }
  }

  // Calculate average consultation value
  const paidAppointments = appointments.filter(apt => apt.payment_status === 'paid')
  const avgConsultationValue = paidAppointments.length > 0
    ? totalSpent / paidAppointments.length
    : 0

  // Calculate adherence rate (completed vs scheduled)
  const adherenceRate = totalAppointments > 0
    ? Math.round((completedAppointments / totalAppointments) * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Engagement Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Engagement Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Visits</p>
            <p className="text-2xl font-bold mt-1">{totalAppointments}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Visits (30d)</p>
            <p className="text-2xl font-bold mt-1">{appointmentsLast30d}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Visits (90d)</p>
            <p className="text-2xl font-bold mt-1">{appointmentsLast90d}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg Days Between</p>
            <p className="text-2xl font-bold mt-1">{avgDaysBetween || 'N/A'}</p>
          </div>
        </div>
      </Card>

      {/* Performance Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Adherence Rate</p>
              <p className="text-2xl font-bold">{adherenceRate}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {completedAppointments} completed / {totalAppointments} total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Consultation Value</p>
              <p className="text-2xl font-bold">₦{Math.round(avgConsultationValue / 100).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Cancellation Rate</p>
              <p className="text-2xl font-bold">
                {totalAppointments > 0 ? Math.round((cancelledAppointments / totalAppointments) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Visit Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Visit Timeline</h3>
        <div className="space-y-2">
          {appointments.length > 0 ? (
            appointments.slice(0, 10).map((apt: any) => (
              <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{format(new Date(apt.scheduled_at), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-gray-500">{format(new Date(apt.scheduled_at), 'h:mm a')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {apt.amount ? `₦${Math.round(Number(apt.amount) / 100).toLocaleString()}` : 'N/A'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No visit history</p>
          )}
        </div>
      </Card>
    </div>
  )
}
