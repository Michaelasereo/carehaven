/**
 * Direct Email Sending Test
 * Tests Brevo email sending directly with the verified sender email
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const BREVO_API_KEY = process.env.BREVO_API_KEY
const testEmail = process.argv[2] || 'asereope@gmail.com'

async function testDirectEmail() {
  console.log('\n🧪 Testing Direct Email Sending')
  console.log('========================\n')

  if (!BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY is not set in .env.local')
    process.exit(1)
  }

  console.log(`✅ Brevo API Key found: ${BREVO_API_KEY.substring(0, 10)}...`)
  console.log(`📧 Sending test email to: ${testEmail}`)
  console.log(`📤 From: mycarehaven@gmail.com\n`)

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Care Haven',
          email: 'mycarehaven@gmail.com',
        },
        to: [
          {
            email: testEmail,
          },
        ],
        subject: 'Test Email from Care Haven',
        htmlContent: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Test Email - Care Haven</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #0d9488; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">Care Haven</h1>
              </div>
              <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #111827; margin-top: 0;">Test Email</h2>
                <p>This is a test email to verify that Brevo email sending is working correctly.</p>
                <p>If you received this email, it means:</p>
                <ul>
                  <li>✅ Brevo API key is configured correctly</li>
                  <li>✅ Sender email (mycarehaven@gmail.com) is verified in Brevo</li>
                  <li>✅ Email sending is working!</li>
                </ul>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  This is an automated test email from Care Haven.
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Email sending failed!')
      console.error(`   Status: ${response.status}`)
      console.error(`   Error: ${error}\n`)
      
      try {
        const errorJson = JSON.parse(error)
        if (errorJson.message) {
          console.log(`   Brevo error: ${errorJson.message}`)
        }
        if (errorJson.message?.includes('unrecognised IP address')) {
          console.log('⚠️  Brevo IP whitelisting error')
          console.log('   Solution: Add your IP address in Brevo Dashboard → Security → Authorized IPs')
          console.log('   Or disable IP restrictions for testing')
        }
      } catch (e) {
        // Error is not JSON, just show raw error
      }
      
      process.exit(1)
    }

    const result = await response.json()
    console.log('✅ Email sent successfully!')
    console.log(`   Message ID: ${result.messageId || 'N/A'}\n`)
    console.log(`📧 Check your inbox: ${testEmail}`)
    console.log(`   (Also check spam/junk folder)\n`)
    console.log('✅ Brevo email sending is working correctly!')
    
  } catch (error: any) {
    console.error('❌ Error sending email:', error.message)
    console.error('   Full error:', error)
    
    if (error.message?.includes('fetch failed')) {
      console.error('\n⚠️  Network error - check internet connection')
      console.error('   The Brevo API endpoint might be unreachable')
    }
    
    console.error('\n💡 Make sure:')
    console.error('   1. BREVO_API_KEY is set correctly in .env.local')
    console.error('   2. Sender email is verified in Brevo')
    console.error('   3. Your IP is whitelisted (if IP restrictions are enabled)')
    console.error('   4. Internet connection is working')
    process.exit(1)
  }
}

testDirectEmail()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
