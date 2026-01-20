/**
 * Create Test Patient User
 * 
 * Run: npx tsx scripts/create-test-patient.ts
 * 
 * Creates a test patient user that can be used for booking appointments
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

async function createTestPatient() {
  const timestamp = Date.now()
  const testEmail = `test.patient.${timestamp}@carehaven.test`
  const testPassword = 'TestPatient123!'
  const testName = 'Test Patient'

  console.log('👤 Creating test patient user...\n')

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm for testing
      user_metadata: {
        role: 'patient',
        full_name: testName,
      },
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('No user created')

    const userId = authData.user.id
    console.log('✅ User created:')
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${testPassword}`)
    console.log(`   User ID: ${userId}\n`)

    // Wait for profile trigger
    await new Promise(resolve => setTimeout(resolve, 500))

    // Upsert profile (trigger may have created it)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        role: 'patient',
        full_name: testName,
        email: testEmail,
        profile_completed: true, // Mark as completed so they can access dashboard
      }, {
        onConflict: 'id',
      })

    if (profileError) {
      console.warn('⚠️  Profile error (may already exist):', profileError.message)
    } else {
      console.log('✅ Profile created/updated\n')
    }

    console.log('📋 Test Patient Credentials:')
    console.log('='.repeat(50))
    console.log(`Email:    ${testEmail}`)
    console.log(`Password: ${testPassword}`)
    console.log('='.repeat(50))
    console.log('\n🔗 Next Steps:')
    console.log('1. Go to: http://localhost:3000/auth/signin')
    console.log('2. Sign in with the credentials above')
    console.log('3. Navigate to: /patient/appointments/book')
    console.log('4. Select your doctor and book an appointment!')
    console.log('\n✨ The test patient is ready to use!')

  } catch (error: any) {
    console.error('❌ Error creating test patient:', error.message)
    process.exit(1)
  }
}

createTestPatient()
