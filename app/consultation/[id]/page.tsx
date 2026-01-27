'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { CallInterface } from '@/components/video/call-interface'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ConsultationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const initializeConsultation = async () => {
      try {
        // Get user role first
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          if (profile) {
            setUserRole(profile.role)
          }
        }

        const url = searchParams.get('roomUrl')
        const tokenParam = searchParams.get('token')

        if (url && tokenParam) {
          // Validate token and room URL before proceeding
          setRoomUrl(decodeURIComponent(url))
          setToken(tokenParam)
          setIsLoading(false)
        } else {
          // Try to fetch from appointment
          const { data: appointment, error: appointmentError } = await supabase
            .from('appointments')
            .select('daily_room_name, daily_room_url, status, payment_status, patient_id, doctor_id')
            .eq('id', id)
            .single()

          if (appointmentError || !appointment) {
            setErrorMessage('Appointment not found')
            setIsLoading(false)
            return
          }

          // Check appointment status
          if (appointment.status !== 'confirmed' && appointment.status !== 'in_progress') {
            setErrorMessage(`This appointment is ${appointment.status}. Only confirmed or in-progress appointments can be joined.`)
            setIsLoading(false)
            return
          }

          // Verify user has access to this appointment
          if (user) {
            const isPatient = appointment.patient_id === user.id
            const isDoctor = appointment.doctor_id === user.id
            if (!isPatient && !isDoctor) {
              setErrorMessage('You do not have access to this appointment.')
              setIsLoading(false)
              return
            }
          }

          // Get room details if available
          if (appointment.daily_room_name) {
            const tokenResponse = await fetch('/api/daily/get-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ roomName: appointment.daily_room_name, appointmentId: id }),
            })

            if (tokenResponse.ok) {
              const { token: newToken } = await tokenResponse.json()
              if (newToken) {
                setRoomUrl(appointment.daily_room_url || '')
                setToken(newToken)
              } else {
                setErrorMessage('Failed to generate access token. Please try again.')
              }
            } else {
              const errorData = await tokenResponse.json().catch(() => ({}))
              setErrorMessage(errorData.error || 'Failed to generate access token. Please try again.')
            }
          } else {
            setErrorMessage('Consultation room has not been created yet. Please try joining from the appointment details page.')
          }
        }
      } catch (error: any) {
        console.error('Error initializing consultation:', error)
        setErrorMessage(error.message || 'An unexpected error occurred. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    initializeConsultation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLeave = useCallback(async () => {
    // Get user role to determine redirect and call end behavior
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // Only mark appointment as completed when DOCTOR leaves the call
      // Patient leaving should keep the call available for rejoin
      if (profile?.role === 'doctor') {
        const { data: appointment } = await supabase
          .from('appointments')
          .select('status')
          .eq('id', id)
          .single()

        if (appointment?.status === 'in_progress') {
          await supabase
            .from('appointments')
            .update({ status: 'completed' })
            .eq('id', id)
        }
      }
      // If patient leaves, appointment stays in_progress - no status change needed

      // Redirect based on role
      if (profile?.role === 'doctor') {
        router.push(`/doctor/appointments/${id}`)
      } else {
        router.push('/patient/appointments')
      }
    } else {
      router.push('/auth/signin')
    }
  }, [id, router, supabase])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading consultation room...</p>
      </div>
    )
  }

  if (!roomUrl || !token || errorMessage) {
    const redirectPath = userRole === 'doctor' 
      ? `/doctor/appointments/${id}`
      : '/patient/appointments'
    
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 px-4">
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            {errorMessage || 'Consultation room not available'}
          </p>
          {!errorMessage && (
            <p className="text-sm text-gray-600">
              The consultation room could not be loaded. This may happen if the room hasn't been created yet or there was an error connecting to the video service.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(redirectPath)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {userRole === 'doctor' ? 'Back to Appointment' : 'Back to Appointments'}
          </Button>
          {userRole === 'doctor' && (
            <Button variant="outline" onClick={() => router.push('/doctor/appointments')}>
              View All Appointments
            </Button>
          )}
        </div>
      </div>
    )
  }

  return <CallInterface roomUrl={roomUrl} token={token} onLeave={handleLeave} />
}
