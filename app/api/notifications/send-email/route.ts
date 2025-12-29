import { sendEmail } from '@/lib/email/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { to, subject, htmlContent } = await request.json()
    await sendEmail(to, subject, htmlContent)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

