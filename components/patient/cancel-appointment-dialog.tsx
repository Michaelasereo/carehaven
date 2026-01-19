'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

interface CancelAppointmentDialogProps {
  appointment: any
  onClose: () => void
  onSuccess: () => void
}

export function CancelAppointmentDialog({
  appointment,
  onClose,
  onSuccess,
}: CancelAppointmentDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const { addToast } = useToast()

  const handleCancel = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment.id)

      if (error) throw error

      // Create notifications for both patient and doctor
      try {
        // Notify patient
        await fetch('/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: appointment.patient_id,
            type: 'appointment',
            title: 'Appointment Cancelled',
            body: 'Your appointment has been cancelled',
            data: { appointment_id: appointment.id },
          }),
        })
        
        // Notify doctor
        if (appointment.doctor_id) {
          await fetch('/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: appointment.doctor_id,
              type: 'appointment',
              title: 'Appointment Cancelled',
              body: 'A patient has cancelled their appointment',
              data: { appointment_id: appointment.id },
            }),
          })
        }
      } catch (notifError) {
        console.error('Error creating notification:', notifError)
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      addToast({
        variant: 'destructive',
        title: 'Cancellation Failed',
        description: 'Failed to cancel appointment. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Appointment</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Keep Appointment
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {isLoading ? 'Cancelling...' : 'Cancel Appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
