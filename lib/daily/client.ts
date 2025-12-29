import DailyApi from '@daily-co/daily-js'

// Daily.co REST API client - using fetch directly for server-side
const API_KEY = process.env.DAILY_CO_API_KEY || ''
const DAILY_API_BASE = 'https://api.daily.co/v1'

export async function createRoom(appointmentId: string) {
  try {
    const response = await fetch(`${DAILY_API_BASE}/rooms`, {
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
          exp: Math.floor(Date.now() / 1000) + 7200, // 2 hours
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Daily.co API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating Daily.co room:', error)
    throw error
  }
}

export async function generateToken(roomName: string, userId: string) {
  try {
    const response = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          is_owner: false,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Daily.co API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.token
  } catch (error) {
    console.error('Error generating Daily.co token:', error)
    throw error
  }
}

