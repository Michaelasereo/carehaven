import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications/create'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, type, title, body, data } = await request.json()

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'Missing userId or type' },
        { status: 400 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
    const isSelf = userId === user.id

    let allowed = isSelf || isAdmin

    // Allow creating notifications for the other party in an appointment (cancel, reschedule, etc.)
    const appointmentId = data?.appointment_id ?? data?.appointmentId
    if (!allowed && appointmentId && type === 'appointment') {
      const { data: apt } = await supabase
        .from('appointments')
        .select('patient_id, doctor_id')
        .eq('id', appointmentId)
        .single()

      if (apt && (apt.patient_id === user.id || apt.doctor_id === user.id)) {
        const otherId = apt.patient_id === user.id ? apt.doctor_id : apt.patient_id
        if (userId === otherId) allowed = true
      }
    }

    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await createNotification(userId, type, title, body, data)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
