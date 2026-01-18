import DailyApi from '@daily-co/daily-js'

// Daily.co REST API client - using fetch directly for server-side
const API_KEY = process.env.DAILY_CO_API_KEY || ''
const DAILY_API_BASE = 'https://api.daily.co/v1'

export async function createRoom(appointmentId: string, durationMinutes?: number) {
  try {
    // Calculate expiry: duration * 120 seconds (duration * 2 minutes) for safety
    // Or use default 2 hours (7200 seconds) if duration not provided
    const expirySeconds = durationMinutes 
      ? Math.floor(Date.now() / 1000) + (durationMinutes * 120) 
      : Math.floor(Date.now() / 1000) + 7200 // Default 2 hours

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
          exp: expirySeconds,
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

