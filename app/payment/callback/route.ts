import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPayment } from '@/lib/paystack/client'
import { createRoom } from '@/lib/daily/client'
import { getConsultationDuration } from '@/lib/admin/system-settings'
import { notifyAppointmentConfirmed, notifyDoctorAppointmentBooked, notifyAdmins, sendDoctorAppointmentEmail, formatDoctorName } from '@/lib/notifications/triggers'

/**
 * Get the correct base URL for redirects
 * Uses environment variables as source of truth to avoid internal deployment URLs
 */
function getBaseUrl(): string {
  // Priority 1: Environment variable (most reliable)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Priority 2: Vercel URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Priority 3: Netlify URL
  if (process.env.URL) {
    return process.env.URL
  }
  
  // Default: local development
  return 'http://localhost:3000'
}

/**
 * Payment Callback Handler
 * 
 * This endpoint handles user redirects from Paystack after payment.
 * 
 * Security measures:
 * - Idempotency check: Prevents duplicate processing if callback is called multiple times
 * - Amount validation: Verifies payment amount matches appointment amount
 * - Primary verification: Webhook handler (/api/payments/webhook) is the authoritative source
 * 
 * Note: This callback is for user experience (immediate redirect). The webhook handler
 * is the primary verification mechanism and should handle most payment confirmations.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const reference = searchParams.get('reference')
  const trxref = searchParams.get('trxref')
  const paymentReference = reference || trxref
  const error = searchParams.get('error')

  const BASE_URL = getBaseUrl()

  // Handle payment cancellation or errors
  if (error || !paymentReference) {
    return NextResponse.redirect(
      `${BASE_URL}/patient/appointments?error=payment_failed&reason=${error ? 'user_cancelled' : 'missing_reference'}${paymentReference ? `&reference=${paymentReference}` : ''}`
    )
  }

  try {
    // Verify payment with Paystack
    const payment = await verifyPayment(paymentReference)

    if (payment.data.status !== 'success') {
      return NextResponse.redirect(
        `${BASE_URL}/patient/appointments?error=payment_failed&reference=${paymentReference}`
      )
    }

    const supabase = await createClient()

    // Find appointment by payment reference
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, doctor_id, patient_id, scheduled_at, chief_complaint, symptoms_description, amount, payment_status, status')
      .eq('paystack_reference', paymentReference)
      .single()

    if (appointmentError || !appointment) {
      console.error('Appointment not found for reference:', paymentReference, appointmentError)
      return NextResponse.redirect(
        `${BASE_URL}/patient/appointments?error=appointment_not_found&reference=${paymentReference}`
      )
    }

    // Idempotency check: If already processed, redirect to success
    if (appointment.payment_status === 'paid' && appointment.status === 'confirmed') {
      console.log(`✅ Appointment ${appointment.id} already confirmed, redirecting to success`)
      return NextResponse.redirect(
        `${BASE_URL}/patient/appointments?success=payment_complete&appointment_id=${appointment.id}&reference=${paymentReference}`
      )
    }

    // Validate payment amount matches appointment amount
    const paymentAmount = payment.data.amount // Amount in kobo from Paystack
    const appointmentAmount = Math.round(Number(appointment.amount) || 0) // Amount is already stored in kobo

    if (paymentAmount !== appointmentAmount) {
      console.error(`❌ Payment amount mismatch: expected ${appointmentAmount}, got ${paymentAmount}`)
      return NextResponse.redirect(
        `${BASE_URL}/patient/appointments?error=payment_amount_mismatch&appointment_id=${appointment.id}&reference=${paymentReference}`
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
        `${BASE_URL}/patient/appointments?error=update_failed&appointment_id=${appointment.id}&reference=${paymentReference}`
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
        formatDoctorName(doctor?.full_name || 'Unknown'),
        new Date(appointment.scheduled_at)
      )

      await notifyDoctorAppointmentBooked(
        appointment.doctor_id,
        appointment.id,
        patient?.full_name || 'Patient',
        new Date(appointment.scheduled_at)
      )

      await notifyAdmins(
        'system',
        'New appointment booked',
        `A new appointment has been booked (${patient?.full_name || 'Patient'} with doctor).`,
        { appointment_id: appointment.id }
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
      `${BASE_URL}/patient/appointments?success=payment_complete&appointment_id=${appointment.id}&reference=${paymentReference}`
    )
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.redirect(
      `${BASE_URL}/patient/appointments?error=verification_failed&reference=${paymentReference || 'unknown'}`
    )
  }
}

