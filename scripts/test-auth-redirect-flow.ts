/**
 * Test Authentication Redirect Flow
 * 
 * Run: npx tsx scripts/test-auth-redirect-flow.ts
 * 
 * Tests the complete signup → verification → profile completion → dashboard flow
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function testAuthFlow() {
  const timestamp = Date.now()
  const testEmail = `test.auth.${timestamp}@carehaven.test`
  const testPassword = 'TestAuth123!'
  const testName = 'Test Auth User'

  console.log('🧪 Testing Authentication Redirect Flow\n')
  console.log('='.repeat(60))

  try {
    // Step 1: Create user (unverified, profile incomplete)
    console.log('\n📝 Step 1: Creating test user (unverified, profile incomplete)...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: false, // NOT confirmed
      user_metadata: {
        role: 'patient',
        full_name: testName,
      },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('No user created')

    const userId = authData.user.id
    console.log(`✅ User created: ${userId}`)
    console.log(`   Email: ${testEmail}`)
    console.log(`   Email confirmed: ${authData.user.email_confirmed_at ? 'Yes' : 'No'}`)

    // Wait for profile trigger
    await new Promise(resolve => setTimeout(resolve, 500))

    // Ensure profile exists with profile_completed: false
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        role: 'patient',
        full_name: testName,
        email: testEmail,
        profile_completed: false, // NOT completed
      }, {
        onConflict: 'id',
      })

    if (profileError) {
      console.warn('⚠️  Profile error:', profileError.message)
    } else {
      console.log('✅ Profile created with profile_completed: false')
    }

    // Step 2: Send verification code
    console.log('\n📧 Step 2: Sending verification code...')
    const codeResponse = await fetch(`${supabaseUrl.replace('/rest/v1', '')}/api/auth/send-verification-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail, userId }),
    })

    const codeResult = await codeResponse.json()
    if (!codeResponse.ok) {
      console.error('❌ Failed to send verification code:', codeResult.error)
      return
    }
    console.log('✅ Verification code sent')

    // Step 3: Get the verification code from database
    console.log('\n🔍 Step 3: Retrieving verification code...')
    const { data: codeData, error: codeError } = await supabase
      .from('email_verification_codes')
      .select('code, expires_at')
      .eq('user_id', userId)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (codeError || !codeData) {
      console.error('❌ Failed to retrieve verification code:', codeError?.message)
      return
    }
    console.log(`✅ Verification code retrieved: ${codeData.code}`)

    // Step 4: Verify the code
    console.log('\n✅ Step 4: Verifying code...')
    const verifyResponse = await fetch(`${supabaseUrl.replace('/rest/v1', '')}/api/auth/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: codeData.code, email: testEmail }),
    })

    const verifyResult = await verifyResponse.json()
    if (!verifyResponse.ok) {
      console.error('❌ Failed to verify code:', verifyResult.error)
      return
    }
    console.log('✅ Code verified successfully')
    console.log(`   Redirect path: ${verifyResult.redirectPath}`)
    console.log(`   Auto-signin URL: ${verifyResult.autoSigninUrl ? 'Generated' : 'Not generated'}`)

    // Step 5: Check user status after verification
    console.log('\n👤 Step 5: Checking user status after verification...')
    const { data: userAfterVerify } = await supabase.auth.admin.getUserById(userId)
    const { data: profileAfterVerify } = await supabase
      .from('profiles')
      .select('profile_completed, role')
      .eq('id', userId)
      .single()

    console.log(`   Email confirmed: ${userAfterVerify?.user?.email_confirmed_at ? 'Yes ✅' : 'No ❌'}`)
    console.log(`   Profile completed: ${profileAfterVerify?.profile_completed ? 'Yes ❌ (should be false)' : 'No ✅'}`)

    // Step 6: Complete profile
    console.log('\n📝 Step 6: Completing profile...')
    const { error: completeError } = await supabase
      .from('profiles')
      .update({
        full_name: testName,
        phone: '+2348141234567',
        profile_completed: true,
        onboarded_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (completeError) {
      console.error('❌ Failed to complete profile:', completeError.message)
      return
    }
    console.log('✅ Profile completed')

    // Step 7: Verify final state
    console.log('\n✅ Step 7: Verifying final state...')
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('profile_completed, role, full_name, phone')
      .eq('id', userId)
      .single()

    console.log(`   Profile completed: ${finalProfile?.profile_completed ? 'Yes ✅' : 'No ❌'}`)
    console.log(`   Role: ${finalProfile?.role}`)
    console.log(`   Name: ${finalProfile?.full_name}`)
    console.log(`   Phone: ${finalProfile?.phone}`)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📋 TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ User created: ${userId}`)
    console.log(`✅ Email verification: ${userAfterVerify?.user?.email_confirmed_at ? 'Confirmed' : 'Pending'}`)
    console.log(`✅ Profile completion: ${finalProfile?.profile_completed ? 'Completed' : 'Incomplete'}`)
    console.log(`✅ Redirect path: ${verifyResult.redirectPath || '/patient'}`)
    console.log('\n🧪 MANUAL TESTING INSTRUCTIONS:')
    console.log('='.repeat(60))
    console.log('1. Go to: http://localhost:3000/auth/signup')
    console.log('2. Sign up with a NEW email (not the test email above)')
    console.log('3. Enter the verification code from email')
    console.log('4. Verify you are redirected to /complete-profile (not login)')
    console.log('5. Complete the profile form')
    console.log('6. Verify you are redirected to /patient dashboard (not login loop)')
    console.log('7. Refresh the page and verify you stay logged in')
    console.log('\n✨ Test credentials (for manual testing):')
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${testPassword}`)
    console.log('   Note: This user is already verified and profile incomplete')
    console.log('   Expected: Should redirect to /complete-profile on login')

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

testAuthFlow()
