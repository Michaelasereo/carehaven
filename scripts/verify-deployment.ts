#!/usr/bin/env tsx
/**
 * Pre-Deployment Verification Script
 * 
 * This script helps verify critical functionality before deploying to production.
 * Run with: npx tsx scripts/verify-deployment.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60))
  log(title, 'cyan')
  console.log('='.repeat(60))
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green')
}

function logError(message: string) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'blue')
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  logError('Missing Supabase environment variables!')
  logInfo('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface VerificationResult {
  name: string
  passed: boolean
  message: string
  details?: string
}

const results: VerificationResult[] = []

async function verifyEnvironmentVariables(): Promise<VerificationResult> {
  logSection('1. Environment Variables Check')
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'BREVO_API_KEY',
    'PAYSTACK_SECRET_KEY',
    'DAILY_API_KEY',
  ]

  const missing: string[] = []
  const present: string[] = []

  for (const key of required) {
    if (process.env[key]) {
      present.push(key)
      logSuccess(`${key} is set`)
    } else {
      missing.push(key)
      logError(`${key} is missing`)
    }
  }

  return {
    name: 'Environment Variables',
    passed: missing.length === 0,
    message: missing.length === 0 
      ? 'All required environment variables are set'
      : `Missing ${missing.length} environment variable(s)`,
    details: missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined,
  }
}

async function verifyDatabaseConnection(): Promise<VerificationResult> {
  logSection('2. Database Connection Check')
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single()

    if (error) {
      logError(`Database connection failed: ${error.message}`)
      return {
        name: 'Database Connection',
        passed: false,
        message: `Connection failed: ${error.message}`,
      }
    }

    logSuccess('Database connection successful')
    return {
      name: 'Database Connection',
      passed: true,
      message: 'Successfully connected to Supabase',
    }
  } catch (error: any) {
    logError(`Database connection error: ${error.message}`)
    return {
      name: 'Database Connection',
      passed: false,
      message: `Error: ${error.message}`,
    }
  }
}

async function verifyDatabaseTables(): Promise<VerificationResult> {
  logSection('3. Database Tables Check')
  
  const requiredTables = [
    'profiles',
    'appointments',
    'doctor_availability',
    'email_verification_codes',
    'system_settings',
    'notifications',
    'audit_logs',
  ]

  const missing: string[] = []
  const present: string[] = []

  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        if (error.code === '42P01') { // Table does not exist
          missing.push(table)
          logError(`Table '${table}' does not exist`)
        } else {
          // Table exists but might have permission issues
          present.push(table)
          logWarning(`Table '${table}' exists but has issues: ${error.message}`)
        }
      } else {
        present.push(table)
        logSuccess(`Table '${table}' exists and is accessible`)
      }
    } catch (error: any) {
      missing.push(table)
      logError(`Error checking table '${table}': ${error.message}`)
    }
  }

  return {
    name: 'Database Tables',
    passed: missing.length === 0,
    message: missing.length === 0
      ? 'All required tables exist'
      : `${missing.length} table(s) missing`,
    details: missing.length > 0 ? `Missing: ${missing.join(', ')}` : undefined,
  }
}

async function verifyRLSPolicies(): Promise<VerificationResult> {
  logSection('4. RLS Policies Check')
  
  logInfo('Checking RLS policies (this is a basic check)')
  logWarning('Full RLS policy verification requires manual testing')
  
  // Check if we can read from profiles (basic RLS check)
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error && error.message.includes('permission denied')) {
      logError('RLS policies may be blocking access')
      return {
        name: 'RLS Policies',
        passed: false,
        message: 'RLS policies may be too restrictive',
      }
    }

    logSuccess('Basic RLS check passed (using service role key)')
    logWarning('Remember: RLS policies should be tested with anon key in production')
    
    return {
      name: 'RLS Policies',
      passed: true,
      message: 'Basic RLS check passed',
      details: 'Full RLS testing requires manual verification with anon key',
    }
  } catch (error: any) {
    logError(`RLS check error: ${error.message}`)
    return {
      name: 'RLS Policies',
      passed: false,
      message: `Error: ${error.message}`,
    }
  }
}

async function verifyEmailService(): Promise<VerificationResult> {
  logSection('5. Email Service Check (Brevo)')
  
  if (!process.env.BREVO_API_KEY) {
    logError('BREVO_API_KEY not configured')
    return {
      name: 'Email Service',
      passed: false,
      message: 'BREVO_API_KEY not configured',
    }
  }

  logSuccess('BREVO_API_KEY is configured')
  logWarning('Email sending functionality requires manual testing')
  logInfo('Test by signing up a new user and checking for verification code email')
  
  return {
    name: 'Email Service',
    passed: true,
    message: 'Brevo API key is configured',
    details: 'Email sending requires manual testing',
  }
}

async function verifyPaymentService(): Promise<VerificationResult> {
  logSection('6. Payment Service Check (Paystack)')
  
  if (!process.env.PAYSTACK_SECRET_KEY) {
    logError('PAYSTACK_SECRET_KEY not configured')
    return {
      name: 'Payment Service',
      passed: false,
      message: 'PAYSTACK_SECRET_KEY not configured',
    }
  }

  const isTestKey = process.env.PAYSTACK_SECRET_KEY.startsWith('sk_test_')
  const isLiveKey = process.env.PAYSTACK_SECRET_KEY.startsWith('sk_live_')

  if (!isTestKey && !isLiveKey) {
    logError('Invalid Paystack key format')
    return {
      name: 'Payment Service',
      passed: false,
      message: 'Invalid Paystack key format',
    }
  }

  if (isTestKey) {
    logWarning('Using Paystack TEST key (use LIVE key for production)')
  } else {
    logSuccess('Using Paystack LIVE key')
  }

  logInfo('Payment functionality requires manual testing')
  logInfo('Test by booking an appointment and completing payment')
  
  return {
    name: 'Payment Service',
    passed: true,
    message: isTestKey ? 'Paystack test key configured' : 'Paystack live key configured',
    details: isTestKey ? 'Switch to live key for production' : undefined,
  }
}

async function verifyVideoService(): Promise<VerificationResult> {
  logSection('7. Video Service Check (Daily.co)')
  
  if (!process.env.DAILY_API_KEY) {
    logError('DAILY_API_KEY not configured')
    return {
      name: 'Video Service',
      passed: false,
      message: 'DAILY_API_KEY not configured',
    }
  }

  logSuccess('DAILY_API_KEY is configured')
  logWarning('Video room creation requires manual testing')
  logInfo('Test by completing a payment and verifying room is created')
  
  return {
    name: 'Video Service',
    passed: true,
    message: 'Daily.co API key is configured',
    details: 'Video room creation requires manual testing',
  }
}

async function verifySystemSettings(): Promise<VerificationResult> {
  logSection('8. System Settings Check')
  
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .limit(10)

    if (error) {
      logError(`Error fetching system settings: ${error.message}`)
      return {
        name: 'System Settings',
        passed: false,
        message: `Error: ${error.message}`,
      }
    }

    if (!data || data.length === 0) {
      logWarning('No system settings found')
      logInfo('System settings should be initialized on first admin login')
      return {
        name: 'System Settings',
        passed: true,
        message: 'System settings table exists (may be empty)',
        details: 'Settings will be initialized on first use',
      }
    }

    logSuccess(`Found ${data.length} system setting(s)`)
    
    // Check for critical settings
    const criticalSettings = ['consultation_price', 'consultation_duration']
    const foundSettings = data.map((s: any) => s.key)
    const missing = criticalSettings.filter(k => !foundSettings.includes(k))

    if (missing.length > 0) {
      logWarning(`Missing critical settings: ${missing.join(', ')}`)
    } else {
      logSuccess('All critical system settings are present')
    }

    return {
      name: 'System Settings',
      passed: true,
      message: 'System settings are configured',
    }
  } catch (error: any) {
    logError(`System settings check error: ${error.message}`)
    return {
      name: 'System Settings',
      passed: false,
      message: `Error: ${error.message}`,
    }
  }
}

async function generateReport() {
  logSection('Verification Report')
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log('\nSummary:')
  log(`Total Checks: ${total}`, 'cyan')
  log(`Passed: ${passed}`, 'green')
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green')
  console.log('\nDetailed Results:')

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.name}`)
    if (result.passed) {
      logSuccess(result.message)
    } else {
      logError(result.message)
    }
    if (result.details) {
      logInfo(`   Details: ${result.details}`)
    }
  })

  console.log('\n' + '='.repeat(60))
  
  if (failed === 0) {
    logSuccess('All automated checks passed!')
    logWarning('Remember to perform manual testing as outlined in the verification plan')
  } else {
    logError(`${failed} check(s) failed. Please fix these issues before deploying.`)
  }

  console.log('\nNext Steps:')
  logInfo('1. Fix any failed checks above')
  logInfo('2. Run manual testing as per the verification plan')
  logInfo('3. Test all user flows (patient, doctor, admin)')
  logInfo('4. Verify payment flow end-to-end')
  logInfo('5. Check all sidebars and navigation')
  logInfo('6. Test error handling scenarios')
  console.log('')
}

async function main() {
  console.log('\n')
  log('╔═══════════════════════════════════════════════════════════╗', 'cyan')
  log('║   CareHaven Pre-Deployment Verification Script          ║', 'cyan')
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan')
  console.log('')

  // Run all verification checks
  results.push(await verifyEnvironmentVariables())
  results.push(await verifyDatabaseConnection())
  results.push(await verifyDatabaseTables())
  results.push(await verifyRLSPolicies())
  results.push(await verifyEmailService())
  results.push(await verifyPaymentService())
  results.push(await verifyVideoService())
  results.push(await verifySystemSettings())

  // Generate report
  await generateReport()

  rl.close()
}

main().catch((error) => {
  logError(`Fatal error: ${error.message}`)
  console.error(error)
  process.exit(1)
})
