/**
 * Test script to verify Brevo email sending is working
 * Tests both general email sending and verification code emails
 */

import { sendEmail } from '../lib/email/client'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testEmailSending() {
  console.log('🧪 Testing Brevo Email Sending\n')
  console.log('='.repeat(60))

  // Check environment variables
  const brevoApiKey = process.env.BREVO_API_KEY
  if (!brevoApiKey) {
    console.error('❌ BREVO_API_KEY is not set in .env.local')
    process.exit(1)
  }
  console.log('✅ BREVO_API_KEY found')

  // Test email address (change this to your email)
  const testEmail = process.env.TEST_EMAIL || 'test@example.com'
  console.log(`📧 Test email address: ${testEmail}\n`)

  try {
    // Test 1: Send a simple email
    console.log('Test 1: Sending simple test email...')
    const testSubject = 'Test Email from Care Haven'
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #0d9488;">Email Test Successful!</h2>
          <p>This is a test email to verify Brevo email sending is working correctly.</p>
          <p>If you receive this email, it means:</p>
          <ul>
            <li>✅ Brevo API is configured correctly</li>
            <li>✅ Email client is working</li>
            <li>✅ SMTP integration is functional</li>
          </ul>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            Sent from Care Haven email test script
          </p>
        </body>
      </html>
    `

    const result = await sendEmail(testEmail, testSubject, testHtml)
    console.log('✅ Email sent successfully!')
    console.log('   Result:', JSON.stringify(result, null, 2))
    console.log()

    // Test 2: Send verification code email format
    console.log('Test 2: Sending verification code email...')
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const codeSubject = 'Your Care Haven Verification Code'
    const codeHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; text-align: center;">
            <h1 style="color: #0d9488; margin-bottom: 20px;">Verify Your Email</h1>
            <p style="font-size: 16px; margin-bottom: 30px;">
              Your verification code is:
            </p>
            <div style="background-color: #ffffff; border: 2px solid #0d9488; border-radius: 8px; padding: 20px; margin: 20px 0; display: inline-block;">
              <h2 style="color: #0d9488; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: monospace;">${code}</h2>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              This code will expire in 15 minutes.
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
          <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
            This is an automated email from Care Haven. Please do not reply to this email.
          </p>
        </body>
      </html>
    `

    const codeResult = await sendEmail(testEmail, codeSubject, codeHtml)
    console.log('✅ Verification code email sent successfully!')
    console.log(`   Verification code: ${code}`)
    console.log('   Result:', JSON.stringify(codeResult, null, 2))
    console.log()

    console.log('='.repeat(60))
    console.log('✅ All email tests passed!')
    console.log(`📬 Check your email at: ${testEmail}`)
    console.log('   (Check spam folder if not in inbox)')
    
  } catch (error: any) {
    console.error('\n❌ Email sending failed!')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    
    if (error.message?.includes('api-key') || error.message?.includes('unauthorized')) {
      console.error('\n💡 Tip: Check that your BREVO_API_KEY is correct in .env.local')
    }
    
    if (error.message?.includes('sender')) {
      console.error('\n💡 Tip: Verify the sender email is configured in Brevo')
    }
    
    process.exit(1)
  }
}

// Run the test
testEmailSending()
  .then(() => {
    console.log('\n✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
