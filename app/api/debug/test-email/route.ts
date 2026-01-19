import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/client'

/**
 * Test Email Endpoint
 * 
 * This endpoint allows testing email sending in production.
 * It sends a test email to verify Brevo configuration.
 * 
 * Usage:
 * GET /api/debug/test-email?to=your-email@example.com
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const to = searchParams.get('to') || 'asereope@gmail.com'

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Check environment variables
    const brevoApiKey = process.env.BREVO_API_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    const config = {
      brevoApiKeyConfigured: !!brevoApiKey,
      brevoApiKeyLength: brevoApiKey?.length || 0,
      brevoApiKeyPrefix: brevoApiKey ? brevoApiKey.substring(0, 10) + '...' : 'NOT SET',
      supabaseUrlConfigured: !!supabaseUrl,
      appUrlConfigured: !!appUrl,
      appUrl: appUrl || 'NOT SET',
    }

    if (!brevoApiKey) {
      return NextResponse.json({
        status: 'ERROR',
        error: 'BREVO_API_KEY is not configured',
        config,
      }, { status: 500 })
    }

    // Send test email
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; text-align: center;">
            <h1 style="color: #0d9488; margin-bottom: 20px;">Email Test</h1>
            <p style="font-size: 16px; margin-bottom: 30px;">
              This is a test email from Care Haven production system.
            </p>
            <div style="background-color: #ffffff; border: 2px solid #0d9488; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="color: #0d9488; font-size: 18px; margin: 0;">
                ✅ Email service is working correctly!
              </p>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you received this email, the Brevo email service is properly configured.
            </p>
            <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
              Sent from: ${appUrl || 'Care Haven Production'}
            </p>
          </div>
        </body>
      </html>
    `

    try {
      const result = await sendEmail(to, 'Care Haven - Email Test', testHtml)
      
      return NextResponse.json({
        status: 'SUCCESS',
        message: 'Test email sent successfully',
        recipient: to,
        messageId: result.messageId || 'N/A',
        config,
        timestamp: new Date().toISOString(),
      })
    } catch (emailError: any) {
      return NextResponse.json({
        status: 'ERROR',
        error: 'Failed to send test email',
        errorMessage: emailError.message,
        errorDetails: emailError.stack,
        config,
        timestamp: new Date().toISOString(),
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({
      status: 'ERROR',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
