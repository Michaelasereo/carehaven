import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * GET /api/availability/doctor/[doctorId]?date=YYYY-MM-DD
 * Returns booked slots for a doctor on a given date (scheduled_at, duration_minutes only).
 * Uses service role to bypass RLS so patients can see all of a doctor's bookings
 * when choosing a time slot. No PII is returned.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    const { doctorId } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!doctorId || !UUID_REGEX.test(doctorId)) {
      return NextResponse.json({ error: 'Invalid doctorId' }, { status: 400 })
    }
    if (!date || !DATE_REGEX.test(date)) {
      return NextResponse.json({ error: 'Invalid or missing date (use YYYY-MM-DD)' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })

    const startOfDay = new Date(`${date}T00:00:00`)
    const endOfDay = new Date(`${date}T23:59:59`)

    const { data, error } = await supabase
      .from('appointments')
      .select('scheduled_at, duration_minutes')
      .eq('doctor_id', doctorId)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .in('status', ['scheduled', 'confirmed', 'in_progress'])

    if (error) {
      console.error('[availability/doctor]', error)
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }

    const slots = (data || []).map((r) => ({
      scheduled_at: r.scheduled_at,
      duration_minutes: r.duration_minutes ?? 45,
    }))

    return NextResponse.json({ slots })
  } catch (e) {
    console.error('[availability/doctor]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
