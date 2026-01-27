'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Appointment {
  id: string
  scheduled_at: string
  status: string
  payment_status: string
  amount: number | null
  chief_complaint: string | null
  duration_minutes: number | null
  patient?: { full_name: string | null; email: string | null }
  doctor?: { full_name: string | null; email: string | null; specialty: string | null }
}

interface AppointmentListClientProps {
  appointments: Appointment[]
  currentPage: number
  totalPages: number
  searchParams: Record<string, string | undefined>
}

export function AppointmentListClient({
  appointments: initialAppointments,
  currentPage,
  totalPages,
  searchParams,
}: AppointmentListClientProps) {
  const router = useRouter()
  const [appointments, setAppointments] = useState(initialAppointments)
  const supabase = createClient()

  useEffect(() => {
    setAppointments(initialAppointments)
  }, [initialAppointments])

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-appointments-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        async (payload) => {
          // Handle INSERT events - fetch full appointment with joins
          if (payload.eventType === 'INSERT') {
            const newAppointment = payload.new as any
            // Only add if it matches current filters (paid/waived)
            if (['paid', 'waived'].includes(newAppointment.payment_status)) {
              const { data: fullAppointment } = await supabase
                .from('appointments')
                .select('*, patient:profiles!appointments_patient_id_fkey(full_name, email), doctor:profiles!appointments_doctor_id_fkey(full_name, email, specialty)')
                .eq('id', newAppointment.id)
                .single()
              
              if (fullAppointment) {
                setAppointments((prev) => {
                  // Check if already exists (avoid duplicates)
                  if (prev.find((apt) => apt.id === fullAppointment.id)) {
                    return prev
                  }
                  // Add to beginning of list (newest first)
                  return [fullAppointment as Appointment, ...prev]
                })
              }
            }
            return
          }

          // Handle UPDATE events - update existing appointment
          if (payload.eventType === 'UPDATE') {
            setAppointments((prev) => {
              if (!payload.new || typeof payload.new !== 'object' || !('id' in payload.new)) {
                return prev
              }
              const updatedAppointment = payload.new as any
              const index = prev.findIndex((apt) => apt.id === updatedAppointment.id)
              if (index >= 0) {
                const updated = [...prev]
                // Merge with existing to preserve patient/doctor data
                updated[index] = { ...updated[index], ...updatedAppointment } as Appointment
                return updated
              }
              return prev
            })
            return
          }

          // Handle DELETE events - remove from list
          if (payload.eventType === 'DELETE') {
            setAppointments((prev) => {
              if (!payload.old || typeof payload.old !== 'object' || !('id' in payload.old)) {
                return prev
              }
              return prev.filter((apt) => apt.id !== (payload.old as any).id)
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(window.location.search)
    newParams.set('page', newPage.toString())
    router.push(`/admin/appointments?${newParams.toString()}`)
  }

  if (appointments.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-600">No appointments found</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => {
                const scheduledAt = new Date(appointment.scheduled_at)
                const endTime = new Date(
                  scheduledAt.getTime() + (appointment.duration_minutes || 45) * 60000
                )

                return (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{format(scheduledAt, 'MMM d, yyyy')}</p>
                          <p className="text-sm text-gray-500">
                            {format(scheduledAt, 'h:mm a')} - {format(endTime, 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{appointment.patient?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{appointment.patient?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{appointment.doctor?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{appointment.doctor?.specialty}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
                        {appointment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          appointment.payment_status === 'paid' || appointment.payment_status === 'waived'
                            ? 'default'
                            : appointment.payment_status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {appointment.payment_status === 'waived' ? 'Waived' : appointment.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {appointment.amount
                        ? `₦${Math.round(Number(appointment.amount) / 100).toLocaleString()}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/appointments/${appointment.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
    </div>
  )
}
