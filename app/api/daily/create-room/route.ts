import { createClient } from '@/lib/supabase/server'
import { createRoom } from '@/lib/daily/client'
import { getConsultationDuration } from '@/lib/admin/system-settings'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { appointmentId } = await request.json()

    // Get consultation duration for room expiry
    const durationMinutes = await getConsultationDuration()
    const room = await createRoom(appointmentId, durationMinutes)

    // Update appointment with room details
    await supabase
      .from('appointments')
      .update({
        daily_room_name: room.name,
        daily_room_url: room.url,
      })
      .eq('id', appointmentId)

    return NextResponse.json({ room })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}

