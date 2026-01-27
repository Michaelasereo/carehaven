'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AppointmentCard } from './appointment-card'

interface AppointmentsListClientProps {
  patientId: string
  initialAppointments: any[]
}

export function AppointmentsListClient({
  patientId,
  initialAppointments,
}: AppointmentsListClientProps) {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<any[]>(initialAppointments)

  useEffect(() => {
    // Fetch appointments
    const fetchAppointments = async () => {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, profiles!appointments_doctor_id_fkey(*)')
        .eq('patient_id', patientId)
        .in('payment_status', ['paid', 'waived'])
        .order('scheduled_at', { ascending: false })

      if (appointments) {
        setAppointments(appointments)
      }
    }

    fetchAppointments()

    // Subscribe to real-time updates
    const appointmentsChannel = supabase
      .channel('patient-appointments-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `patient_id=eq.${patientId}`,
        },
        () => {
          // Refetch when any change occurs
          fetchAppointments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(appointmentsChannel)
    }
  }, [patientId, supabase])

  return (
    <div className="grid gap-4">
      {appointments && appointments.length > 0 ? (
        appointments.map((appointment: any) => (
          <AppointmentCard key={appointment.id} appointment={appointment} />
        ))
      ) : (
        <p className="text-gray-500 text-center py-8">No appointments found</p>
      )}
    </div>
  )
}
