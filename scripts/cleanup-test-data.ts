import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`)
  console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up all test data...')
  console.log('========================\n')

  try {
    // List all users
    const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    // Filter test users
    const testUsers = allUsers.users.filter(
      (user) =>
        user.email?.includes('@carehaven.test') ||
        user.email?.startsWith('test.') ||
        user.user_metadata?.full_name?.includes('Test')
    )

    console.log(`   Found ${testUsers.length} test user(s) to clean up\n`)

    for (const user of testUsers) {
      console.log(`   Cleaning up user: ${user.email} (${user.id})`)

      // Delete related data
      try {
        // Delete appointments
        const { error: appointmentError } = await supabase
          .from('appointments')
          .delete()
          .or(`patient_id.eq.${user.id},doctor_id.eq.${user.id}`)

        if (appointmentError && appointmentError.code !== 'PGRST116') {
          console.log(`      ⚠️  Error deleting appointments: ${appointmentError.message}`)
        }

        // Delete availability
        const { error: availabilityError } = await supabase
          .from('doctor_availability')
          .delete()
          .eq('doctor_id', user.id)

        if (availabilityError && availabilityError.code !== 'PGRST116') {
          console.log(`      ⚠️  Error deleting availability: ${availabilityError.message}`)
        }

        // Delete notifications
        const { error: notificationError } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id)

        if (notificationError && notificationError.code !== 'PGRST116') {
          console.log(`      ⚠️  Error deleting notifications: ${notificationError.message}`)
        }

        // Delete consultation_notes
        const { error: notesError } = await supabase
          .from('consultation_notes')
          .delete()
          .or(`patient_id.eq.${user.id},doctor_id.eq.${user.id}`)

        if (notesError && notesError.code !== 'PGRST116') {
          console.log(`      ⚠️  Error deleting consultation notes: ${notesError.message}`)
        }

        // Delete prescriptions
        const { error: prescriptionError } = await supabase
          .from('prescriptions')
          .delete()
          .or(`patient_id.eq.${user.id},doctor_id.eq.${user.id}`)

        if (prescriptionError && prescriptionError.code !== 'PGRST116') {
          console.log(`      ⚠️  Error deleting prescriptions: ${prescriptionError.message}`)
        }

        // Delete investigation_requests
        const { error: investigationError } = await supabase
          .from('investigation_requests')
          .delete()
          .or(`patient_id.eq.${user.id},doctor_id.eq.${user.id}`)

        if (investigationError && investigationError.code !== 'PGRST116') {
          console.log(`      ⚠️  Error deleting investigation requests: ${investigationError.message}`)
        }

        // Delete profile
        const { error: profileError } = await supabase.from('profiles').delete().eq('id', user.id)

        if (profileError && profileError.code !== 'PGRST116') {
          console.log(`      ⚠️  Error deleting profile: ${profileError.message}`)
        } else {
          console.log(`      ✅ Profile deleted`)
        }

        // Delete auth user
        const { error: authError } = await supabase.auth.admin.deleteUser(user.id)

        if (authError) {
          console.log(`      ⚠️  Error deleting auth user: ${authError.message}`)
        } else {
          console.log(`      ✅ Auth user deleted`)
        }
      } catch (error: any) {
        console.log(`      ⚠️  Error cleaning up user: ${error.message}`)
      }
    }

    console.log('\n✅ All test data cleaned up successfully!')
  } catch (error: any) {
    console.error('\n❌ Error during cleanup:', error.message)
    throw error
  }
}

// Run cleanup
cleanupTestData()
  .then(() => {
    console.log('\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error)
    process.exit(1)
  })
