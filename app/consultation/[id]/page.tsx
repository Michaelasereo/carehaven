'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CallInterface } from '@/components/video/call-interface'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ConsultationPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const url = searchParams.get('roomUrl')
    const tokenParam = searchParams.get('token')

    if (url && tokenParam) {
      setRoomUrl(decodeURIComponent(url))
      setToken(tokenParam)
      setIsLoading(false)
    } else {
      // Try to fetch from appointment
      const fetchRoom = async () => {
        const { data: appointment } = await supabase
          .from('appointments')
          .select('daily_room_name, daily_room_url')
          .eq('id', params.id)
          .single()

        if (appointment?.daily_room_name) {
          const tokenResponse = await fetch('/api/daily/get-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomName: appointment.daily_room_name, appointmentId: params.id }),
          })

          if (tokenResponse.ok) {
            const { token: newToken } = await tokenResponse.json()
            setRoomUrl(appointment.daily_room_url || '')
            setToken(newToken)
          }
        }
        setIsLoading(false)
      }
      fetchRoom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLeave = async () => {
    // Get user role to determine redirect
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // Update appointment status to completed if it was in_progress
      const { data: appointment } = await supabase
        .from('appointments')
        .select('status')
        .eq('id', params.id)
        .single()

      if (appointment?.status === 'in_progress') {
        await supabase
          .from('appointments')
          .update({ status: 'completed' })
          .eq('id', params.id)
      }

      // Redirect based on role
      if (profile?.role === 'doctor') {
        router.push(`/doctor/appointments/${params.id}`)
      } else {
        router.push('/patient/appointments')
      }
    } else {
      router.push('/auth/signin')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading consultation room...</p>
      </div>
    )
  }

  if (!roomUrl || !token) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <p className="text-gray-600">Consultation room not available</p>
        <Button onClick={() => router.push('/patient/appointments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Appointments
        </Button>
      </div>
    )
  }

  return <CallInterface roomUrl={roomUrl} token={token} onLeave={handleLeave} />
}
