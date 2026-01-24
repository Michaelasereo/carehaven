import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  notifyAppointmentConfirmed,
  notifyDoctorAppointmentBooked,
  sendDoctorAppointmentEmail,
} from '@/lib/notifications/triggers'
import { isTimeAvailable, type AvailabilitySlot } from '@/lib/utils/availability'

/**
 * Admin-only: create an appointment and send booking email/SMS to patient and doctor.
 * Reuses the same notification logic as the payment callback.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 })
    }

    const body = await request.json()
    const {
      patient_id,
      doctor_id,
      scheduled_at,
      duration_minutes = 45,
      chief_complaint,
      symptoms_description,
      amount,
      currency = 'NGN',
      status = 'scheduled',
      payment_status = 'waived',
    } = body

    if (!patient_id || !doctor_id || !scheduled_at) {
      return NextResponse.json(
        { error: 'Missing required fields: patient_id, doctor_id, scheduled_at' },
        { status: 400 }
      )
    }

    const scheduledDate = new Date(scheduled_at)

    // Optional: validate doctor availability (same as admin form does client-side)
    const { data: availability } = await supabase
      .from('doctor_availability')
      .select('day_of_week, start_time, end_time, active')
      .eq('doctor_id', doctor_id)
      .eq('active', true)

    if (availability && availability.length > 0) {
      const slots: AvailabilitySlot[] = availability.map((s) => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        active: s.active,
      }))
      const timeStr = scheduledDate.toTimeString().slice(0, 5)
      if (!isTimeAvailable(scheduledDate, timeStr, slots)) {
        return NextResponse.json(
          { error: 'Selected time is not in the doctor\'s schedule.' },
          { status: 400 }
        )
      }
    }

    // Optional: check for conflicts
    const end = new Date(scheduledDate.getTime() + duration_minutes * 60000)
    const { data: existing } = await supabase
      .from('appointments')
      .select('id, scheduled_at, duration_minutes')
      .eq('doctor_id', doctor_id)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .gte('scheduled_at', new Date(scheduledDate.getTime() - 86400000).toISOString())
      .lte('scheduled_at', new Date(scheduledDate.getTime() + 86400000).toISOString())

    if (existing?.length) {
      const conflict = existing.some((apt) => {
        const s = new Date(apt.scheduled_at).getTime()
        const e = s + (apt.duration_minutes || 45) * 60000
        return scheduledDate.getTime() < e && end.getTime() > s
      })
      if (conflict) {
        return NextResponse.json(
          { error: 'This time slot is already booked.' },
          { status: 409 }
        )
      }
    }

    const { data: appointment, error: createError } = await supabase
      .from('appointments')
      .insert({
        patient_id,
        doctor_id,
        scheduled_at: scheduledDate.toISOString(),
        duration_minutes,
        chief_complaint: chief_complaint || 'Admin booking',
        symptoms_description: symptoms_description || null,
        amount: amount ?? 0,
        currency,
        status,
        payment_status,
      })
      .select('id, doctor_id, patient_id, scheduled_at, chief_complaint, symptoms_description')
      .single()

    if (createError) {
      console.error('[admin-create] Insert error:', createError)
      return NextResponse.json(
        { error: createError.message || 'Failed to create appointment' },
        { status: 500 }
      )
    }

    // Send booking email/SMS to patient and doctor (same as payment callback)
    try {
      const { data: doctor } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', appointment.doctor_id)
        .single()

      const { data: patient } = await supabase
        .from('profiles')
        .select('full_name, chronic_conditions, gender, age, date_of_birth')
        .eq('id', appointment.patient_id)
        .single()

      let age: string | undefined
      // Use age field if available, otherwise calculate from date_of_birth for backward compatibility
      if (patient?.age !== null && patient?.age !== undefined) {
        age = String(patient.age)
      } else if (patient?.date_of_birth) {
        const b = new Date(patient.date_of_birth)
        const t = new Date()
        let a = t.getFullYear() - b.getFullYear()
        if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--
        age = String(a)
      }

      await notifyAppointmentConfirmed(
        appointment.patient_id,
        appointment.id,
        doctor?.full_name || 'Unknown',
        new Date(appointment.scheduled_at)
      )

      await notifyDoctorAppointmentBooked(
        appointment.doctor_id,
        appointment.id,
        patient?.full_name || 'Patient',
        new Date(appointment.scheduled_at)
      )

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
    } catch (notifErr) {
      console.error('[admin-create] Notifications error:', notifErr)
      // Do not fail the request; appointment is already created
    }

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (err: unknown) {
    const e = err as { message?: string }
    console.error('[admin-create] Error:', e?.message, err)
    return NextResponse.json(
      { error: (e?.message as string) || 'Internal server error' },
      { status: 500 }
    )
  }
}
