import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const API_KEY = process.env.DAILY_CO_API_KEY!
const DAILY_API_BASE = 'https://api.daily.co/v1'

export const handler: Handler = async (event) => {
  try {
    const { appointmentId } = JSON.parse(event.body || '{}')

    const roomResponse = await fetch(`${DAILY_API_BASE}/rooms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `appointment-${appointmentId}`,
        privacy: 'private',
        config: {
          enable_recording: 'cloud',
          enable_chat: true,
          enable_screenshare: true,
          hipaa_compliant: true,
          exp: Math.floor(Date.now() / 1000) + 7200,
        },
      }),
    })

    if (!roomResponse.ok) {
      throw new Error(`Daily.co API error: ${roomResponse.statusText}`)
    }

    const room = await roomResponse.json()

    await supabase
      .from('appointments')
      .update({
        daily_room_name: room.name,
        daily_room_url: room.url,
      })
      .eq('id', appointmentId)

    return {
      statusCode: 200,
      body: JSON.stringify({ room }),
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create room' }),
    }
  }
}

