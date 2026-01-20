import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { createRoom } from '@/lib/daily/client'
import { getConsultationDuration } from '@/lib/admin/system-settings'
import { notifyAppointmentConfirmed, notifyDoctorAppointmentBooked, sendDoctorAppointmentEmail, formatDoctorName } from '@/lib/notifications/triggers'

/**
 * Paystack Webhook Handler
 * 
 * This endpoint receives webhook events from Paystack after payment transactions.
 * It verifies the webhook signature using HMAC SHA512 before processing.
 * 
 * Webhook URL for Paystack Dashboard:
 * https://your-production-domain.com/api/payments/webhook
 * 
 * Security:
 * - Verifies Paystack signature using HMAC SHA512
 * - Uses timing-safe comparison to prevent timing attacks
 * - Only processes events from verified Paystack webhooks
 */
export async function POST(request: Request) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY

    if (!secret) {
      console.error('❌ PAYSTACK_SECRET_KEY is not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Get webhook signature from headers
    const signature = request.headers.get('x-paystack-signature')

    if (!signature) {
      console.error('❌ Missing Paystack webhook signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Get raw body as text for signature verification
    const rawBody = await request.text()

    // Compute HMAC SHA512 signature
    const computed = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex')

    // Timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature, 'hex')
    const compBuffer = Buffer.from(computed, 'hex')

    // Check buffer lengths match
    if (sigBuffer.length !== compBuffer.length) {
      console.error('❌ Invalid Paystack webhook signature (length mismatch)')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const isValid = crypto.timingSafeEqual(sigBuffer, compBuffer)

    if (!isValid) {
      console.error('❌ Invalid Paystack webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse payload
    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch (err) {
      console.error('❌ Invalid JSON in webhook payload:', err)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Handle webhook event
    const event = payload.event
    const data = payload.data

    console.log(`📥 Paystack webhook received: ${event}`)

    // Only process successful charge events
    if (event === 'charge.success') {
      const reference = data.reference

      if (!reference) {
        console.error('❌ Missing reference in webhook payload')
        return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
      }

      const supabase = await createClient()

      // Find appointment by payment reference
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('id, doctor_id, patient_id, scheduled_at, chief_complaint, symptoms_description, status, payment_status, amount')
        .eq('paystack_reference', reference)
        .single()

      if (appointmentError || !appointment) {
        console.error('❌ Appointment not found for reference:', reference)
        // Return 200 to acknowledge webhook (Paystack will retry if we return error)
        // But log the error for debugging
        return NextResponse.json({ received: true, error: 'Appointment not found' }, { status: 200 })
      }

      // Check if already processed (idempotency)
      if (appointment.payment_status === 'paid' && appointment.status === 'confirmed') {
        console.log(`✅ Appointment ${appointment.id} already confirmed, skipping`)
        return NextResponse.json({ received: true, message: 'Already processed' }, { status: 200 })
      }

      // Validate payment amount matches appointment amount
      const paymentAmount = data.amount // Amount in kobo from Paystack
      const appointmentAmount = Math.round((Number(appointment.amount) || 0) * 100) // Convert to kobo

      if (paymentAmount !== appointmentAmount) {
        console.error(`❌ Payment amount mismatch for appointment ${appointment.id}: expected ${appointmentAmount}, got ${paymentAmount}`)
        // Return 200 to acknowledge but log the error
        // This prevents Paystack from retrying, but we've logged the issue
        return NextResponse.json({ received: true, error: 'Amount mismatch' }, { status: 200 })
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
        console.error('❌ Error updating appointment:', updateError)
        return NextResponse.json({ received: true, error: 'Update failed' }, { status: 200 })
      }

      console.log(`✅ Appointment ${appointment.id} confirmed via webhook`)

      // Auto-create video room for confirmed appointment
      try {
        const durationMinutes = await getConsultationDuration()
        const room = await createRoom(appointment.id, durationMinutes)
        
        await supabase
          .from('appointments')
          .update({
            daily_room_name: room.name,
            daily_room_url: room.url,
          })
          .eq('id', appointment.id)

        console.log(`✅ Video room created for appointment ${appointment.id}`)
      } catch (roomError) {
        // Log but don't fail - room can be created later
        console.error('❌ Error creating video room:', roomError)
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

        console.log(`✅ Notifications sent for appointment ${appointment.id}`)
      } catch (notifError) {
        console.error('❌ Error creating notifications:', notifError)
        // Don't fail the webhook if notifications fail
      }

      // Always return 200 to acknowledge webhook receipt
      return NextResponse.json({ received: true, message: 'Webhook processed successfully' }, { status: 200 })
    }

    // For other events, just acknowledge receipt
    console.log(`ℹ️  Webhook event ${event} received but not processed`)
    return NextResponse.json({ received: true, message: 'Event acknowledged' }, { status: 200 })

  } catch (error: any) {
    console.error('❌ Error processing Paystack webhook:', error)
    // Return 200 to acknowledge receipt (Paystack will retry on error)
    // But log the error for debugging
    return NextResponse.json({ received: true, error: error.message }, { status: 200 })
  }
}
