/**
 * Test sign-in script to check for errors
 * Run with: node scripts/test-signin.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignIn() {
  const email = 'asereope@gmail.com'
  const password = 'Michael1998#'

  console.log('🧪 Testing Sign-In\n')
  console.log('='.repeat(60))
  console.log(`Email: ${email}`)
  console.log(`Password: ${'*'.repeat(password.length)}\n`)

  try {
    console.log('📝 Step 1: Attempting sign in...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ Sign-in failed:', error.message)
      console.error('   Error code:', error.status)
      console.error('   Full error:', JSON.stringify(error, null, 2))
      return
    }

    if (!data.session) {
      console.error('❌ No session returned')
      console.log('   Data:', JSON.stringify(data, null, 2))
      return
    }

    console.log('✅ Sign-in successful!')
    console.log(`   User ID: ${data.user.id}`)
    console.log(`   Email: ${data.user.email}`)
    console.log(`   Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`)
    console.log(`   Session exists: ${!!data.session}`)
    console.log(`   Access token: ${data.session.access_token.substring(0, 20)}...`)

    // Check verification token
    console.log('\n📧 Step 2: Checking email verification...')
    const { data: verificationToken, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('id, used, expires_at')
      .eq('user_id', data.user.id)
      .eq('used', true)
      .limit(1)
      .maybeSingle()

    if (tokenError) {
      console.log('   ⚠️  Error checking verification token:', tokenError.message)
    } else if (verificationToken) {
      console.log('   ✅ Custom verification token found (used)')
    } else {
      console.log('   ⚠️  No custom verification token found')
    }

    // Check profile
    console.log('\n👤 Step 3: Checking user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, profile_completed')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('   ❌ Profile error:', profileError.message)
      console.log('   Full error:', JSON.stringify(profileError, null, 2))
    } else if (profile) {
      console.log('   ✅ Profile found')
      console.log(`   Role: ${profile.role}`)
      console.log(`   Profile completed: ${profile.profile_completed ? 'Yes' : 'No'}`)
      
      // Determine redirect path
      let redirectPath = '/patient'
      if (profile.role === 'doctor') {
        redirectPath = '/doctor'
      } else if (profile.role === 'admin') {
        redirectPath = '/admin'
      } else if (profile.role === 'super_admin') {
        redirectPath = '/super-admin'
      }
      console.log(`   Should redirect to: ${redirectPath}`)
    } else {
      console.log('   ⚠️  No profile found')
    }

    // Check if email verification is required
    console.log('\n🔍 Step 4: Verification status...')
    const isVerified = data.user.email_confirmed_at || verificationToken
    if (!isVerified) {
      console.log('   ⚠️  Email not verified - sign-in should be blocked')
      console.log('   Supabase verified:', !!data.user.email_confirmed_at)
      console.log('   Custom verified:', !!verificationToken)
    } else {
      console.log('   ✅ Email is verified')
    }

    console.log('\n' + '='.repeat(60))
    console.log('\n📊 Summary:')
    console.log(`   ✅ Sign-in: ${error ? 'Failed' : 'Success'}`)
    console.log(`   ✅ Session: ${data.session ? 'Created' : 'Missing'}`)
    console.log(`   ✅ Profile: ${profile ? 'Exists' : 'Missing'}`)
    console.log(`   ✅ Verified: ${isVerified ? 'Yes' : 'No'}`)
    
    if (data.session && profile && isVerified) {
      console.log('\n✅ All checks passed! Sign-in should work.')
    } else {
      console.log('\n⚠️  Some checks failed. This might prevent sign-in.')
    }

  } catch (err) {
    console.error('\n❌ Unexpected error:', err.message)
    console.error('   Stack:', err.stack)
  }
}

testSignIn()
  .then(() => {
    console.log('\n✅ Test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
