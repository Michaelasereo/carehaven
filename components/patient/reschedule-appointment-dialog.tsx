'use client'

import { useState } from 'react'
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
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('09:00')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    setIsSubmitting(true)

    try {
      // Combine date and time
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}`).toISOString()

      // Validate new date is in the future
      if (new Date(scheduledAt) <= new Date()) {
        alert('Please select a future date and time')
        setIsSubmitting(false)
        return
      }

      await updateAppointment.mutateAsync({
        id: appointment.id,
        scheduled_at: scheduledAt,
        status: 'scheduled', // Reset to scheduled if it was confirmed
      })

      // Create notification via API
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
      } catch (notifError) {
        console.error('Error creating notification:', notifError)
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      alert('Failed to reschedule appointment. Please try again.')
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
