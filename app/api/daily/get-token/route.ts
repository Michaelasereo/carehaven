import { createClient } from '@/lib/supabase/server'
import { generateToken } from '@/lib/daily/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomName, appointmentId } = await request.json()

    if (!roomName) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 })
    }

    // If appointmentId is provided, verify user has access to this appointment
    if (appointmentId) {
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('patient_id, doctor_id')
        .eq('id', appointmentId)
        .single()

      if (appointmentError || !appointment) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }

      // Verify user is either the patient or doctor for this appointment
      if (appointment.patient_id !== user.id && appointment.doctor_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized: You do not have access to this appointment' }, { status: 403 })
      }
    }

    const token = await generateToken(roomName, user.id)

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error generating token:', error)
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}

