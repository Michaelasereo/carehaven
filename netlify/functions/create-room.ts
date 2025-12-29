import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import DailyApi from '@daily-co/daily-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const daily = DailyApi({ apiKey: process.env.DAILY_CO_API_KEY! })

export const handler: Handler = async (event) => {
  try {
    const { appointmentId } = JSON.parse(event.body || '{}')

    const room = await daily.rooms.create({
      name: `appointment-${appointmentId}`,
      privacy: 'private',
      properties: {
        enable_recording: 'cloud',
        enable_chat: true,
        enable_screenshare: true,
        hipaa_compliant: true,
        exp: Math.floor(Date.now() / 1000) + 7200,
      },
    })

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

