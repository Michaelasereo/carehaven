import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isTimeAvailable, type AvailabilitySlot } from '@/lib/utils/availability'

/**
 * Server-side appointment creation endpoint with availability validation
 * 
 * This endpoint validates availability server-side before creating appointments
 * to prevent race conditions and ensure data integrity.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const appointmentData = await request.json()
    const {
      patient_id,
      doctor_id,
      scheduled_at,
      duration_minutes = 45,
      chief_complaint,
      symptoms_description,
      amount,
      currency = 'NGN',
    } = appointmentData

    // Validate required fields
    if (!patient_id || !doctor_id || !scheduled_at || !chief_complaint) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify patient_id matches authenticated user
    if (patient_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot create appointment for another user' },
        { status: 403 }
      )
    }

    const scheduledDate = new Date(scheduled_at)

    // Fetch doctor availability
    const { data: availability, error: availabilityError } = await supabase
      .from('doctor_availability')
      .select('day_of_week, start_time, end_time, active')
      .eq('doctor_id', doctor_id)
      .eq('active', true)

    if (availabilityError) {
      console.error('Error fetching availability:', availabilityError)
      return NextResponse.json(
        { error: 'Failed to check availability' },
        { status: 500 }
      )
    }

    // Validate availability server-side
    if (availability && availability.length > 0) {
      const availabilitySlots: AvailabilitySlot[] = availability.map(slot => ({
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        active: slot.active,
      }))

      // Extract time from scheduled_at (ISO string)
      const timeString = scheduledDate.toTimeString().slice(0, 5) // HH:MM format

      if (!isTimeAvailable(scheduledDate, timeString, availabilitySlots)) {
        return NextResponse.json(
          { error: 'Selected time is not available. Please choose another time.' },
          { status: 400 }
        )
      }
    }

    // Check for conflicts with existing appointments
    const scheduledEnd = new Date(scheduledDate.getTime() + duration_minutes * 60000)

    const { data: existingAppointments, error: conflictError } = await supabase
      .from('appointments')
      .select('id, scheduled_at, duration_minutes, status')
      .eq('doctor_id', doctor_id)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .gte('scheduled_at', new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000).toISOString()) // Check last 24 hours
      .lte('scheduled_at', new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000).toISOString()) // Check next 24 hours

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError)
      return NextResponse.json(
        { error: 'Failed to check for conflicts' },
        { status: 500 }
      )
    }

    // Check for time conflicts
    if (existingAppointments && existingAppointments.length > 0) {
      const hasConflict = existingAppointments.some(apt => {
        const aptDate = new Date(apt.scheduled_at)
        const aptDuration = apt.duration_minutes || 45
        const aptEnd = new Date(aptDate.getTime() + aptDuration * 60000)
        
        // Check for overlap: new appointment overlaps if it starts before existing ends, or ends after existing starts
        return scheduledDate < aptEnd && scheduledEnd > aptDate
      })

      if (hasConflict) {
        return NextResponse.json(
          { error: 'This time slot is already booked. Please choose another time.' },
          { status: 409 } // Conflict status code
        )
      }
    }

    // Create appointment
    const { data: appointment, error: createError } = await supabase
      .from('appointments')
      .insert({
        patient_id,
        doctor_id,
        scheduled_at: scheduledDate.toISOString(),
        duration_minutes,
        chief_complaint,
        symptoms_description,
        amount,
        currency,
        status: 'scheduled',
        payment_status: 'pending',
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating appointment:', createError)
      
      // Check if it's a unique constraint violation (concurrent booking)
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'This time slot was just booked by another user. Please choose another time.' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error creating appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
