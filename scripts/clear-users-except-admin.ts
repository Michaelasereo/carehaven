/**
 * Script to clear all users from Supabase auth and related database tables
 * EXCEPT admin and super_admin users
 * Use this to reset your database while keeping admin access
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

async function clearUsersExceptAdmin() {
  console.log('🧹 Clearing all users EXCEPT admin and super_admin...')
  console.log('='.repeat(60))
  console.log('⚠️  This will delete all non-admin users and related data!')
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
      return
    }

    console.log(`   Found ${users.length} total user(s)`)

    // Step 2: Get profiles to determine which users are admins
    console.log('\nStep 2: Checking user roles...')
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
    
    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError)
      throw profileError
    }

    // Create a map of user IDs to roles
    const userRoleMap = new Map<string, string>()
    if (profiles) {
      for (const profile of profiles) {
        userRoleMap.set(profile.id, profile.role)
      }
    }

    // Filter out admin and super_admin users
    const adminUserIds = new Set<string>()
    const nonAdminUsers = users.filter(user => {
      const role = userRoleMap.get(user.id)
      if (role === 'admin' || role === 'super_admin') {
        adminUserIds.add(user.id)
        return false // Don't delete admin users
      }
      return true // Delete non-admin users
    })

    if (adminUserIds.size > 0) {
      console.log(`   🔒 Found ${adminUserIds.size} admin/super_admin user(s) - will be preserved`)
    }

    if (nonAdminUsers.length === 0) {
      console.log('   ℹ️  No non-admin users found to delete')
      return
    }

    console.log(`   🗑️  Will delete ${nonAdminUsers.length} non-admin user(s)`)
    
    const userIdsToDelete = nonAdminUsers.map(u => u.id)

    // Step 3: Delete related database records first (to avoid foreign key issues)
    if (userIdsToDelete.length > 0) {
      console.log('\nStep 3: Deleting related database records...')
      
      // Delete from profiles
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .in('id', userIdsToDelete)
      
      if (profileDeleteError) {
        console.error('❌ Error deleting profiles:', profileDeleteError)
      } else {
        console.log(`   ✅ Deleted ${userIdsToDelete.length} profile(s)`)
      }

      // Delete email verification codes
      try {
        const { error: codeError } = await supabase
          .from('email_verification_codes')
          .delete()
          .in('user_id', userIdsToDelete)
        
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
        .in('user_id', userIdsToDelete)
      
      if (tokenError) {
        console.warn('⚠️  Error deleting verification tokens:', tokenError.message)
      } else {
        console.log('   ✅ Deleted verification tokens')
      }

      // Delete notifications
      const { error: notificationError } = await supabase
        .from('notifications')
        .delete()
        .in('user_id', userIdsToDelete)
      
      if (notificationError) {
        console.warn('⚠️  Error deleting notifications:', notificationError.message)
      } else {
        console.log('   ✅ Deleted notifications')
      }

      // Delete messages (sent and received)
      const { error: messageError } = await supabase
        .from('messages')
        .delete()
        .or(`sender_id.in.(${userIdsToDelete.join(',')}),receiver_id.in.(${userIdsToDelete.join(',')})`)
      
      if (messageError) {
        console.warn('⚠️  Error deleting messages:', messageError.message)
      } else {
        console.log('   ✅ Deleted messages')
      }

      // Delete appointments where patient or doctor is being deleted
      // But keep appointments where both patient and doctor are admins (though unlikely)
      const { error: appointmentError } = await supabase
        .from('appointments')
        .delete()
        .or(`patient_id.in.(${userIdsToDelete.join(',')}),doctor_id.in.(${userIdsToDelete.join(',')})`)
      
      if (appointmentError) {
        console.warn('⚠️  Error deleting appointments:', appointmentError.message)
      } else {
        console.log('   ✅ Deleted related appointments')
      }
    }

    // Step 4: Delete users from Supabase auth
    if (nonAdminUsers.length > 0) {
      console.log('\nStep 4: Deleting users from Supabase auth...')
      
      for (const user of nonAdminUsers) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
        
        if (deleteError) {
          console.error(`   ❌ Error deleting user ${user.email}:`, deleteError.message)
        } else {
          console.log(`   ✅ Deleted user: ${user.email}`)
        }
      }
    }

    // Step 5: Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ Cleanup completed successfully!')
    console.log(`   Deleted: ${nonAdminUsers.length} non-admin user(s)`)
    console.log(`   Preserved: ${adminUserIds.size} admin/super_admin user(s)`)
    console.log('='.repeat(60))

    // List preserved admin users
    if (adminUserIds.size > 0) {
      console.log('\n🔒 Preserved admin users:')
      for (const userId of adminUserIds) {
        const user = users.find(u => u.id === userId)
        const role = userRoleMap.get(userId)
        if (user) {
          console.log(`   - ${user.email} (${role})`)
        }
      }
    }

  } catch (error: any) {
    console.error('\n❌ Error clearing users:', error)
    console.error('Stack:', error.stack)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
console.log('Starting user cleanup (preserving admins)...\n')
clearUsersExceptAdmin()
  .then(() => {
    console.log('\n✅ Cleanup completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error)
    process.exit(1)
  })
