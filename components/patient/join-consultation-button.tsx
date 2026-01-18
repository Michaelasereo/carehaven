'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Video } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isWithinJoinWindow } from '@/lib/utils/timezone'

interface JoinConsultationButtonProps {
  appointmentId: string
}

export function JoinConsultationButton({ appointmentId }: JoinConsultationButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [canJoin, setCanJoin] = useState(false)
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)
  const [appointmentStatus, setAppointmentStatus] = useState<string | null>(null)

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

  // Fetch appointment scheduled time and status
  useEffect(() => {
    const fetchAppointment = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('scheduled_at, status')
        .eq('id', appointmentId)
        .single()

      if (data?.scheduled_at) {
        setScheduledAt(data.scheduled_at)
      }
      if (data?.status) {
        setAppointmentStatus(data.status)
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
        .select('daily_room_name, daily_room_url, status')
        .eq('id', appointmentId)
        .single()

      if (error) throw error

      // Create room if it doesn't exist
      if (!appointment.daily_room_name) {
        const response = await fetch('/api/daily/create-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointmentId }),
        })

        if (!response.ok) throw new Error('Failed to create room')

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
          body: JSON.stringify({ roomName: room.name }),
        })

        const { token } = await tokenResponse.json()
        router.push(`/consultation/${appointmentId}?token=${token}&roomUrl=${encodeURIComponent(room.url)}`)
      } else {
        // Room exists, get token and join
        const tokenResponse = await fetch('/api/daily/get-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: appointment.daily_room_name }),
        })

        if (!tokenResponse.ok) throw new Error('Failed to get token')

        const { token } = await tokenResponse.json()

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
    } catch (error) {
      console.error('Error joining consultation:', error)
      alert('Failed to join consultation. Please try again.')
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
