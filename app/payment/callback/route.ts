import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPayment } from '@/lib/paystack/client'
import { createRoom } from '@/lib/daily/client'
import { getConsultationDuration } from '@/lib/admin/system-settings'
import { notifyAppointmentConfirmed, notifyDoctorAppointmentBooked, sendDoctorAppointmentEmail } from '@/lib/notifications/triggers'

/**
 * Payment Callback Handler
 * 
 * ⚠️ TECH DEBT: This uses GET with query params, which is vulnerable to replay attacks.
 * In production, you MUST:
 * 1. Verify Paystack webhook signature
 * 2. Use POST endpoint with webhook verification
 * 3. Add idempotency checks to prevent duplicate processing
 * 
 * For MVP, this is acceptable but document the security risk.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')
  const error = searchParams.get('error')

  // Handle payment cancellation or errors
  if (error || !reference) {
    return NextResponse.redirect(
      new URL('/patient/appointments?error=payment_failed', request.url)
    )
  }

  try {
    // Verify payment with Paystack
    const payment = await verifyPayment(reference)

    if (payment.data.status !== 'success') {
      return NextResponse.redirect(
        new URL('/patient/appointments?error=payment_failed', request.url)
      )
    }

    const supabase = await createClient()

    // Find appointment by payment reference
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, doctor_id, patient_id, scheduled_at, chief_complaint, symptoms_description')
      .eq('paystack_reference', reference)
      .single()

    if (appointmentError || !appointment) {
      console.error('Appointment not found for reference:', reference)
      return NextResponse.redirect(
        new URL('/patient/appointments?error=appointment_not_found', request.url)
      )
    }

    // Update appointment status to paid and confirmed
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
      })
      .eq('id', appointment.id)

    if (updateError) {
      console.error('Error updating appointment:', updateError)
      return NextResponse.redirect(
        new URL('/patient/appointments?error=update_failed', request.url)
      )
    }

    // Auto-create video room for confirmed appointment
    try {
      // Get consultation duration for room expiry
      const durationMinutes = await getConsultationDuration()
      const room = await createRoom(appointment.id, durationMinutes)
      
      await supabase
        .from('appointments')
        .update({
          daily_room_name: room.name,
          daily_room_url: room.url,
        })
        .eq('id', appointment.id)
    } catch (roomError) {
      // Log but don't fail - room can be created later
      console.error('Error creating video room:', roomError)
    }

    // Create notifications and send emails
    try {
      const { data: doctor } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', appointment.doctor_id)
        .single()

      const { data: patient } = await supabase
        .from('profiles')
        .select('full_name, chronic_conditions, gender, date_of_birth')
        .eq('id', appointment.patient_id)
        .single()

      // Calculate age from date_of_birth if available
      let age: string | undefined
      if (patient?.date_of_birth) {
        const birthDate = new Date(patient.date_of_birth)
        const today = new Date()
        const calculatedAge = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age = String(calculatedAge - 1)
        } else {
          age = String(calculatedAge)
        }
      }

      await notifyAppointmentConfirmed(
        appointment.patient_id,
        appointment.id,
        doctor?.full_name || 'Dr. Unknown',
        new Date(appointment.scheduled_at)
      )

      await notifyDoctorAppointmentBooked(
        appointment.doctor_id,
        appointment.id,
        patient?.full_name || 'Patient',
        new Date(appointment.scheduled_at)
      )

      // Send detailed email to doctor
      if (doctor?.email) {
        await sendDoctorAppointmentEmail(
          doctor.email,
          doctor.full_name || 'Doctor',
          patient?.full_name || 'Patient',
          new Date(appointment.scheduled_at),
          {
            reason: appointment.chief_complaint,
            complaints: appointment.symptoms_description,
            chronicConditions: patient?.chronic_conditions || [],
            gender: patient?.gender || null,
            age: age || null,
          }
        )
      }
    } catch (notifError) {
      console.error('Error creating notifications:', notifError)
      // Don't fail the payment flow if notifications fail
    }

    // Success - redirect with success message
    return NextResponse.redirect(
      new URL(`/patient/appointments?success=payment_complete&appointment_id=${appointment.id}`, request.url)
    )
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.redirect(
      new URL('/patient/appointments?error=verification_failed', request.url)
    )
  }
}

