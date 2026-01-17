'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, UserCheck, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface AdminDashboardClientProps {
  pendingVerifications: number
  profileToAppointmentRate: number
}

export function AdminDashboardClient({ 
  pendingVerifications,
  profileToAppointmentRate 
}: AdminDashboardClientProps) {
  const supabase = createClient()
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [systemAlerts, setSystemAlerts] = useState<any[]>([])

  useEffect(() => {
    // Fetch recent appointments
    const fetchRecentActivity = async () => {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, profiles!appointments_patient_id_fkey(full_name), doctor:profiles!appointments_doctor_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(10)

      if (appointments) {
        setRecentActivity(appointments.map(apt => ({
          id: apt.id,
          type: 'appointment',
          description: `${apt.profiles?.full_name || 'Patient'} booked with ${apt.doctor?.full_name || 'Doctor'}`,
          timestamp: apt.created_at,
          status: apt.status,
        })))
      }
    }

    // Check for system alerts
    const fetchSystemAlerts = async () => {
      const alerts: any[] = []

      // Check cancellation rate
      const { count: totalAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const { count: cancelledAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (totalAppointments && totalAppointments > 0) {
        const cancellationRate = (cancelledAppointments || 0) / totalAppointments * 100
        if (cancellationRate > 20) {
          alerts.push({
            type: 'warning',
            message: `High cancellation rate: ${Math.round(cancellationRate)}% in last 24h`,
            icon: AlertCircle,
          })
        }
      }

      // Check payment failures
      const { count: failedPayments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', 'failed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (failedPayments && failedPayments > 5) {
        alerts.push({
          type: 'error',
          message: `${failedPayments} payment failures in last 24h`,
          icon: AlertCircle,
        })
      }

      setSystemAlerts(alerts)
    }

    fetchRecentActivity()
    fetchSystemAlerts()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin-dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        () => {
          fetchRecentActivity()
          fetchSystemAlerts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Doctor Management</h3>
        <div className="space-y-2">
          <Link href="/admin/doctors?filter=pending">
            <Button variant="outline" className="w-full justify-start">
              <UserCheck className="h-4 w-4 mr-2" />
              Verify Doctor Licenses ({pendingVerifications})
            </Button>
          </Link>
          <Link href="/admin/doctors">
            <Button variant="outline" className="w-full justify-start">
              View All Doctors
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Patient Management</h3>
        <div className="space-y-2">
          <Link href="/admin/patients">
            <Button variant="outline" className="w-full justify-start">
              View All Patients
            </Button>
          </Link>
          <Link href="/admin/appointments">
            <Button variant="outline" className="w-full justify-start">
              View All Appointments
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Platform Analytics</h3>
        <div className="space-y-2">
          <Link href="/admin/analytics">
            <Button variant="outline" className="w-full justify-start">
              <Activity className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </Link>
          <Link href="/admin/audit-logs">
            <Button variant="outline" className="w-full justify-start">
              View Audit Logs
            </Button>
          </Link>
        </div>
      </Card>

      {/* Recent Activity Feed */}
      <Card className="p-6 md:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
                <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                  {activity.status}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </Card>

      {/* System Alerts */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Alerts</h3>
        <div className="space-y-2">
          {systemAlerts.length > 0 ? (
            systemAlerts.map((alert, index) => {
              const Icon = alert.icon
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg flex items-center gap-2 ${
                    alert.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <p className="text-sm font-medium">{alert.message}</p>
                </div>
              )
            })
          ) : (
            <div className="p-3 rounded-lg bg-green-50 text-green-800">
              <p className="text-sm font-medium">All systems operational</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
