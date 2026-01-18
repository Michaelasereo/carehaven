/**
 * Script to clear all users from Supabase auth and related database tables
 * WARNING: This will delete ALL users and related data. Use with caution!
 */

import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const prisma = new PrismaClient()

async function clearAllUsers() {
  console.log('🧹 Clearing all users from Supabase and database...')
  console.log('='.repeat(60))
  console.log('⚠️  WARNING: This will delete ALL users and related data!')
  console.log('='.repeat(60))
  console.log()

  try {
    // Step 1: Get all users from Supabase auth
    console.log('Step 1: Fetching all users from Supabase auth...')
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error fetching users:', listError)
      throw listError
    }

    if (!users || users.length === 0) {
      console.log('ℹ️  No users found in Supabase auth')
    } else {
      console.log(`   Found ${users.length} user(s)`)
    }

    // Step 2: Delete related database records first (to avoid foreign key issues)
    if (users && users.length > 0) {
      console.log('\nStep 2: Deleting related database records...')
      
      const userIds = users.map(u => u.id)
      
      // Delete from profiles (will cascade to related records)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .in('id', userIds)
      
      if (profileError) {
        console.error('❌ Error deleting profiles:', profileError)
      } else {
        console.log(`   ✅ Deleted ${userIds.length} profile(s)`)
      }

      // Delete email verification codes (table might not exist yet)
      try {
        const { error: codeError } = await supabase
          .from('email_verification_codes')
          .delete()
          .in('user_id', userIds)
        
        if (codeError) {
          if (codeError.message?.includes('does not exist') || codeError.message?.includes('schema cache')) {
            console.log('   ℹ️  Verification codes table does not exist yet (migration not run)')
          } else {
            console.warn('⚠️  Error deleting verification codes:', codeError.message)
          }
        } else {
          console.log('   ✅ Deleted verification codes')
        }
      } catch (err) {
        console.log('   ℹ️  Verification codes table does not exist yet')
      }

      // Delete email verification tokens
      const { error: tokenError } = await supabase
        .from('email_verification_tokens')
        .delete()
        .in('user_id', userIds)
      
      if (tokenError) {
        console.warn('⚠️  Error deleting verification tokens:', tokenError.message)
      } else {
        console.log('   ✅ Deleted verification tokens')
      }

      // Delete notifications
      const { error: notificationError } = await supabase
        .from('notifications')
        .delete()
        .in('user_id', userIds)
      
      if (notificationError) {
        console.warn('⚠️  Error deleting notifications:', notificationError.message)
      } else {
        console.log('   ✅ Deleted notifications')
      }

      // Delete messages (sent and received)
      const { error: messageError } = await supabase
        .from('messages')
        .delete()
        .or(`sender_id.in.(${userIds.join(',')}),receiver_id.in.(${userIds.join(',')})`)
      
      if (messageError) {
        console.warn('⚠️  Error deleting messages:', messageError.message)
      } else {
        console.log('   ✅ Deleted messages')
      }
    }

    // Step 3: Delete users from Supabase auth
    if (users && users.length > 0) {
      console.log('\nStep 3: Deleting users from Supabase auth...')
      
      for (const user of users) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
        
        if (deleteError) {
          console.error(`   ❌ Error deleting user ${user.email}:`, deleteError.message)
        } else {
          console.log(`   ✅ Deleted user: ${user.email}`)
        }
      }
    }

    // Step 4: Clean up any remaining orphaned records
    console.log('\nStep 4: Cleaning up orphaned records...')
    
      // Clean up all appointments since we're clearing all users
      const { error: appointmentError } = await supabase
        .from('appointments')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (using a condition that always matches)
    
    if (appointmentError) {
      console.warn('⚠️  Error cleaning appointments:', appointmentError.message)
    } else {
      console.log('   ✅ Cleaned up orphaned appointments')
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ All users cleared successfully!')
    console.log(`   Deleted ${users?.length || 0} user(s)`)
    console.log('='.repeat(60))

  } catch (error: any) {
    console.error('\n❌ Error clearing users:', error)
    console.error('Stack:', error.stack)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
console.log('Starting user cleanup...\n')
clearAllUsers()
  .then(() => {
    console.log('\n✅ Cleanup completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error)
    process.exit(1)
  })
