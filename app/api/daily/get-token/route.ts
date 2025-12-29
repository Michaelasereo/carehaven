import { createClient } from '@/lib/supabase/server'
import { generateToken } from '@/lib/daily/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomName } = await request.json()
    const token = await generateToken(roomName, user.id)

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error generating token:', error)
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}

