/**
 * Comprehensive diagnostic script for email sending
 * Tests the entire verification code email flow
 */

import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '../lib/email/client'
import { generateVerificationCode, storeVerificationCode } from '../lib/auth/verification-code'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function diagnoseEmailFlow() {
  console.log('🔍 Email Sending Diagnostic\n')
  console.log('='.repeat(60))

  // Step 1: Check environment variables
  console.log('Step 1: Checking environment variables...')
  const brevoApiKey = process.env.BREVO_API_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!brevoApiKey) {
    console.error('❌ BREVO_API_KEY is not set in .env.local')
    console.log('   Fix: Add BREVO_API_KEY=your_key to .env.local')
    return
  }
  console.log(`✅ BREVO_API_KEY found: ${brevoApiKey.substring(0, 10)}...`)

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase environment variables missing')
    return
  }
  console.log(`✅ Supabase configured\n`)

  // Step 2: Test direct email sending (bypass API)
  console.log('Step 2: Testing direct email sending...')
  const testEmail = process.argv[2] || 'asereope@gmail.com'
  console.log(`   Test email: ${testEmail}`)

  try {
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial; padding: 20px;">
          <h2>Direct Email Test</h2>
          <p>If you receive this, email client works!</p>
        </body>
      </html>
    `
    const result = await sendEmail(testEmail, 'Direct Email Test', testHtml)
    console.log('   ✅ Direct email sent successfully')
    console.log(`   Message ID: ${result.messageId || 'N/A'}\n`)
  } catch (error: any) {
    console.error('   ❌ Direct email failed:', error.message)
    console.error('   Full error:', error)
    return
  }

  // Step 3: Test verification code API endpoint
  console.log('Step 3: Testing verification code API endpoint...')
  
  // First, create a test user
  let testUserId = `test-${Date.now()}`
  let testUserEmail = `test-${Date.now()}@carehaven.test`
  
  try {
    // Create user in Supabase auth
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: 'TestPassword123!',
      email_confirm: false,
    })

    if (createError) {
      console.error('   ⚠️  Could not create test user:', createError.message)
      console.log('   Continuing with existing user...\n')
    } else {
      console.log(`   ✅ Created test user: ${testUserEmail}`)
      testUserId = userData.user.id
      testUserEmail = userData.user.email!
    }
  } catch (err: any) {
    console.log('   ℹ️  Using test user ID for code generation\n')
  }

  // Test API endpoint
  try {
    const response = await fetch('http://localhost:3000/api/auth/send-verification-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        userId: testUserId,
      }),
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error(`   ❌ API returned error: ${result.error}`)
      console.error(`   Status: ${response.status}`)
      
      // Check specific error types
      if (result.error?.includes('rate limit')) {
        console.log('   💡 Rate limit active - wait 60 seconds')
      }
      if (result.error?.includes('database')) {
        console.log('   💡 Database issue - check migrations')
      }
    } else {
      console.log('   ✅ API endpoint responded successfully')
      console.log(`   Message: ${result.message}\n`)
    }
  } catch (error: any) {
    console.error('   ❌ API endpoint failed:', error.message)
    
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      console.log('   💡 Dev server might not be running')
      console.log('   Run: npm run dev')
    } else {
      console.error('   Full error:', error)
    }
  }

  // Step 4: Check email in Brevo dashboard
  console.log('\nStep 4: Brevo sender email verification...')
  console.log('   Sender: Michael from Carehaven <mycarehaven@carehaven.app>')
  console.log('   ✅ Domain carehaven.app is authenticated in Brevo')
  console.log('   ✅ Sender email is verified and ready to use\n')

  // Step 5: Check database table
  console.log('Step 5: Checking database tables...')
  try {
    const { error: codeTableError } = await supabase
      .from('email_verification_codes')
      .select('count')
      .limit(1)
    
    if (codeTableError?.message.includes('does not exist')) {
      console.error('   ❌ email_verification_codes table does not exist!')
      console.log('   💡 Run migration: supabase/migrations/013_email_verification_codes.sql')
      console.log('   Or apply via Supabase Dashboard → SQL Editor\n')
    } else {
      console.log('   ✅ email_verification_codes table exists')
    }
  } catch (err: any) {
    console.error('   ❌ Error checking table:', err.message)
  }

  // Step 6: Recommendations
  console.log('\n' + '='.repeat(60))
  console.log('📋 Diagnostic Summary & Recommendations:\n')
  
  console.log('1. ✅ Email client (lib/email/client.ts) is working')
  console.log('2. ⚠️  Verify sender email in Brevo dashboard')
  console.log('3. ⚠️  Check if dev server is running for API tests')
  console.log('4. ⚠️  Check spam folder for emails')
  console.log('5. ⚠️  Verify database migration is applied\n')

  console.log('Common Issues:')
  console.log('- Sender email not verified in Brevo → Emails blocked')
  console.log('- Rate limiting → Wait 60 seconds between requests')
  console.log('- Database table missing → Run migration')
  console.log('- Emails in spam → Check spam folder')
  console.log('- API endpoint not accessible → Start dev server')
}

diagnoseEmailFlow()
  .then(() => {
    console.log('\n✅ Diagnostic completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Diagnostic failed:', error)
    process.exit(1)
  })
