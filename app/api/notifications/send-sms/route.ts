import { sendSMS } from '@/lib/sms/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { to, message } = await request.json()
    await sendSMS(to, message)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending SMS:', error)
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
}

