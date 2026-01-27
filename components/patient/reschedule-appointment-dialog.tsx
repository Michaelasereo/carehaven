'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUpdateAppointment } from '@/lib/react-query/mutations'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { isTimeAvailable, type AvailabilitySlot } from '@/lib/utils/availability'

const rescheduleSchema = z.object({
  scheduled_at: z.string().min(1, 'Please select a new date and time'),
})

type RescheduleFormData = z.infer<typeof rescheduleSchema>

interface RescheduleAppointmentDialogProps {
  appointment: any
  onClose: () => void
  onSuccess?: () => void
}

export function RescheduleAppointmentDialog({
  appointment,
  onClose,
  onSuccess,
}: RescheduleAppointmentDialogProps) {
  const updateAppointment = useUpdateAppointment()
  const supabase = createClient()
  const { addToast } = useToast()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('09:00')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [existingAppointments, setExistingAppointments] = useState<Array<{ scheduled_at: string; duration_minutes: number }>>([])
  const [slotValidationError, setSlotValidationError] = useState<string | null>(null)

  const durationMinutes = appointment.duration_minutes ?? 45
  const doctorId = appointment.doctor_id

  useEffect(() => {
    if (!selectedDate || !doctorId) {
      setAvailabilitySlots([])
      setExistingAppointments([])
      return
    }
    const fetchAvailability = async () => {
      setSlotValidationError(null)
      try {
        const [availRes, slotsRes] = await Promise.all([
          supabase
            .from('doctor_availability')
            .select('day_of_week, start_time, end_time, active')
            .eq('doctor_id', doctorId)
            .eq('active', true),
          fetch(
            `/api/availability/doctor/${doctorId}?date=${selectedDate}&exclude=${encodeURIComponent(appointment.id)}`
          ).then((r) => r.json()),
        ])
        const slots: AvailabilitySlot[] = (availRes.data ?? []).map((s) => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          active: s.active,
        }))
        setAvailabilitySlots(slots)
        setExistingAppointments(Array.isArray(slotsRes?.slots) ? slotsRes.slots : [])
      } catch (e) {
        console.error('Reschedule availability fetch:', e)
        setAvailabilitySlots([])
        setExistingAppointments([])
      }
    }
    fetchAvailability()
  }, [selectedDate, doctorId, appointment.id, supabase])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RescheduleFormData>({
    resolver: zodResolver(rescheduleSchema),
  })

  const originalDate = new Date(appointment.scheduled_at)

  const onSubmit = async (data: RescheduleFormData) => {
    if (!selectedDate || !selectedTime) {
      return
    }

    setSlotValidationError(null)
    setIsSubmitting(true)

    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}`).toISOString()

      if (new Date(scheduledAt) <= new Date()) {
        addToast({
          variant: 'destructive',
          title: 'Invalid Date',
          description: 'Please select a future date and time',
        })
        setIsSubmitting(false)
        return
      }

      const scheduledDate = new Date(`${selectedDate}T${selectedTime}`)
      const timeStr = selectedTime.length === 5 ? selectedTime : selectedTime.slice(0, 5)

      if (availabilitySlots.length > 0) {
        if (!isTimeAvailable(scheduledDate, timeStr, availabilitySlots)) {
          setSlotValidationError('The selected time is not in the doctor\'s schedule. Please choose an available slot.')
          setIsSubmitting(false)
          return
        }
      }

      const bufferMinutes = 15
      const newEnd = new Date(scheduledDate.getTime() + (durationMinutes + bufferMinutes) * 60 * 1000)
      const hasConflict = existingAppointments.some((apt) => {
        const aptStart = new Date(apt.scheduled_at)
        const aptEnd = new Date(aptStart.getTime() + ((apt.duration_minutes ?? 45) + bufferMinutes) * 60 * 1000)
        return scheduledDate < aptEnd && newEnd > aptStart
      })
      if (hasConflict) {
        setSlotValidationError('This time slot is already booked or overlaps with another appointment. Please choose another.')
        setIsSubmitting(false)
        return
      }

      await updateAppointment.mutateAsync({
        id: appointment.id,
        scheduled_at: scheduledAt,
        status: 'scheduled', // Reset to scheduled if it was confirmed
      })

      // Notify patient and doctor
      try {
        await fetch('/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: appointment.patient_id,
            type: 'appointment',
            title: 'Appointment Rescheduled',
            body: `Your appointment has been rescheduled to ${new Date(scheduledAt).toLocaleDateString()}`,
            data: { appointment_id: appointment.id },
          }),
        })
        if (appointment.doctor_id) {
          await fetch('/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: appointment.doctor_id,
              type: 'appointment',
              title: 'Appointment Rescheduled',
              body: `An appointment has been rescheduled to ${new Date(scheduledAt).toLocaleDateString()}`,
              data: { appointment_id: appointment.id },
            }),
          })
        }
      } catch (notifError) {
        console.error('Error creating notification:', notifError)
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      addToast({
        variant: 'destructive',
        title: 'Reschedule Failed',
        description: 'Failed to reschedule appointment. Please try again.',
      })
      setSlotValidationError(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Select a new date and time for your appointment.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Current appointment:</p>
          <p className="font-medium">
            {format(originalDate, 'EEEE, MMMM d, yyyy')} at {format(originalDate, 'h:mm a')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="new_date">New Date *</Label>
            <Input
              id="new_date"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value)
                if (selectedTime) {
                  const dateTime = `${e.target.value}T${selectedTime}`
                  setValue('scheduled_at', dateTime)
                }
              }}
              className="mt-1"
            />
            {!selectedDate && (
              <p className="mt-1 text-sm text-red-600">Please select a date</p>
            )}
          </div>

          <div>
            <Label htmlFor="new_time">New Time *</Label>
            <Input
              id="new_time"
              type="time"
              value={selectedTime}
              onChange={(e) => {
                setSelectedTime(e.target.value)
                if (selectedDate) {
                  const dateTime = `${selectedDate}T${e.target.value}`
                  setValue('scheduled_at', dateTime)
                }
              }}
              className="mt-1"
            />
            {!selectedTime && (
              <p className="mt-1 text-sm text-red-600">Please select a time</p>
            )}
          </div>

          {errors.scheduled_at && (
            <p className="text-sm text-red-600">{errors.scheduled_at.message}</p>
          )}
          {slotValidationError && (
            <p className="text-sm text-red-600">{slotValidationError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={isSubmitting || !selectedDate || !selectedTime}
            >
              {isSubmitting ? 'Rescheduling...' : 'Reschedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
