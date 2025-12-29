import DailyApi from '@daily-co/daily-js'

const daily = DailyApi({ apiKey: process.env.DAILY_CO_API_KEY || '' })

export async function createRoom(appointmentId: string) {
  try {
    const room = await daily.rooms.create({
      name: `appointment-${appointmentId}`,
      privacy: 'private',
      properties: {
        enable_recording: 'cloud',
        enable_chat: true,
        enable_screenshare: true,
        hipaa_compliant: true,
        exp: Math.floor(Date.now() / 1000) + 7200, // 2 hours
      },
    })
    return room
  } catch (error) {
    console.error('Error creating Daily.co room:', error)
    throw error
  }
}

export async function generateToken(roomName: string, userId: string) {
  try {
    const token = await daily.roomTokens.create({
      room: roomName,
      properties: {
        is_owner: false,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      },
    })
    return token.token
  } catch (error) {
    console.error('Error generating Daily.co token:', error)
    throw error
  }
}

