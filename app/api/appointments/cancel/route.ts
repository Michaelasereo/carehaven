import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refundTransaction } from '@/lib/paystack/client'
import { createNotification } from '@/lib/notifications/create'
import { notifyAppointmentCancelled, notifyAdmins } from '@/lib/notifications/triggers'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const REFUND_HOURS = 12

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { appointmentId?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const appointmentId = body?.appointmentId
    if (!appointmentId || !UUID_REGEX.test(appointmentId)) {
      return NextResponse.json(
        { error: 'Invalid or missing appointmentId' },
        { status: 400 }
      )
    }

    const { data: appointment, error: fetchErr } = await supabase
      .from('appointments')
      .select(
        'id, patient_id, doctor_id, scheduled_at, payment_status, paystack_reference, amount, status'
      )
      .eq('id', appointmentId)
      .single()

    if (fetchErr || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    if (appointment.patient_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the patient can cancel this appointment' },
        { status: 403 }
      )
    }

    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Appointment is already cancelled', refund: false },
        { status: 400 }
      )
    }

    const now = Date.now()
    const scheduledAt = new Date(appointment.scheduled_at).getTime()
    const hoursUntilStart = (scheduledAt - now) / (60 * 60 * 1000)
    const shouldRefund =
      hoursUntilStart >= REFUND_HOURS &&
      appointment.payment_status === 'paid' &&
      !!appointment.paystack_reference

    if (shouldRefund) {
      try {
        const amountKobo = Math.round((Number(appointment.amount) || 0) * 100)
        await refundTransaction(appointment.paystack_reference, amountKobo)
      } catch (refundErr) {
        console.error('[appointments/cancel] Refund failed:', refundErr)
        return NextResponse.json(
          {
            error: 'Cancellation aborted: refund failed. Please try again or contact support.',
            refund: false,
          },
          { status: 502 }
        )
      }
    }

    const updatePayload: { status: string; payment_status?: string } = {
      status: 'cancelled',
    }
    if (shouldRefund) {
      updatePayload.payment_status = 'refunded'
    }

    const { error: updateErr } = await supabase
      .from('appointments')
      .update(updatePayload)
      .eq('id', appointmentId)

    if (updateErr) {
      console.error('[appointments/cancel] Update failed:', updateErr)
      return NextResponse.json(
        { error: 'Failed to cancel appointment' },
        { status: 500 }
      )
    }

    try {
      await notifyAppointmentCancelled(appointment.patient_id, appointmentId)
      await createNotification(
        appointment.doctor_id,
        'appointment',
        'Appointment Cancelled',
        'A patient has cancelled their appointment',
        { appointment_id: appointmentId }
      )
      const adminBody = shouldRefund
        ? 'A patient cancelled an appointment. Refund issued.'
        : 'A patient cancelled an appointment. No refund (within 12h of start).'
      await notifyAdmins(
        'system',
        'Appointment cancelled',
        adminBody,
        { appointment_id: appointmentId }
      )
    } catch (notifErr) {
      console.error('[appointments/cancel] Notifications failed:', notifErr)
    }

    return NextResponse.json({
      success: true,
      refund: shouldRefund,
    })
  } catch (e) {
    console.error('[appointments/cancel]', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
