// Test Sign-up and Sign-in Flow
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Generate unique test email (using a more standard format)
const timestamp = Date.now()
const randomId = Math.random().toString(36).substring(2, 8)
const testEmail = `testuser${timestamp}${randomId}@testmail.com`
const testPassword = 'TestPassword123!'

console.log('🧪 Testing Authentication Flow\n')
console.log('Test Email:', testEmail)
console.log('Test Password:', testPassword)
console.log('─'.repeat(50))

async function testSignUp() {
  console.log('\n📝 Testing Sign-Up...')
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback',
      },
    })

    if (error) {
      console.error('❌ Sign-up failed:', error.message)
      return { success: false, error }
    }

    if (data.user) {
      console.log('✅ Sign-up successful!')
      console.log('   User ID:', data.user.id)
      console.log('   Email:', data.user.email)
      console.log('   Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No (needs verification)')
      
      // Check if profile was created automatically
      // Use the session from sign-up to query with proper auth context
      if (data.session) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)

        if (profileError) {
          console.log('⚠️  Error checking profile:', profileError.message)
        } else if (profiles && profiles.length > 0) {
          const profile = profiles[0]
          console.log('✅ Profile created automatically!')
          console.log('   Profile Role:', profile.role)
          console.log('   Profile Completed:', profile.profile_completed)
          console.log('   Profile Email:', profile.email)
        } else {
          console.log('⚠️  Profile not found - trigger may not have executed yet')
          console.log('   This could be due to RLS policies or trigger timing')
        }
      } else {
        console.log('⚠️  No session returned - cannot check profile (email confirmation may be required)')
      }

      return { success: true, user: data.user, session: data.session }
    } else {
      console.error('❌ Sign-up failed: No user data returned')
      return { success: false, error: 'No user data' }
    }
  } catch (err) {
    console.error('❌ Sign-up error:', err.message)
    return { success: false, error: err }
  }
}

async function testSignIn(email, password) {
  console.log('\n🔐 Testing Sign-In...')
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ Sign-in failed:', error.message)
      return { success: false, error }
    }

    if (data.user) {
      console.log('✅ Sign-in successful!')
      console.log('   User ID:', data.user.id)
      console.log('   Email:', data.user.email)
      console.log('   Session:', data.session ? 'Active' : 'None')
      
      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.log('⚠️  Profile not found:', profileError.message)
      } else {
        console.log('✅ Profile found!')
        console.log('   Profile Role:', profile.role)
        console.log('   Profile Completed:', profile.profile_completed)
      }

      return { success: true, user: data.user, session: data.session }
    } else {
      console.error('❌ Sign-in failed: No user data returned')
      return { success: false, error: 'No user data' }
    }
  } catch (err) {
    console.error('❌ Sign-in error:', err.message)
    return { success: false, error: err }
  }
}

async function runTests() {
  // Test 1: Sign Up
  const signUpResult = await testSignUp()
  
  if (!signUpResult.success) {
    console.log('\n❌ Sign-up test failed. Cannot proceed with sign-in test.')
    process.exit(1)
  }

  // Wait a bit for profile trigger to execute
  console.log('\n⏳ Waiting 2 seconds for profile trigger...')
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Test 2: Sign In (only if email is confirmed, or if we can sign in anyway)
  // Note: If email confirmation is required, sign-in will fail until email is verified
  const signInResult = await testSignIn(testEmail, testPassword)

  // Summary
  console.log('\n' + '─'.repeat(50))
  console.log('📊 Test Summary:')
  console.log('   Sign-Up:', signUpResult.success ? '✅ Passed' : '❌ Failed')
  console.log('   Sign-In:', signInResult.success ? '✅ Passed' : '❌ Failed')
  
  if (signInResult.error && signInResult.error.message?.includes('Email not confirmed')) {
    console.log('\n⚠️  Note: Sign-in failed because email confirmation is required.')
    console.log('   This is expected if email confirmation is enabled in Supabase.')
    console.log('   Check your email inbox for the verification link.')
  }

  if (signUpResult.success && signInResult.success) {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  } else {
    console.log('\n❌ Some tests failed')
    process.exit(1)
  }
}

// Run tests
runTests().catch((err) => {
  console.error('❌ Test execution error:', err)
  process.exit(1)
})
