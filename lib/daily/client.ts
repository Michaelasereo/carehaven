import DailyApi from '@daily-co/daily-js'

// Daily.co REST API client - using fetch directly for server-side
const API_KEY = process.env.DAILY_CO_API_KEY || ''
const DAILY_API_BASE = 'https://api.daily.co/v1'

export async function createRoom(appointmentId: string, durationMinutes?: number) {
  try {
    // Validate API key
    if (!API_KEY) {
      throw new Error('DAILY_CO_API_KEY is not configured')
    }

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
        // Daily REST API expects room settings under `properties`
        // (Using `config` / `hipaa_compliant` here can trigger invalid-request-error.)
        properties: {
          exp: expirySeconds,
          enable_chat: true,
          enable_screenshare: true,
        },
      }),
    })

    if (!response.ok) {
      // Try to get error details from response body
      let errorMessage = `Daily.co API error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData?.error || errorData?.message) {
          errorMessage = `Daily.co API error: ${errorData.error || errorData.message}`
        }
      } catch {
        // If parsing fails, use the status text
      }
      throw new Error(errorMessage)
    }

    const room = await response.json()
    
    // Validate room response
    if (!room || !room.name || !room.url) {
      throw new Error('Invalid room response from Daily.co API')
    }

    return room
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

