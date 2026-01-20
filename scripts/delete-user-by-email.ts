/**
 * Quick script to delete a user by email address
 * 
 * Usage:
 *   npx tsx scripts/delete-user-by-email.ts <email>
 * 
 * Example:
 *   npx tsx scripts/delete-user-by-email.ts test@example.com
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

async function deleteUserByEmail(email: string) {
  console.log(`🔍 Looking for user: ${email}`)
  
  // Get all users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('❌ Failed to list users:', listError.message)
    process.exit(1)
  }
  
  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  
  if (!user) {
    console.log(`ℹ️  User with email "${email}" not found`)
    console.log(`   Available users: ${users.map(u => u.email).join(', ')}`)
    process.exit(0)
  }
  
  console.log(`✅ Found user: ${user.email} (${user.id})`)
  console.log(`🧹 Deleting user and all related data...`)
  
  // Try Admin API first
  const { error: adminError } = await supabase.auth.admin.deleteUser(user.id)
  
  if (!adminError) {
    console.log(`✅ Successfully deleted via Admin API`)
    return true
  }
  
  console.log(`⚠️  Admin API failed: ${adminError.message}`)
  console.log(`🔄 Trying cascade delete function...`)
  
  // Try cascade function
  const { data: cascadeResult, error: cascadeError } = await supabase.rpc('delete_user_cascade', {
    target_user_id: user.id
  })
  
  if (cascadeError) {
    if (cascadeError.message.includes('does not exist')) {
      console.error(`❌ Cascade function doesn't exist. Please run the migration first:`)
      console.error(`   supabase/migrations/021_delete_user_cascade_function.sql`)
      return false
    }
    console.error(`❌ Cascade delete failed: ${cascadeError.message}`)
    return false
  }
  
  if (cascadeResult === true) {
    console.log(`✅ Successfully deleted via cascade function`)
    return true
  }
  
  console.error(`❌ Deletion failed`)
  return false
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.error('❌ Please provide an email address')
  console.error('   Usage: npx tsx scripts/delete-user-by-email.ts <email>')
  process.exit(1)
}

deleteUserByEmail(email)
  .then((success) => {
    if (success) {
      console.log(`\n🎉 User "${email}" has been deleted successfully!`)
      console.log(`   You can now enroll with this email again.`)
    } else {
      console.log(`\n❌ Failed to delete user "${email}"`)
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
