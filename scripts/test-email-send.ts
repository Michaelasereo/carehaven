/**
 * Test Email Sending Script
 * Tests if Brevo email sending is working with the verified sender email
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const testEmail = process.argv[2] || 'asereoepeyemimichael@gmail.com'

async function testEmailSending() {
  console.log('\n🧪 Testing Email Sending')
  console.log('========================\n')

  try {
    const response = await fetch('http://localhost:3000/api/auth/send-verification-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    })

    const result = await response.json()

    if (response.ok) {
      console.log('✅ Email sending test: SUCCESS')
      console.log(`   Message: ${result.message}`)
      console.log(`   Check your inbox: ${testEmail}`)
      console.log('\n💡 If the user exists in Supabase, the verification email should be sent.')
    } else {
      console.log('❌ Email sending test: FAILED')
      console.log(`   Error: ${result.error}`)
      console.log(`   Details: ${result.details || 'No details'}`)
      console.log(`   Code: ${result.code || 'N/A'}`)
      
      if (result.code === 'BREVO_IP_ERROR') {
        console.log('\n⚠️  Brevo IP whitelisting error')
        console.log('   Add your IP address in Brevo Dashboard → Security → Authorized IPs')
      }
    }
  } catch (error: any) {
    console.error('❌ Error testing email:', error.message)
    console.log('\n💡 Make sure the dev server is running: npm run dev')
  }
}

testEmailSending()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
