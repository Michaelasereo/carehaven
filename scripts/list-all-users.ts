/**
 * List all users in the database
 * 
 * Usage:
 *   npx tsx scripts/list-all-users.ts
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function listAllUsers() {
  console.log('🔍 Fetching all users from database...\n')
  
  // Get all users from auth
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('❌ Failed to list users:', error.message)
    process.exit(1)
  }
  
  if (!users || users.length === 0) {
    console.log('ℹ️  No users found in database')
    return
  }
  
  console.log(`📋 Found ${users.length} user(s):\n`)
  console.log('='.repeat(80))
  
  // Get profiles to check roles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
  
  const profileMap = new Map()
  if (profiles) {
    profiles.forEach(profile => {
      profileMap.set(profile.id, profile)
    })
  }
  
  // Group by role
  const admins: any[] = []
  const doctors: any[] = []
  const patients: any[] = []
  const noProfile: any[] = []
  
  users.forEach(user => {
    const profile = profileMap.get(user.id)
    const userData = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
      role: profile?.role || 'no profile',
      full_name: profile?.full_name || 'N/A',
    }
    
    if (!profile) {
      noProfile.push(userData)
    } else if (profile.role === 'admin' || profile.role === 'super_admin') {
      admins.push(userData)
    } else if (profile.role === 'doctor') {
      doctors.push(userData)
    } else {
      patients.push(userData)
    }
  })
  
  // Display admins
  if (admins.length > 0) {
    console.log('\n🔒 ADMIN USERS:')
    console.log('-'.repeat(80))
    admins.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Name: ${user.full_name}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log(`   Email Verified: ${user.email_confirmed_at ? '✅ Yes' : '❌ No'}`)
      console.log()
    })
  }
  
  // Display doctors
  if (doctors.length > 0) {
    console.log('\n👨‍⚕️ DOCTOR USERS:')
    console.log('-'.repeat(80))
    doctors.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Name: ${user.full_name}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log(`   Email Verified: ${user.email_confirmed_at ? '✅ Yes' : '❌ No'}`)
      console.log()
    })
  }
  
  // Display patients
  if (patients.length > 0) {
    console.log('\n👤 PATIENT USERS:')
    console.log('-'.repeat(80))
    patients.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Name: ${user.full_name}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log(`   Email Verified: ${user.email_confirmed_at ? '✅ Yes' : '❌ No'}`)
      console.log()
    })
  }
  
  // Display users without profiles
  if (noProfile.length > 0) {
    console.log('\n⚠️  USERS WITHOUT PROFILES:')
    console.log('-'.repeat(80))
    noProfile.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log(`   Email Verified: ${user.email_confirmed_at ? '✅ Yes' : '❌ No'}`)
      console.log(`   ⚠️  This user has no profile - may be incomplete signup`)
      console.log()
    })
  }
  
  console.log('='.repeat(80))
  console.log(`\n📊 Summary:`)
  console.log(`   Total Users: ${users.length}`)
  console.log(`   Admins: ${admins.length}`)
  console.log(`   Doctors: ${doctors.length}`)
  console.log(`   Patients: ${patients.length}`)
  console.log(`   No Profile: ${noProfile.length}`)
  console.log()
  
  // List all emails for easy copy-paste
  console.log('📧 All Email Addresses:')
  console.log('-'.repeat(80))
  users.forEach((user, index) => {
    const profile = profileMap.get(user.id)
    const role = profile?.role || 'no-profile'
    console.log(`${index + 1}. ${user.email} (${role})`)
  })
  console.log()
}

listAllUsers()
  .then(() => {
    console.log('✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
