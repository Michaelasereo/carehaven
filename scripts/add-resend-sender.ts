/**
 * Add Resend Sender Email
 * Instructions for verifying a sender email in Resend
 * 
 * Note: Sender verification in Resend is typically done through the dashboard.
 * This script provides instructions on how to verify your sender email.
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const RESEND_API_KEY = process.env.RESEND_API_KEY
const senderEmail = process.argv[2] || 'asereopeyemimichael@gmail.com'

async function showInstructions() {
  console.log('\n📧 Resend Sender Email Verification')
  console.log('===================================\n')

  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set in .env.local')
    process.exit(1)
  }

  console.log(`✅ Resend API Key found: ${RESEND_API_KEY.substring(0, 10)}...`)
  console.log(`📧 Sender Email: ${senderEmail}\n`)
  
  console.log('📋 To verify your sender email in Resend:\n')
  console.log('   1. Go to: https://resend.com/emails')
  console.log('   2. Click "Add Domain" or "Add Email"')
  console.log('   3. Enter your email:', senderEmail)
  console.log('   4. Follow the verification steps\n')
  
  console.log('   OR use the dashboard:')
  console.log('   https://resend.com/settings/senders\n')
  
  console.log('💡 After verification:')
  console.log('   - You will receive a verification email at', senderEmail)
  console.log('   - Click the verification link in that email')
  console.log('   - Once verified, you can send emails from this address\n')
  
  console.log('🔗 Quick links:')
  console.log('   Dashboard: https://resend.com/emails')
  console.log('   API Keys: https://resend.com/api-keys')
  console.log('   Domains: https://resend.com/domains\n')
}

showInstructions()
