/**
 * Test script for signup and email verification flow
 * Run with: node scripts/test-signup-email.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Get test email from command line argument or use default
// Usage: node scripts/test-signup-email.js your-email@example.com
const testEmail = process.argv[2] || `test-${Date.now()}@gmail.com`
const testPassword = 'Test1234!@#$'

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(testEmail)) {
  console.error('❌ Invalid email format:', testEmail)
  console.error('   Usage: node scripts/test-signup-email.js your-email@example.com')
  process.exit(1)
}

if (testEmail.includes('@example.com')) {
  console.error('❌ Supabase rejects @example.com domain')
  console.error('   Please use a real email address like Gmail, Yahoo, etc.')
  console.error('   Usage: node scripts/test-signup-email.js your-email@gmail.com')
  process.exit(1)
}

async function testSignup() {
  console.log('🧪 Testing Signup and Email Verification Flow\n')
  console.log('=' .repeat(60))
  
  try {
    // Step 1: Sign up
    console.log('\n📝 Step 1: Signing up user...')
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${testPassword}`)
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback',
      },
    })

    if (error) {
      console.error('❌ Signup failed:', error.message)
      return
    }

    if (!data.user) {
      console.error('❌ No user data returned')
      return
    }

    console.log('✅ Signup successful!')
    console.log(`   User ID: ${data.user.id}`)
    console.log(`   Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`)
    console.log(`   Session: ${data.session ? 'Created (auto-confirmed)' : 'None (email verification required)'}`)

    // Step 2: Test custom email sending
    console.log('\n📧 Step 2: Sending verification email via Brevo...')
    
    const emailResponse = await fetch('http://localhost:3000/api/auth/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    })

    const emailResult = await emailResponse.json()

    if (!emailResponse.ok) {
      console.error('❌ Failed to send verification email:', emailResult.error)
      console.error('   Details:', emailResult.details || 'No details')
      return
    }

    console.log('✅ Verification email sent!')
    console.log('   Message:', emailResult.message)

    // Step 3: Check token in database
    console.log('\n🔍 Step 3: Checking verification token in database...')
    
    const { createClient: createAdminClient } = require('@supabase/supabase-js')
    const adminSupabase = createAdminClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: tokens, error: tokenError } = await adminSupabase
      .from('email_verification_tokens')
      .select('*')
      .eq('user_id', data.user.id)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (tokenError) {
      console.error('❌ Error checking tokens:', tokenError.message)
      console.log('   Note: This might be expected if the table doesn\'t exist yet')
    } else if (tokens && tokens.length > 0) {
      const token = tokens[0]
      console.log('✅ Token found in database!')
      console.log(`   Token ID: ${token.id}`)
      console.log(`   Expires at: ${new Date(token.expires_at).toLocaleString()}`)
      console.log(`   Used: ${token.used}`)
      
      // Step 4: Test verification
      console.log('\n🔐 Step 4: Testing email verification...')
      console.log(`   Verification URL: http://localhost:3000/api/auth/verify-email?token=${token.token}&email=${encodeURIComponent(testEmail)}`)
      console.log('   ⚠️  You can manually test this URL in your browser')
    } else {
      console.log('⚠️  No active tokens found (this might be expected)')
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('\n📊 Test Summary:')
    console.log('   ✅ User created successfully')
    console.log('   ✅ Verification email sent via Brevo')
    console.log('   📧 Check your email inbox (and spam folder)')
    console.log(`   📧 Email sent to: ${testEmail}`)
    console.log('\n💡 Next steps:')
    console.log('   1. Check your email inbox for the verification email')
    console.log('   2. Click the verification link')
    console.log('   3. You should be redirected to the sign-in page')
    console.log('\n🧹 Cleanup:')
    console.log(`   To delete this test user, run:`)
    console.log(`   DELETE FROM auth.users WHERE email = '${testEmail}';`)
    console.log(`   (In Supabase Dashboard → SQL Editor)`)

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message)
    console.error('   Stack:', error.stack)
  }
}

// Run the test
testSignup()
  .then(() => {
    console.log('\n✅ Test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
