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
  const { addToast } = useToast()

  const handleCancel = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appointment.id }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to cancel')
      }

      const refund = !!data?.refund
      addToast({
        variant: 'success',
        title: 'Appointment Cancelled',
        description: refund
          ? "You'll receive a refund for this appointment."
          : 'This appointment was not eligible for a refund.',
      })
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      addToast({
        variant: 'destructive',
        title: 'Cancellation Failed',
        description:
          error instanceof Error ? error.message : 'Failed to cancel appointment. Please try again.',
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
          <DialogDescription className="space-y-2">
            <span className="block">
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </span>
            <span className="block text-sm text-gray-600">
              If you cancel at least 12 hours before your session, you&apos;ll receive a refund.
              Otherwise the payment is not refunded.
            </span>
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
