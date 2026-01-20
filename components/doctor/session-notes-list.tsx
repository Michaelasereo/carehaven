'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, Clock, User } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface SessionNotesListProps {
  initialAppointments: any[]
  doctorId: string
}

export function SessionNotesList({ 
  initialAppointments,
  doctorId 
}: SessionNotesListProps) {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<any[]>(initialAppointments)
  const [isLoading, setIsLoading] = useState(false)

  const fetchPendingNotes = async () => {
    setIsLoading(true)
    try {
      // Fetch completed appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:profiles!appointments_patient_id_fkey(full_name, email)
        `)
        .eq('doctor_id', doctorId)
        .eq('status', 'completed')
        .order('scheduled_at', { ascending: false })
        .limit(100)

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError)
        setIsLoading(false)
        return
      }

      // Fetch consultation notes for these appointments
      const appointmentIds = appointmentsData?.map(apt => apt.id) || []
      
      if (appointmentIds.length === 0) {
        setAppointments([])
        setIsLoading(false)
        return
      }

      const { data: notes } = await supabase
        .from('consultation_notes')
        .select('appointment_id')
        .in('appointment_id', appointmentIds)

      const appointmentIdsWithNotes = new Set(notes?.map(note => note.appointment_id) || [])
      
      // Filter out appointments that already have notes
      const appointmentsWithoutNotes = appointmentsData?.filter(
        apt => !appointmentIdsWithNotes.has(apt.id)
      ) || []

      setAppointments(appointmentsWithoutNotes)
    } catch (error) {
      console.error('Error fetching pending notes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Set initial appointments
    setAppointments(initialAppointments)

    // Subscribe to real-time updates for appointments
    const appointmentsChannel = supabase
      .channel('session-notes-appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${doctorId}`,
        },
        (payload) => {
          // Only refresh if status changed to 'completed' or if a completed appointment was modified
          const newStatus = (payload.new as any)?.status
          const oldStatus = (payload.old as any)?.status
          
          if (newStatus === 'completed' || oldStatus === 'completed') {
            // Debounce to avoid too many refreshes
            setTimeout(() => {
              fetchPendingNotes()
            }, 500)
          }
        }
      )
      .subscribe()

    // Subscribe to real-time updates for consultation_notes
    const notesChannel = supabase
      .channel('session-notes-consultation-notes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultation_notes',
        },
        () => {
          // When a note is added, refresh the list
          setTimeout(() => {
            fetchPendingNotes()
          }, 500)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(appointmentsChannel)
      supabase.removeChannel(notesChannel)
    }
  }, [doctorId, supabase, initialAppointments])

  if (isLoading && appointments.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-600">Loading pending session notes...</p>
      </Card>
    )
  }

  if (appointments.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-semibold text-gray-900 mb-2">All caught up!</p>
        <p className="text-gray-600">
          You have no pending session notes. All completed consultations have been documented.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {appointments.length} {appointments.length === 1 ? 'session' : 'sessions'} pending
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {appointments.map((appointment) => {
          const scheduledAt = new Date(appointment.scheduled_at)
          const patient = appointment.patient || appointment.profiles

          return (
            <Card key={appointment.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {patient?.full_name || 'Patient'}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(scheduledAt, 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{format(scheduledAt, 'h:mm a')}</span>
                    </div>
                  </div>

                  {appointment.chief_complaint && (
                    <p className="text-sm text-gray-600 mt-3">
                      <span className="font-medium">Chief Complaint:</span>{' '}
                      {appointment.chief_complaint}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Link href={`/doctor/appointments/${appointment.id}`}>
                    <Button className="bg-teal-600 hover:bg-teal-700">
                      <FileText className="h-4 w-4 mr-2" />
                      Add Notes
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
