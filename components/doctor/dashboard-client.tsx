'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Bell, Pill, TestTube, Video } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface DoctorDashboardClientProps {
  doctorId: string
  unreadNotifications: number
}

export function DoctorDashboardClient({ 
  doctorId,
  unreadNotifications 
}: DoctorDashboardClientProps) {
  const supabase = createClient()
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
  const [pendingPrescriptions, setPendingPrescriptions] = useState<any[]>([])
  const [pendingInvestigations, setPendingInvestigations] = useState<any[]>([])
  const [recentNotifications, setRecentNotifications] = useState<any[]>([])

  useEffect(() => {
    // Fetch upcoming appointments
    const fetchUpcomingAppointments = async () => {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, profiles!appointments_patient_id_fkey(full_name)')
        .eq('doctor_id', doctorId)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(3)

      if (appointments) {
        setUpcomingAppointments(appointments)
      }
    }

    // Fetch pending prescriptions
    const fetchPendingPrescriptions = async () => {
      const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select('*, profiles!prescriptions_patient_id_fkey(full_name)')
        .eq('doctor_id', doctorId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5)

      if (prescriptions) {
        setPendingPrescriptions(prescriptions)
      }
    }

    // Fetch pending investigations
    const fetchPendingInvestigations = async () => {
      const { data: investigations } = await supabase
        .from('investigations')
        .select('*, profiles!investigations_patient_id_fkey(full_name)')
        .eq('doctor_id', doctorId)
        .in('status', ['requested', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(5)

      if (investigations) {
        setPendingInvestigations(investigations)
      }
    }

    // Fetch recent notifications
    const fetchRecentNotifications = async () => {
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', doctorId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (notifications) {
        setRecentNotifications(notifications)
      }
    }

    fetchUpcomingAppointments()
    fetchPendingPrescriptions()
    fetchPendingInvestigations()
    fetchRecentNotifications()

    // Subscribe to real-time updates
    const appointmentsChannel = supabase
      .channel('doctor-dashboard-appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${doctorId}`,
        },
        () => {
          fetchUpcomingAppointments()
        }
      )
      .subscribe()

    const notificationsChannel = supabase
      .channel('doctor-dashboard-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${doctorId}`,
        },
        () => {
          fetchRecentNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(appointmentsChannel)
      supabase.removeChannel(notificationsChannel)
    }
  }, [doctorId, supabase])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Upcoming Appointments */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Appointments
          </h3>
          <Link href="/doctor/appointments">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        <div className="space-y-3">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((apt) => {
              const scheduledAt = new Date(apt.scheduled_at)
              const canJoin = apt.status === 'confirmed' || apt.status === 'in_progress'
              
              return (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{apt.profiles?.full_name || 'Patient'}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{format(scheduledAt, 'MMM d, h:mm a')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                      {apt.status}
                    </Badge>
                    {canJoin && (
                      <Link href={`/doctor/appointments/${apt.id}`}>
                        <Button variant="outline" size="sm">
                          <Video className="h-4 w-4 mr-1" />
                          Join
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No upcoming appointments</p>
          )}
        </div>
      </Card>

      {/* Recent Notifications */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notifications
            {unreadNotifications > 0 && (
              <Badge variant="default">{unreadNotifications}</Badge>
            )}
          </h3>
          <Link href="/doctor/notifications">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        <div className="space-y-2">
          {recentNotifications.length > 0 ? (
            recentNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-lg ${notif.read ? 'bg-gray-50' : 'bg-blue-50'}`}
              >
                <p className="text-sm font-medium">{notif.title}</p>
                {notif.body && (
                  <p className="text-xs text-gray-600 mt-1">{notif.body}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(notif.created_at), 'MMM d, h:mm a')}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No notifications</p>
          )}
        </div>
      </Card>

      {/* Pending Prescriptions */}
      {pendingPrescriptions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Pending Prescriptions
            </h3>
            <Link href="/doctor/sessions">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          <div className="space-y-2">
            {pendingPrescriptions.map((presc) => (
              <div
                key={presc.id}
                className="p-3 bg-gray-50 rounded-lg"
              >
                <p className="text-sm font-medium">{presc.profiles?.full_name || 'Patient'}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {format(new Date(presc.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pending Investigations */}
      {pendingInvestigations.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Pending Investigations
            </h3>
            <Link href="/doctor/sessions">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          <div className="space-y-2">
            {pendingInvestigations.map((invest) => (
              <div
                key={invest.id}
                className="p-3 bg-gray-50 rounded-lg"
              >
                <p className="text-sm font-medium">{invest.test_name}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {invest.profiles?.full_name || 'Patient'} • {invest.status}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
