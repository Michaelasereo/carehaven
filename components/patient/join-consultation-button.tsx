'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Video } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isWithinJoinWindow } from '@/lib/utils/timezone'
import { useToast } from '@/components/ui/toast'

interface JoinConsultationButtonProps {
  appointmentId: string
}

export function JoinConsultationButton({ appointmentId }: JoinConsultationButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [canJoin, setCanJoin] = useState(false)
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)
  const [appointmentStatus, setAppointmentStatus] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)

  // Check if within join window (15 minutes before appointment)
  useEffect(() => {
    if (!scheduledAt) return

    const checkJoinWindow = () => {
      setCanJoin(isWithinJoinWindow(scheduledAt))
    }

    checkJoinWindow()
    const interval = setInterval(checkJoinWindow, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [scheduledAt])

  // Fetch appointment scheduled time, status, and payment status
  useEffect(() => {
    const fetchAppointment = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('scheduled_at, status, payment_status')
        .eq('id', appointmentId)
        .single()

      if (data?.scheduled_at) {
        setScheduledAt(data.scheduled_at)
      }
      if (data?.status) {
        setAppointmentStatus(data.status)
      }
      if (data?.payment_status) {
        setPaymentStatus(data.payment_status)
      }
    }

    fetchAppointment()

    // Subscribe to real-time appointment status changes
    const channel = supabase
      .channel(`appointment-${appointmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `id=eq.${appointmentId}`,
        },
        (payload) => {
          if (payload.new.status) {
            setAppointmentStatus(payload.new.status as string)
          }
          if (payload.new.payment_status) {
            setPaymentStatus(payload.new.payment_status as string)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [appointmentId, supabase])

  const handleJoin = async () => {
    setIsLoading(true)
    try {
      // Get appointment details
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select('daily_room_name, daily_room_url, status, payment_status')
        .eq('id', appointmentId)
        .single()

      if (error) throw error

      // Check if payment is pending
      if (appointment.payment_status === 'pending' && appointment.status === 'scheduled') {
        addToast({
          variant: 'destructive',
          title: 'Payment Pending',
          description: 'This appointment cannot be joined until payment is confirmed. Please complete your payment first.',
        })
        setIsLoading(false)
        return
      }

      // Verify appointment is confirmed or in progress
      if (appointment.status !== 'confirmed' && appointment.status !== 'in_progress') {
        addToast({
          variant: 'destructive',
          title: 'Cannot Join',
          description: `This appointment is ${appointment.status}. Only confirmed or in-progress appointments can be joined.`,
        })
        setIsLoading(false)
        return
      }

      // Create room if it doesn't exist
      if (!appointment.daily_room_name) {
        const response = await fetch('/api/daily/create-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointmentId }),
        })

        if (!response.ok) {
          let errorMessage = 'Failed to create consultation room'
          let errorDetails = ''
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
            errorDetails = errorData.details || ''
          } catch {
            // Use default message if parsing fails
          }
          
          // Provide user-friendly error message
          const userMessage = errorDetails 
            ? `${errorMessage}. ${errorDetails}`
            : `${errorMessage}. Please try again or contact support if the issue persists.`
          
          throw new Error(userMessage)
        }

        const { room } = await response.json()

        // Update appointment status to in_progress
        await supabase
          .from('appointments')
          .update({
            status: 'in_progress',
            daily_room_name: room.name,
            daily_room_url: room.url,
          })
          .eq('id', appointmentId)

        // Get token and redirect
        const tokenResponse = await fetch('/api/daily/get-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: room.name, appointmentId }),
        })

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to generate access token. Please try again.')
        }

        const { token } = await tokenResponse.json()
        
        if (!token) {
          throw new Error('Access token not received. Please try again.')
        }
        
        router.push(`/consultation/${appointmentId}?token=${token}&roomUrl=${encodeURIComponent(room.url)}`)
      } else {
        // Room exists, get token and join
        const tokenResponse = await fetch('/api/daily/get-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: appointment.daily_room_name, appointmentId }),
        })

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to generate access token. Please try again.')
        }

        const { token } = await tokenResponse.json()

        if (!token) {
          throw new Error('Access token not received. Please try again.')
        }

        // Update status if still confirmed
        if (appointment.status === 'confirmed') {
          await supabase
            .from('appointments')
            .update({ status: 'in_progress' })
            .eq('id', appointmentId)
        }

        router.push(
          `/consultation/${appointmentId}?token=${token}&roomUrl=${encodeURIComponent(appointment.daily_room_url || '')}`
        )
      }
    } catch (error: any) {
      console.error('Error joining consultation:', error)
      const errorMessage = error?.message || 'Failed to join consultation. Please try again.'
      addToast({
        variant: 'destructive',
        title: 'Failed to Join',
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show button if within join window, appointment is confirmed/in_progress, or no scheduled time yet
  const showButton = canJoin || appointmentStatus === 'confirmed' || appointmentStatus === 'in_progress' || !scheduledAt

  // Allow joining if status is in_progress or within join window
  const allowJoin = appointmentStatus === 'in_progress' || canJoin || appointmentStatus === 'confirmed'

  if (!showButton && scheduledAt) {
    return null
  }

  return (
    <Button
      onClick={handleJoin}
      className="bg-teal-600 hover:bg-teal-700"
      disabled={isLoading || (!allowJoin && !!scheduledAt)}
    >
      <Video className="h-4 w-4 mr-2" />
      {isLoading ? 'Joining...' : appointmentStatus === 'in_progress' ? 'Rejoin Consultation' : 'Join Consultation'}
    </Button>
  )
}
