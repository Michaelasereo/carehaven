'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Bell } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { AppointmentCard } from './appointment-card'

interface PatientDashboardClientProps {
  patientId: string
  profile: { full_name: string | null }
  initialAppointments: any[]
  unreadNotifications: number
}

export function PatientDashboardClient({
  patientId,
  profile,
  initialAppointments,
  unreadNotifications,
}: PatientDashboardClientProps) {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<any[]>(initialAppointments)
  const [recentNotifications, setRecentNotifications] = useState<any[]>([])

  useEffect(() => {
    // Fetch upcoming appointments
    const fetchUpcomingAppointments = async () => {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, profiles!appointments_doctor_id_fkey(*)')
        .eq('patient_id', patientId)
        .in('payment_status', ['paid', 'waived'])
        .order('scheduled_at', { ascending: true })
        .limit(3)

      if (appointments) {
        setAppointments(appointments)
      }
    }

    // Fetch recent notifications
    const fetchRecentNotifications = async () => {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', patientId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) {
        console.error('[Dashboard] Notifications fetch error:', error)
      }
      if (notifications) {
        setRecentNotifications(notifications)
      }
    }

    fetchUpcomingAppointments()
    fetchRecentNotifications()

    // Subscribe to real-time updates
    const appointmentsChannel = supabase
      .channel('patient-dashboard-appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `patient_id=eq.${patientId}`,
        },
        () => {
          fetchUpcomingAppointments()
        }
      )
      .subscribe()

    const notificationsChannel = supabase
      .channel('patient-dashboard-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${patientId}`,
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
  }, [patientId, supabase])

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 md:h-5 md:w-5" />
              Upcoming Appointments
            </h3>
            <Link href="/patient/appointments">
              <Button variant="outline" size="sm" className="text-xs md:text-sm px-3 md:px-4 min-h-[44px] md:min-h-0">View All</Button>
            </Link>
          </div>
          <div className="space-y-2 md:space-y-3">
            {appointments && appointments.length > 0 ? (
              appointments.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} showActions={false} />
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No upcoming appointments</p>
            )}
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold flex items-center gap-2 flex-wrap">
              <Bell className="h-4 w-4 md:h-5 md:w-5" />
              Recent Notifications
              {unreadNotifications > 0 && (
                <Badge variant="default" className="text-xs">{unreadNotifications}</Badge>
              )}
            </h3>
            <Link href="/patient/notifications">
              <Button variant="outline" size="sm" className="text-xs md:text-sm px-3 md:px-4 min-h-[44px] md:min-h-0">View All</Button>
            </Link>
          </div>
          <div className="space-y-2">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-2.5 md:p-3 rounded-lg ${notif.read ? 'bg-gray-50' : 'bg-blue-50'}`}
                >
                  <p className="text-xs md:text-sm font-medium">{notif.title}</p>
                  {notif.body && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notif.body}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(notif.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs md:text-sm text-gray-500 text-center py-4">No notifications</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
