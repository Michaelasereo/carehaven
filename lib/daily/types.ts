export interface DailyRoom {
  id: string
  name: string
  url: string
  config: {
    enable_recording?: string
    enable_chat?: boolean
    enable_screenshare?: boolean
    hipaa_compliant?: boolean
  }
}

export interface DailyToken {
  token: string
  room: string
}

