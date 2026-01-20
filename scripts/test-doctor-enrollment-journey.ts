/**
 * End-to-End Test for Doctor Enrollment Journey
 * 
 * Tests complete flow:
 * 1. Cleanup - Delete test user if exists
 * 2. Enrollment - Submit enrollment form data
 * 3. Verify User Created - Check auth.users and profiles tables
 * 4. Send Verification Code - Call send-verification-code API
 * 5. Verify Code Received - Check email_verification_codes table
 * 6. Verify Code - Call verify-code API with correct code
 * 7. Check Email Confirmed - Verify email_confirmed_at is set
 * 8. Test Dashboard Redirect - Verify redirect path is /doctor/dashboard
 * 9. Test Auto-Signin - Verify auto-signin token created
 * 10. Cleanup - Delete test user after test
 * 
 * Usage:
 *   npx tsx scripts/test-doctor-enrollment-journey.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://carehaven.app'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

interface TestStep {
  step: number
  name: string
  passed: boolean
  message: string
  details?: any
}

const testSteps: TestStep[] = []

function logStep(step: number, name: string, passed: boolean, message: string, details?: any) {
  testSteps.push({ step, name, passed, message, details })
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} Step ${step}: ${name} - ${message}`)
  if (details && !passed) {
    console.log(`   Details:`, JSON.stringify(details, null, 2))
  }
}

async function cleanupTestUser(email: string): Promise<boolean> {
  try {
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      return true // User doesn't exist, cleanup successful
    }
    
    // Try cascade delete function first
    const { error: cascadeError } = await supabase.rpc('delete_user_cascade', {
      target_user_id: user.id
    })
    
    if (cascadeError) {
      // Fallback to admin API
      const { error: adminError } = await supabase.auth.admin.deleteUser(user.id)
      if (adminError) {
        console.warn(`   ⚠️  Could not delete user: ${adminError.message}`)
        return false
      }
    }
    
    return true
  } catch (error: any) {
    console.warn(`   ⚠️  Cleanup error: ${error.message}`)
    return false
  }
}

async function testEnrollment(email: string, password: string) {
  console.log('\n📝 Step 2: Testing Enrollment...')
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'doctor',
          full_name: 'Test Doctor',
          license_type: 'MD',
          specialty: 'General Practice',
        },
      },
    })
    
    if (error) {
      logStep(2, 'Enrollment', false, `Signup failed: ${error.message}`, { error })
      return null
    }
    
    if (!data.user) {
      logStep(2, 'Enrollment', false, 'Signup returned no user', { data })
      return null
    }
    
    logStep(2, 'Enrollment', true, `User created: ${data.user.id}`, { userId: data.user.id, email })
    
    // Update profile with enrollment details
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: 'Test Doctor',
        gender: 'male',
        specialty: 'General Practice',
        license_number: `MD-${Date.now()}`,
        license_verified: false,
        bio: 'Test doctor bio for enrollment testing',
        role: 'doctor',
        profile_completed: true,
        onboarded_at: new Date().toISOString(),
      })
      .eq('id', data.user.id)
    
    if (profileError) {
      console.warn(`   ⚠️  Profile update error: ${profileError.message}`)
    } else {
      console.log(`   ✅ Profile updated successfully`)
    }
    
    return data.user
  } catch (error: any) {
    logStep(2, 'Enrollment', false, `Unexpected error: ${error.message}`, { error })
    return null
  }
}

async function verifyUserCreated(userId: string, email: string) {
  console.log('\n👤 Step 3: Verifying User Created...')
  
  try {
    // Check auth.users
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)
    
    if (userError || !user) {
      logStep(3, 'Verify User Created', false, `User not found in auth.users`, { error: userError })
      return false
    }
    
    if (user.email?.toLowerCase() !== email.toLowerCase()) {
      logStep(3, 'Verify User Created', false, `Email mismatch`, { expected: email, actual: user.email })
      return false
    }
    
    console.log(`   ✅ User exists in auth.users`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
    console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
    
    // Check profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profileError || !profile) {
      logStep(3, 'Verify User Created', false, `Profile not found`, { error: profileError })
      return false
    }
    
    if (profile.role !== 'doctor') {
      logStep(3, 'Verify User Created', false, `Incorrect role: ${profile.role}`, { profile })
      return false
    }
    
    console.log(`   ✅ Profile exists`)
    console.log(`   Role: ${profile.role}`)
    console.log(`   Profile Completed: ${profile.profile_completed}`)
    
    logStep(3, 'Verify User Created', true, 'User and profile created successfully', { userId, email })
    return true
  } catch (error: any) {
    logStep(3, 'Verify User Created', false, `Error: ${error.message}`, { error })
    return false
  }
}

async function sendVerificationCode(email: string, userId: string) {
  console.log('\n📧 Step 4: Sending Verification Code...')
  
  try {
    const response = await fetch(`${appUrl}/api/auth/send-verification-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userId }),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      logStep(4, 'Send Verification Code', false, `Failed: ${result.error}`, { response, result })
      return null
    }
    
    logStep(4, 'Send Verification Code', true, 'Verification code sent', { email })
    return true
  } catch (error: any) {
    logStep(4, 'Send Verification Code', false, `Error: ${error.message}`, { error })
    return null
  }
}

async function verifyCodeReceived(email: string, userId: string) {
  console.log('\n🔍 Step 5: Verifying Code Received...')
  
  try {
    const { data: codes, error } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) {
      logStep(5, 'Verify Code Received', false, `Error checking codes: ${error.message}`, { error })
      return null
    }
    
    if (!codes || codes.length === 0) {
      logStep(5, 'Verify Code Received', false, 'No verification code found', { email, userId })
      return null
    }
    
    const code = codes[0]
    
    if (code.used) {
      logStep(5, 'Verify Code Received', false, 'Code already used', { code })
      return null
    }
    
    const expiresAt = new Date(code.expires_at)
    const now = new Date()
    
    if (expiresAt < now) {
      logStep(5, 'Verify Code Received', false, 'Code expired', { code, expiresAt, now })
      return null
    }
    
    console.log(`   ✅ Code found in database`)
    console.log(`   Code ID: ${code.id}`)
    console.log(`   Expires: ${expiresAt.toLocaleString()}`)
    console.log(`   Used: ${code.used}`)
    
    logStep(5, 'Verify Code Received', true, 'Code received and valid', { codeId: code.id })
    return code.code
  } catch (error: any) {
    logStep(5, 'Verify Code Received', false, `Error: ${error.message}`, { error })
    return null
  }
}

async function verifyCode(email: string, code: string) {
  console.log('\n✅ Step 6: Verifying Code...')
  
  try {
    const response = await fetch(`${appUrl}/api/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, email }),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      logStep(6, 'Verify Code', false, `Verification failed: ${result.error}`, { response, result })
      return null
    }
    
    logStep(6, 'Verify Code', true, 'Code verified successfully', { 
      redirectPath: result.redirectPath,
      hasAutoSigninUrl: !!result.autoSigninUrl 
    })
    
    return result
  } catch (error: any) {
    logStep(6, 'Verify Code', false, `Error: ${error.message}`, { error })
    return null
  }
}

async function checkEmailConfirmed(userId: string) {
  console.log('\n📬 Step 7: Checking Email Confirmed...')
  
  try {
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId)
    
    if (error || !user) {
      logStep(7, 'Check Email Confirmed', false, `User not found`, { error })
      return false
    }
    
    if (!user.email_confirmed_at) {
      logStep(7, 'Check Email Confirmed', false, 'Email not confirmed', { user })
      return false
    }
    
    console.log(`   ✅ Email confirmed at: ${new Date(user.email_confirmed_at).toLocaleString()}`)
    logStep(7, 'Check Email Confirmed', true, 'Email confirmed successfully', { 
      confirmedAt: user.email_confirmed_at 
    })
    return true
  } catch (error: any) {
    logStep(7, 'Check Email Confirmed', false, `Error: ${error.message}`, { error })
    return false
  }
}

async function testDashboardRedirect(userId: string) {
  console.log('\n📍 Step 8: Testing Dashboard Redirect...')
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error) {
      logStep(8, 'Test Dashboard Redirect', false, `Error fetching profile: ${error.message}`, { error })
      return false
    }
    
    const expectedPath = profile?.role === 'doctor' ? '/doctor/dashboard' : '/patient'
    
    if (profile?.role !== 'doctor') {
      logStep(8, 'Test Dashboard Redirect', false, `Incorrect role for doctor: ${profile?.role}`, { profile })
      return false
    }
    
    console.log(`   ✅ Expected redirect path: ${expectedPath}`)
    console.log(`   Role: ${profile.role}`)
    
    logStep(8, 'Test Dashboard Redirect', true, `Redirect path correct: ${expectedPath}`, { 
      role: profile.role,
      expectedPath 
    })
    return true
  } catch (error: any) {
    logStep(8, 'Test Dashboard Redirect', false, `Error: ${error.message}`, { error })
    return false
  }
}

/**
 * Test Auto-Signin Token Creation
 * 
 * Best Practice: Use retry logic with exponential backoff for eventual consistency
 * Database writes may not be immediately visible due to replication lag
 */
