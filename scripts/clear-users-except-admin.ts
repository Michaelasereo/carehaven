/**
 * Script to Clear All Users EXCEPT Admin and Super Admin
 * ============================================================
 * 
 * This script will:
 * 1. Preserve all users with role 'admin' or 'super_admin'
 * 2. Delete all other users and their related data
 * 3. Handle both users with profiles and orphaned auth users
 * 
 * Usage:
 *   npx tsx scripts/clear-users-except-admin.ts
 * 
 * Safety:
 * - Requires confirmation before deletion
 * - Shows preview of what will be deleted
 * - Verifies admin users are preserved
 * 
 * ============================================================
 */

import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function clearUsersExceptAdmin() {
  console.log('🧹 Clearing all users EXCEPT admin and super_admin...')
  console.log('='.repeat(60))
  console.log('⚠️  This will delete all non-admin users and related data!')
  console.log('='.repeat(60))
  console.log()

  try {
    // Step 1: Get all admin users
    console.log('Step 1: Identifying admin users...')
    const adminProfiles = await prisma.profile.findMany({
      where: {
        role: {
          in: ['admin', 'super_admin'],
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    })

    const adminUserIds = new Set(adminProfiles.map(p => p.id))

    if (adminProfiles.length > 0) {
      console.log(`   🔒 Found ${adminProfiles.length} admin/super_admin user(s) - will be preserved:`)
      adminProfiles.forEach(admin => {
        console.log(`      - ${admin.email || 'unknown'} (${admin.role})`)
      })
    } else {
      console.log('   ⚠️  WARNING: No admin users found!')
    }

    // Step 2: Get all non-admin profiles
    console.log('\nStep 2: Identifying non-admin users with profiles...')
    const nonAdminProfiles = await prisma.profile.findMany({
      where: {
        role: {
          notIn: ['admin', 'super_admin'],
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    })

    // Step 2b: Check for orphaned auth users (users without profiles)
    console.log('   Checking for orphaned auth users (users without profiles)...')
    const { data: { users: allAuthUsers }, error: authListError } = await supabase.auth.admin.listUsers()
    
    let orphanedUsers: Array<{ id: string; email: string }> = []
    if (!authListError && allAuthUsers) {
      orphanedUsers = allAuthUsers
        .filter(user => !adminUserIds.has(user.id) && !nonAdminProfiles.some(p => p.id === user.id))
        .map(user => ({ id: user.id, email: user.email || 'unknown' }))
      
      if (orphanedUsers.length > 0) {
        console.log(`   Found ${orphanedUsers.length} orphaned auth user(s):`)
        orphanedUsers.slice(0, 10).forEach(user => {
          console.log(`      - ${user.email} (orphaned)`)
        })
        if (orphanedUsers.length > 10) {
          console.log(`      ... and ${orphanedUsers.length - 10} more`)
        }
      }
    }

    const totalToDelete = nonAdminProfiles.length + orphanedUsers.length

    if (totalToDelete === 0) {
      console.log('   ℹ️  No non-admin users found to delete')
      return
    }

    console.log(`\n   🗑️  Total users to delete: ${totalToDelete}`)
    console.log(`      - Users with profiles: ${nonAdminProfiles.length}`)
    console.log(`      - Orphaned auth users: ${orphanedUsers.length}`)

    // Step 3: Delete users with profiles using Prisma
    console.log('\nStep 3: Deleting users with profiles...')
    console.log('   (Prisma will automatically cascade delete all related data)')
    
    let successCount = 0
    let failCount = 0
    const failedUsers: Array<{ email: string; error: string }> = []

    // Step 3a: Delete users with profiles using Prisma
    for (let i = 0; i < nonAdminProfiles.length; i++) {
      const profile = nonAdminProfiles[i]
      console.log(`\n   [${i + 1}/${nonAdminProfiles.length}] Processing: ${profile.email || 'unknown'} (${profile.role})`)

      try {
        // Delete using Prisma (this will cascade delete all related data)
        console.log(`      Deleting profile and related data via Prisma...`)
        await prisma.profile.delete({
          where: { id: profile.id },
        })
        
        console.log(`      ✅ Deleted profile and related data`)

        // Delete from Supabase auth
        console.log(`      Deleting from Supabase auth...`)
        const { error: authError } = await supabase.auth.admin.deleteUser(profile.id)
        
        if (authError) {
          console.log(`      ⚠️  Auth deletion error: ${authError.message}`)
          // Profile is already deleted, continue
        } else {
          console.log(`      ✅ Deleted from auth`)
        }

        successCount++

      } catch (error: any) {
        console.error(`      ❌ Failed: ${error.message}`)
        failCount++
        failedUsers.push({
          email: profile.email || 'unknown',
          error: error.message || 'Unknown error'
        })
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Step 3b: Delete orphaned auth users using SQL (more reliable for orphaned users)
    if (orphanedUsers.length > 0) {
      console.log(`\n   Deleting ${orphanedUsers.length} orphaned auth user(s)...`)
      console.log('   (These users have no profiles, deleting directly from auth)')
      
      for (let i = 0; i < orphanedUsers.length; i++) {
        const user = orphanedUsers[i]
        console.log(`\n   [${i + 1}/${orphanedUsers.length}] Processing orphaned user: ${user.email}`)

        try {
          // Delete audit logs first (has FK constraint)
          await prisma.$executeRaw`
            DELETE FROM public.audit_logs WHERE user_id = ${user.id}::uuid
          `.catch(() => {}) // Ignore errors if table doesn't exist

          // Delete from auth tables in order
          await prisma.$executeRaw`
            DELETE FROM auth.sessions WHERE user_id = ${user.id}::uuid
          `.catch(() => {})

          await prisma.$executeRaw`
            DELETE FROM auth.identities WHERE user_id = ${user.id}::uuid
          `.catch(() => {})

          // Finally delete the user
          const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
          
          if (authError) {
            throw new Error(authError.message)
          }
          
          console.log(`      ✅ Deleted orphaned auth user`)
          successCount++
        } catch (error: any) {
          console.error(`      ❌ Failed: ${error.message}`)
          failCount++
          failedUsers.push({
            email: user.email,
            error: error.message || 'Unknown error'
          })
        }

        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ Cleanup completed!')
    console.log(`   ✅ Successfully deleted: ${successCount} user(s)`)
    if (failCount > 0) {
      console.log(`   ❌ Failed to delete: ${failCount} user(s)`)
      console.log('\n   Failed users:')
      failedUsers.forEach(({ email, error }) => {
        console.log(`      - ${email}: ${error}`)
      })
    }
    console.log(`   🔒 Preserved: ${adminProfiles.length} admin/super_admin user(s)`)
    console.log('='.repeat(60))

    // Step 5: Verify admin users still exist
    if (adminProfiles.length > 0) {
      console.log('\n🔒 Verifying preserved admin users:')
      for (const admin of adminProfiles) {
        const stillExists = await prisma.profile.findUnique({
          where: { id: admin.id },
          select: { id: true, email: true, role: true },
        })

        if (stillExists) {
          console.log(`   ✅ ${stillExists.email} (${stillExists.role}) - OK`)
        } else {
          console.log(`   ⚠️  ${admin.email} - Profile not found!`)
        }
      }
    }

    // Step 6: Show final count
    const remainingCount = await prisma.profile.count({
      where: {
        role: {
          notIn: ['admin', 'super_admin'],
        },
      },
    })

    const adminCount = await prisma.profile.count({
      where: {
        role: {
          in: ['admin', 'super_admin'],
        },
      },
    })

    // Check for remaining orphaned users
    const { data: { users: remainingAuthUsers } } = await supabase.auth.admin.listUsers()
    const remainingOrphanedCount = remainingAuthUsers?.filter(
      user => !adminUserIds.has(user.id) && 
      !(await prisma.profile.findUnique({ where: { id: user.id } }))
    ).length || 0

    console.log('\n📊 Final Statistics:')
    console.log(`   Admin users: ${adminCount}`)
    console.log(`   Non-admin profiles: ${remainingCount}`)
    console.log(`   Orphaned auth users: ${remainingOrphanedCount}`)
    console.log(`   Total users in auth: ${remainingAuthUsers?.length || 0}`)

    if (remainingCount > 0 || remainingOrphanedCount > 0) {
      console.log('\n   ⚠️  Some users could not be deleted. You may need to run the SQL script:')
      console.log('      scripts/delete-orphaned-auth-users.sql')
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

// Add confirmation prompt
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('⚠️  Are you sure you want to delete all non-admin users? (yes/no): ', async (answer: string) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    rl.close()
    await clearUsersExceptAdmin()
      .then(() => {
        console.log('\n✅ Cleanup completed successfully')
        process.exit(0)
      })
      .catch((error) => {
        console.error('\n❌ Cleanup failed:', error)
        process.exit(1)
      })
  } else {
    console.log('\n❌ Cancelled. No users were deleted.')
    rl.close()
    process.exit(0)
  }
})
