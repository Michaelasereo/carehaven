/**
 * Diagnostic Test Script for Doctor Enrollment
 * 
 * Tests email existence, signup errors, and complete enrollment flow
 * 
 * Usage:
 *   npx tsx scripts/test-doctor-enrollment-diagnostic.ts <email-to-test>
 * 
 * Example:
 *   npx tsx scripts/test-doctor-enrollment-diagnostic.ts test@example.com
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

interface TestResult {
  test: string
  passed: boolean
  message: string
  details?: any
}

const results: TestResult[] = []

function logResult(test: string, passed: boolean, message: string, details?: any) {
  results.push({ test, passed, message, details })
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${test}: ${message}`)
  if (details && !passed) {
    console.log(`   Details:`, JSON.stringify(details, null, 2))
  }
}

async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      throw error
    }
    
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    return !!user
  } catch (error: any) {
    console.error('Error checking email:', error)
    return false
  }
}

async function testEmailExistence(email: string) {
  console.log('\n📧 Testing Email Existence Check...')
  
  const exists = await checkEmailExists(email)
  
  if (exists) {
    logResult(
      'Email Existence Check',
      true,
      `Email "${email}" exists in database`,
      { email, exists: true }
    )
    
    // Get user details
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (user) {
      console.log(`   User ID: ${user.id}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
      
      // Check profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        console.log(`   Profile Role: ${profile.role}`)
        console.log(`   Profile Completed: ${profile.profile_completed}`)
      } else {
        console.log(`   ⚠️  No profile found for this user`)
      }
    }
  } else {
    logResult(
      'Email Existence Check',
      true,
      `Email "${email}" does not exist in database`,
      { email, exists: false }
    )
  }
}

async function testSignupWithExistingEmail(email: string) {
  console.log('\n🔍 Testing Signup with Existing Email...')
  
  const testPassword = 'Test123!@#'
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: testPassword,
    })
    
    if (error) {
      // Capture full error details
      const errorDetails = {
        message: error.message,
        status: error.status,
        code: (error as any).code,
        name: error.name,
        fullError: error,
      }
      
      logResult(
        'Signup with Existing Email',
        true,
        'Correctly rejected signup (expected behavior)',
        errorDetails
      )
      
      console.log(`   Error Message: ${error.message}`)
      console.log(`   Error Status: ${error.status}`)
      console.log(`   Error Code: ${(error as any).code || 'N/A'}`)
      
      // Check if error detection logic would catch this
      const wouldCatchByCode = (error as any).code === 'user_already_exists' || error.status === 422
      const wouldCatchByMessage = 
        error.message.includes('already registered') ||
        error.message.includes('already exists') ||
        error.message.includes('User already registered')
      
      console.log(`   Would catch by code check: ${wouldCatchByCode ? '✅' : '❌'}`)
      console.log(`   Would catch by message check: ${wouldCatchByMessage ? '✅' : '❌'}`)
      
      if (!wouldCatchByCode && !wouldCatchByMessage) {
        logResult(
          'Error Detection Coverage',
          false,
          'Current error detection logic would NOT catch this error',
          { errorDetails, wouldCatchByCode, wouldCatchByMessage }
        )
      }
    } else {
      logResult(
        'Signup with Existing Email',
        false,
        'Signup succeeded when it should have failed',
        { data }
      )
    }
  } catch (error: any) {
    logResult(
      'Signup with Existing Email',
      false,
      'Unexpected error during signup test',
      { error: error.message, stack: error.stack }
    )
  }
}

async function testSignupWithNewEmail() {
  console.log('\n🆕 Testing Signup with New Email...')
  
  const testEmail = `test-doctor-${Date.now()}@example.com`
  const testPassword = 'Test123!@#'
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'doctor',
          full_name: 'Test Doctor',
        },
      },
    })
    
    if (error) {
      logResult(
        'Signup with New Email',
        false,
        `Signup failed: ${error.message}`,
        { error, testEmail }
      )
    } else if (data.user) {
      logResult(
        'Signup with New Email',
        true,
        `Successfully created user: ${testEmail}`,
        { userId: data.user.id, email: testEmail }
      )
      
      // Test profile creation
      await testProfileCreation(data.user.id)
      
      // Cleanup
      await cleanupTestUser(testEmail)
    } else {
      logResult(
        'Signup with New Email',
        false,
        'Signup returned no error but also no user',
        { data }
      )
    }
  } catch (error: any) {
    logResult(
      'Signup with New Email',
      false,
      'Unexpected error during signup test',
      { error: error.message }
    )
  }
}

async function testProfileCreation(userId: string) {
  console.log('\n👤 Testing Profile Creation...')
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      logResult(
        'Profile Creation',
        false,
        `Profile not found or error: ${error.message}`,
        { error, userId }
      )
    } else if (profile) {
      logResult(
        'Profile Creation',
        true,
        'Profile exists for user',
        { profile }
      )
    } else {
      logResult(
        'Profile Creation',
        false,
        'Profile not found',
        { userId }
      )
    }
  } catch (error: any) {
    logResult(
      'Profile Creation',
      false,
      'Error checking profile',
      { error: error.message }
    )
  }
}

async function testVerificationCodeFlow(email: string) {
  console.log('\n🔐 Testing Verification Code Flow...')
  
  // Check if user exists
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  
  if (!user) {
    logResult(
      'Verification Code Flow',
      false,
      'User does not exist, cannot test verification flow',
      { email }
    )
    return
  }
  
  try {
    // Test sending verification code
    const response = await fetch('http://localhost:3000/api/auth/send-verification-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userId: user.id }),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      logResult(
        'Send Verification Code',
        false,
        `Failed to send code: ${result.error}`,
        { response, result }
      )
      return
    }
    
    logResult(
      'Send Verification Code',
      true,
      'Verification code sent successfully',
      { email }
    )
    
    // Check if code was stored
    const { data: codes, error: codeError } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (codeError) {
      logResult(
        'Verification Code Storage',
        false,
        `Error checking code storage: ${codeError.message}`,
        { codeError }
      )
    } else if (codes && codes.length > 0) {
      const code = codes[0]
      logResult(
        'Verification Code Storage',
        true,
        'Code stored in database',
        { 
          codeId: code.id,
          expiresAt: code.expires_at,
          used: code.used 
        }
      )
      
      // Note: We don't actually verify the code here to avoid marking it as used
      // That would be tested in the E2E journey test
    } else {
      logResult(
        'Verification Code Storage',
        false,
        'Code not found in database',
        { email, userId: user.id }
      )
    }
  } catch (error: any) {
    logResult(
      'Verification Code Flow',
      false,
      `Error testing verification flow: ${error.message}`,
      { error }
    )
  }
}

async function testDashboardRedirect(userId: string) {
  console.log('\n📍 Testing Dashboard Redirect...')
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error) {
      logResult(
        'Dashboard Redirect',
        false,
        `Error fetching profile: ${error.message}`,
        { error }
      )
      return
    }
    
    let expectedPath = '/patient'
    if (profile?.role === 'doctor') {
      expectedPath = '/doctor/dashboard'
    } else if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      expectedPath = '/admin/dashboard'
    }
    
    logResult(
      'Dashboard Redirect',
      true,
      `Expected redirect path: ${expectedPath}`,
      { role: profile?.role, expectedPath }
    )
  } catch (error: any) {
    logResult(
      'Dashboard Redirect',
      false,
      `Error testing redirect: ${error.message}`,
      { error }
    )
  }
}

async function cleanupTestUser(email: string) {
  try {
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (user) {
      // Try cascade delete function first
      const { error: cascadeError } = await supabase.rpc('delete_user_cascade', {
        target_user_id: user.id
      })
      
      if (cascadeError) {
        // Fallback to admin API
        await supabase.auth.admin.deleteUser(user.id)
      }
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

async function main() {
  const emailToTest = process.argv[2]
  
  if (!emailToTest) {
    console.error('❌ Please provide an email address to test')
    console.error('   Usage: npx tsx scripts/test-doctor-enrollment-diagnostic.ts <email>')
    process.exit(1)
  }
  
  console.log('🧪 Doctor Enrollment Diagnostic Test')
  console.log('='.repeat(60))
  console.log(`📧 Testing with email: ${emailToTest}`)
  console.log('='.repeat(60))
  
  // Run all tests
  await testEmailExistence(emailToTest)
  await testSignupWithExistingEmail(emailToTest)
  await testSignupWithNewEmail()
  
  // Test verification flow if user exists
  const exists = await checkEmailExists(emailToTest)
  if (exists) {
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const user = users.find(u => u.email?.toLowerCase() === emailToTest.toLowerCase())
    if (user) {
      await testVerificationCodeFlow(emailToTest)
      await testDashboardRedirect(user.id)
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Test Summary')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Total: ${results.length}`)
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.test}: ${r.message}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
