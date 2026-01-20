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

    // Validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('Error parsing request body:', error)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { appointmentId } = body

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 })
    }

    // Validate Daily.co API key
    if (!process.env.DAILY_CO_API_KEY) {
      console.error('DAILY_CO_API_KEY is not set')
      return NextResponse.json(
        { error: 'Video service configuration error' },
        { status: 500 }
      )
    }

    // Get consultation duration for room expiry
    let durationMinutes
    try {
      durationMinutes = await getConsultationDuration()
    } catch (error) {
      console.error('Error fetching consultation duration:', error)
      // Use default duration if fetch fails
      durationMinutes = 45
    }

    // Create room
    let room
    try {
      room = await createRoom(appointmentId, durationMinutes)
    } catch (error: any) {
      console.error('Error creating Daily.co room:', error)
      const errorMessage = error?.message || 'Unknown error'
      return NextResponse.json(
        { error: `Failed to create video room: ${errorMessage}` },
        { status: 500 }
      )
    }

    if (!room || !room.name || !room.url) {
      console.error('Invalid room response:', room)
      return NextResponse.json(
        { error: 'Invalid response from video service' },
        { status: 500 }
      )
    }

    // Update appointment with room details
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        daily_room_name: room.name,
        daily_room_url: room.url,
      })
      .eq('id', appointmentId)

    if (updateError) {
      console.error('Error updating appointment with room details:', updateError)
      // Room was created but update failed - still return the room
      // so user can join, but log the error
    }

    return NextResponse.json({ room })
  } catch (error: any) {
    console.error('Unexpected error creating room:', error)
    const errorMessage = error?.message || 'Unknown error occurred'
    return NextResponse.json(
      { error: `Failed to create room: ${errorMessage}` },
      { status: 500 }
    )
  }
}

