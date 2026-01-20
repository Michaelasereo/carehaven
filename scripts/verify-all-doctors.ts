import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function verifyAllDoctors() {
  console.log('\n🔍 Fetching all doctors...\n')

  // Get all doctors
  const { data: doctors, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, license_verified')
    .eq('role', 'doctor')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching doctors:', error)
    return
  }

  if (!doctors || doctors.length === 0) {
    console.log('ℹ️  No doctors found')
    return
  }

  console.log(`Found ${doctors.length} doctor(s):\n`)

  // Show current status
  doctors.forEach((doctor, index) => {
    const status = doctor.license_verified ? '✅ Verified' : '❌ Revoked'
    console.log(`${index + 1}. ${doctor.full_name || 'Unknown'} (${doctor.email || 'No email'})`)
    console.log(`   Status: ${status}`)
    console.log(`   ID: ${doctor.id}`)
    console.log('')
  })

  // Find revoked doctors
  const revokedDoctors = doctors.filter(d => !d.license_verified)

  if (revokedDoctors.length === 0) {
    console.log('✅ All doctors are already verified!')
    return
  }

  console.log(`\n⚠️  Found ${revokedDoctors.length} revoked doctor(s)\n`)
  console.log('Verifying all revoked doctors...\n')

  // Verify all revoked doctors
  let successCount = 0
  let failCount = 0

  for (const doctor of revokedDoctors) {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ license_verified: true })
        .eq('id', doctor.id)

      if (updateError) {
        console.error(`❌ Failed to verify ${doctor.full_name || doctor.email}:`, updateError.message)
        failCount++
      } else {
        console.log(`✅ Verified: ${doctor.full_name || doctor.email}`)
        successCount++
      }
    } catch (error: any) {
      console.error(`❌ Error verifying ${doctor.full_name || doctor.email}:`, error.message)
      failCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Successfully verified: ${successCount} doctor(s)`)
  if (failCount > 0) {
    console.log(`❌ Failed to verify: ${failCount} doctor(s)`)
  }
  console.log('='.repeat(50) + '\n')
}

verifyAllDoctors()
  .then(() => {
    console.log('✅ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
