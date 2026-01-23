'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { AppointmentDetailModal } from './appointment-detail-modal'
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
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
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
        (payload) => {
          // Update the appointment in the list
          setAppointments((prev) => {
            if (!payload.new || typeof payload.new !== 'object' || !('id' in payload.new)) {
              return prev
            }
            const newAppointment = payload.new as any
            const index = prev.findIndex((apt) => apt.id === newAppointment.id)
            if (index >= 0) {
              const updated = [...prev]
              updated[index] = newAppointment as Appointment
              return updated
            }
            return prev
          })
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
    <>
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
                          appointment.payment_status === 'paid'
                            ? 'default'
                            : appointment.payment_status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {appointment.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {appointment.amount
                        ? `₦${Math.round(Number(appointment.amount) / 100).toLocaleString()}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAppointmentId(appointment.id)}
                      >
                        View Details
                      </Button>
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

      <AppointmentDetailModal
        appointmentId={selectedAppointmentId}
        isOpen={!!selectedAppointmentId}
        onClose={() => setSelectedAppointmentId(null)}
      />
    </>
  )
}