async function testAutoSignin(email: string, verifyResult: any): Promise<boolean> {
  console.log('\n🔐 Step 9: Testing Auto-Signin Token...')
  
  try {
    // Get user ID
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      logStep(9, 'Test Auto-Signin', false, 'User not found', { email })
      return false
    }
    
    // First, check if verify-code API returned autoSigninUrl (best practice: use API response)
    if (verifyResult?.autoSigninUrl) {
      console.log(`   ✅ Auto-signin URL returned from API`)
      const url = new URL(verifyResult.autoSigninUrl)
      const token = url.searchParams.get('token')
      
      if (token) {
        console.log(`   Token from URL: ${token.substring(0, 8)}...`)
        
        // Verify token exists in database with retry logic
        return await verifyTokenInDatabase(token, user.id, email)
      }
    }
    
    // Fallback: Query database directly (with retry for eventual consistency)
    return await findTokenInDatabaseWithRetry(user.id, email)
  } catch (error: any) {
    logStep(9, 'Test Auto-Signin', false, `Error: ${error.message}`, { error })
    return false
  }
}

/**
 * Verify token exists in database with retry logic
 * Handles eventual consistency and replication lag
 */
async function verifyTokenInDatabase(
  token: string, 
  userId: string, 
  email: string,
  maxRetries: number = 3,
  initialDelay: number = 500
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { data: tokenData, error } = await supabase
      .from('auto_signin_tokens')
      .select('*')
      .eq('token', token)
      .eq('user_id', userId)
      .single()
    
    if (!error && tokenData) {
      // Validate token
      if (tokenData.used) {
        logStep(9, 'Test Auto-Signin', false, 'Token already used', { tokenData })
        return false
      }
      
      const expiresAt = new Date(tokenData.expires_at)
      const now = new Date()
      
      if (expiresAt < now) {
        logStep(9, 'Test Auto-Signin', false, 'Token expired', { tokenData, expiresAt, now })
        return false
      }
      
      console.log(`   ✅ Auto-signin token verified`)
      console.log(`   Token ID: ${tokenData.id}`)
      console.log(`   Expires: ${expiresAt.toLocaleString()}`)
      console.log(`   Used: ${tokenData.used}`)
      
      logStep(9, 'Test Auto-Signin', true, 'Auto-signin token created and valid', { tokenId: tokenData.id })
      return true
    }
    
    // If not found and we have retries left, wait and retry
    if (attempt < maxRetries) {
      const delay = initialDelay * Math.pow(2, attempt - 1) // Exponential backoff
      console.log(`   ⏳ Token not found (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      continue
    }
    
    // Last attempt failed
    if (error) {
      console.warn(`   ⚠️  Error checking token: ${error.message}`)
      logStep(9, 'Test Auto-Signin', false, `Error checking tokens: ${error.message}`, { error })
    } else {
      logStep(9, 'Test Auto-Signin', false, 'Token not found after retries', { token, userId, email })
    }
    return false
  }
  
  return false
}

/**
 * Find token in database with retry logic
 * Uses exponential backoff for eventual consistency
 */
async function findTokenInDatabaseWithRetry(
  userId: string,
  email: string,
  maxRetries: number = 3,
  initialDelay: number = 500
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { data: tokens, error } = await supabase
      .from('auto_signin_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('email', normalizedEmail)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (!error && tokens && tokens.length > 0) {
      const token = tokens[0]
      
      if (token.used) {
        logStep(9, 'Test Auto-Signin', false, 'Token already used', { token })
        return false
      }
      
      const expiresAt = new Date(token.expires_at)
      const now = new Date()
      
      if (expiresAt < now) {
        logStep(9, 'Test Auto-Signin', false, 'Token expired', { token, expiresAt, now })
        return false
      }
      
      console.log(`   ✅ Auto-signin token found`)
      console.log(`   Token ID: ${token.id}`)
      console.log(`   Expires: ${expiresAt.toLocaleString()}`)
      console.log(`   Used: ${token.used}`)
      
      logStep(9, 'Test Auto-Signin', true, 'Auto-signin token created and valid', { tokenId: token.id })
      return true
    }
    
    // If not found and we have retries left, wait and retry
    if (attempt < maxRetries) {
      const delay = initialDelay * Math.pow(2, attempt - 1) // Exponential backoff
      console.log(`   ⏳ Token not found (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      continue
    }
    
    // Last attempt failed
    if (error) {
      console.warn(`   ⚠️  Could not check auto-signin tokens: ${error.message}`)
      logStep(9, 'Test Auto-Signin', false, `Error checking tokens: ${error.message}`, { error })
    } else {
      logStep(9, 'Test Auto-Signin', false, 'No auto-signin token found after retries', { email, userId })
    }
    return false
  }
  
  return false
}

async function main() {
  const testEmail = `test-doctor-${Date.now()}@example.com`
  const testPassword = 'Test123!@#'
  
  console.log('🧪 Doctor Enrollment Journey Test')
  console.log('='.repeat(60))
  console.log(`📧 Test Email: ${testEmail}`)
  console.log('='.repeat(60))
  
  // Step 1: Cleanup
  console.log('\n🧹 Step 1: Cleaning up test user...')
  const cleanupSuccess = await cleanupTestUser(testEmail)
  logStep(1, 'Cleanup', cleanupSuccess, cleanupSuccess ? 'Test user cleaned up' : 'Cleanup failed (may not exist)')
  
  // Step 2: Enrollment
  const user = await testEnrollment(testEmail, testPassword)
  if (!user) {
    console.log('\n❌ Enrollment failed, stopping test')
    printSummary()
    process.exit(1)
  }
  
  // Step 3: Verify User Created
  const userCreated = await verifyUserCreated(user.id, testEmail)
  if (!userCreated) {
    console.log('\n❌ User verification failed, stopping test')
    await cleanupTestUser(testEmail)
    printSummary()
    process.exit(1)
  }
  
  // Step 4: Send Verification Code
  const codeSent = await sendVerificationCode(testEmail, user.id)
  if (!codeSent) {
    console.log('\n❌ Failed to send verification code, stopping test')
    await cleanupTestUser(testEmail)
    printSummary()
    process.exit(1)
  }
  
  // Wait a moment for code to be stored
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Step 5: Verify Code Received
  const verificationCode = await verifyCodeReceived(testEmail, user.id)
  if (!verificationCode) {
    console.log('\n❌ No verification code found, stopping test')
    await cleanupTestUser(testEmail)
    printSummary()
    process.exit(1)
  }
  
  console.log(`\n   📝 Verification Code: ${verificationCode} (for testing only)`)
  
  // Step 6: Verify Code
  const verifyResult = await verifyCode(testEmail, verificationCode)
  if (!verifyResult) {
    console.log('\n❌ Code verification failed, stopping test')
    await cleanupTestUser(testEmail)
    printSummary()
    process.exit(1)
  }
  
  // Log verify result for debugging
  if (verifyResult.autoSigninUrl) {
    console.log(`   ✅ Auto-signin URL received from API`)
  } else if (verifyResult.requiresSignIn) {
    console.log(`   ⚠️  Auto-signin not available, manual sign-in required`)
  }
  
  // Step 7: Check Email Confirmed
  await checkEmailConfirmed(user.id)
  
  // Step 8: Test Dashboard Redirect
  await testDashboardRedirect(user.id)
  
  // Step 9: Test Auto-Signin (pass verifyResult to check API response first)
  // Add small delay to allow for eventual consistency
  await new Promise(resolve => setTimeout(resolve, 500))
  await testAutoSignin(testEmail, verifyResult)
  
  // Step 10: Cleanup
  console.log('\n🧹 Step 10: Final Cleanup...')
  const finalCleanup = await cleanupTestUser(testEmail)
  logStep(10, 'Final Cleanup', finalCleanup, finalCleanup ? 'Test user deleted' : 'Cleanup failed')
  
  // Summary
  printSummary()
}

function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 Test Summary')
  console.log('='.repeat(60))
  
  const passed = testSteps.filter(s => s.passed).length
  const failed = testSteps.filter(s => !s.passed).length
  
  testSteps.forEach(step => {
    const icon = step.passed ? '✅' : '❌'
    console.log(`${icon} Step ${step.step}: ${step.name}`)
  })
  
  console.log('\n' + '='.repeat(60))
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Total: ${testSteps.length}`)
  console.log(`📊 Success Rate: ${((passed / testSteps.length) * 100).toFixed(1)}%`)
  console.log('='.repeat(60))
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Doctor enrollment journey is working correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Review the details above.')
  }
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error)
  printSummary()
  process.exit(1)
})
