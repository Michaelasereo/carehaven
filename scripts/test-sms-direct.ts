/**
 * Direct SMS Sending Test
 * Tests Twilio SMS sending directly with the configured phone number
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import twilio from 'twilio'

config({ path: resolve(process.cwd(), '.env.local') })

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER
const testPhone = process.argv[2] || '+2348024096399'

// Format phone number to E.164 format (remove spaces, ensure + prefix)
function formatPhoneNumber(phone: string): string {
  return phone.replace(/\s+/g, '').trim()
}

async function testDirectSMS() {
  console.log('\n🧪 Testing Direct SMS Sending')
  console.log('========================\n')

  if (!TWILIO_ACCOUNT_SID) {
    console.error('❌ TWILIO_ACCOUNT_SID is not set in .env.local')
    process.exit(1)
  }

  if (!TWILIO_AUTH_TOKEN) {
    console.error('❌ TWILIO_AUTH_TOKEN is not set in .env.local')
    process.exit(1)
  }

  if (!TWILIO_PHONE_NUMBER) {
    console.error('❌ TWILIO_PHONE_NUMBER is not set in .env.local')
    process.exit(1)
  }

  const formattedPhone = formatPhoneNumber(testPhone)
  
  // Check if sending to the same number as the Twilio phone number
  if (formattedPhone === TWILIO_PHONE_NUMBER) {
    console.error('❌ Cannot send SMS to the same number as TWILIO_PHONE_NUMBER')
    console.error(`   Recipient: ${formattedPhone}`)
    console.error(`   Sender: ${TWILIO_PHONE_NUMBER}`)
    console.error('\n💡 Solution: Use a different phone number for testing')
    console.error('   Example: npx tsx scripts/test-sms-direct.ts +2348141234567')
    process.exit(1)
  }
  
  console.log(`✅ Twilio Account SID found: ${TWILIO_ACCOUNT_SID.substring(0, 10)}...`)
  console.log(`✅ Twilio Auth Token found: ${TWILIO_AUTH_TOKEN.substring(0, 10)}...`)
  console.log(`📱 Sending test SMS to: ${formattedPhone}`)
  console.log(`📤 From: ${TWILIO_PHONE_NUMBER}\n`)

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    const message = await client.messages.create({
      body: 'Test SMS from Care Haven - If you received this, SMS is working correctly! ✅',
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    })

    console.log('✅ SMS sent successfully!')
    console.log(`   Message SID: ${message.sid}`)
    console.log(`   Status: ${message.status}\n`)
    console.log(`📱 Check your phone: ${formattedPhone}`)
    console.log('✅ Twilio SMS sending is working correctly!\n')
    
  } catch (error: any) {
    console.error('❌ SMS sending failed!')
    console.error(`   Error: ${error.message}\n`)
    
    if (error.code) {
      console.error(`   Error Code: ${error.code}`)
    }
    
    if (error.moreInfo) {
      console.error(`   More Info: ${error.moreInfo}`)
    }

    // Handle common Twilio errors
    if (error.code === 21211) {
      console.error('⚠️  Invalid phone number format')
      console.error('   Solution: Ensure phone number is in E.164 format (e.g., +2348141294589)')
    } else if (error.code === 21608) {
      console.error('⚠️  Unverified phone number')
      console.error('   Solution: Verify the recipient phone number in Twilio Console')
    } else if (error.code === 21408) {
      console.error('⚠️  Permission denied')
      console.error('   Solution: Check Twilio account permissions and phone number capabilities')
    } else if (error.code === 20003) {
      console.error('⚠️  Authentication failed')
      console.error('   Solution: Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are correct')
    } else if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ENOTFOUND')) {
      console.error('⚠️  Network error - check internet connection')
      console.error('   The Twilio API endpoint might be unreachable')
    }
    
    console.error('\n💡 Make sure:')
    console.error('   1. TWILIO_ACCOUNT_SID is set correctly in .env.local')
    console.error('   2. TWILIO_AUTH_TOKEN is set correctly in .env.local')
    console.error('   3. TWILIO_PHONE_NUMBER is set correctly in .env.local')
    console.error('   4. Phone number is in E.164 format (e.g., +2348141294589)')
    console.error('   5. Twilio account has sufficient credits')
    console.error('   6. Internet connection is working')
    process.exit(1)
  }
}

testDirectSMS()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
