import { NextResponse } from 'next/server'

// This is a debug route - no auth required
export const runtime = 'nodejs'

export async function GET() {
  try {
    const brevoApiKey = process.env.BREVO_API_KEY
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    
    return NextResponse.json({
      status: 'OK',
      emailConfig: {
        brevoApiKeyConfigured: !!brevoApiKey,
        brevoApiKeyLength: brevoApiKey?.length || 0,
        brevoApiKeyPrefix: brevoApiKey ? brevoApiKey.substring(0, 10) + '...' : 'NOT SET',
        appUrl: appUrl || 'NOT SET',
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'ERROR',
      error: error.message,
    }, { status: 500 })
  }
}
