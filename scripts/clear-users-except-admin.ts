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
 *   OR
 *   npm run clear:users
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
import * as readline from 'readline'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface UserStats {
  adminCount: number
  nonAdminCount: number
  orphanedCount: number
  totalToDelete: number
}

async function getStats(): Promise<UserStats> {
  // Get admin users
  const adminProfiles = await prisma.profile.findMany({
    where: {
      role: {
        in: ['admin', 'super_admin'],
      },
    },
    select: { id: true },
  })

  const adminUserIds = new Set(adminProfiles.map(p => p.id))

  // Get non-admin profiles
  const nonAdminProfiles = await prisma.profile.findMany({
    where: {
      role: {
        notIn: ['admin', 'super_admin'],
      },
    },
    select: { id: true, email: true, role: true },
  })

  // Check for orphaned auth users
  const { data: { users: allAuthUsers } } = await supabase.auth.admin.listUsers()
  let orphanedUsers: Array<{ id: string; email: string }> = []
  
  if (allAuthUsers) {
    orphanedUsers = allAuthUsers
      .filter(user => !adminUserIds.has(user.id) && !nonAdminProfiles.some(p => p.id === user.id))
      .map(user => ({ id: user.id, email: user.email || 'unknown' }))
  }

  return {
    adminCount: adminProfiles.length,
    nonAdminCount: nonAdminProfiles.length,
    orphanedCount: orphanedUsers.length,
    totalToDelete: nonAdminProfiles.length + orphanedUsers.length,
  }
}

async function clearUsersExceptAdmin() {
  console.log('🧹 Clearing all users EXCEPT admin and super_admin...')
  console.log('='.repeat(60))
  console.log('⚠️  This will delete all non-admin users and related data!')
  console.log('='.repeat(60))
  console.log()

  try {
    // Step 1: Get statistics
    console.log('Step 1: Analyzing users...')
    const stats = await getStats()
    
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

    if (stats.adminCount > 0) {
      console.log(`   🔒 Found ${stats.adminCount} admin/super_admin user(s) - will be preserved:`)
      adminProfiles.forEach(admin => {
        console.log(`      - ${admin.email || 'unknown'} (${admin.role})`)
      })
    } else {
      console.log('   ⚠️  WARNING: No admin users found!')
    }

    console.log(`\n   📊 Statistics:`)
    console.log(`      - Admin users to preserve: ${stats.adminCount}`)
    console.log(`      - Non-admin profiles: ${stats.nonAdminCount}`)
    console.log(`      - Orphaned auth users: ${stats.orphanedCount}`)
    console.log(`      - Total to delete: ${stats.totalToDelete}`)

    if (stats.totalToDelete === 0) {
      console.log('\n   ℹ️  No non-admin users found to delete')
      return
    }

    // Step 2: Delete users with profiles
    console.log('\nStep 2: Deleting users with profiles...')
    console.log('   (Prisma will automatically cascade delete all related data)')
    
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

    let successCount = 0
    let failCount = 0
    const failedUsers: Array<{ email: string; error: string }> = []

    // Delete users with profiles
    for (let i = 0; i < nonAdminProfiles.length; i++) {
      const profile = nonAdminProfiles[i]
      console.log(`\n   [${i + 1}/${nonAdminProfiles.length}] Processing: ${profile.email || 'unknown'} (${profile.role})`)

      try {
        // Delete using Prisma (this will cascade delete all related data)
        await prisma.profile.delete({
          where: { id: profile.id },
        })
        console.log(`      ✅ Deleted profile and related data`)

        // Delete from Supabase auth
        const { error: authError } = await supabase.auth.admin.deleteUser(profile.id)
        
        if (authError) {
          console.log(`      ⚠️  Auth deletion error: ${authError.message}`)
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

    // Step 3: Delete orphaned auth users
    const { data: { users: allAuthUsers } } = await supabase.auth.admin.listUsers()
    const adminUserIds = new Set(adminProfiles.map(p => p.id))
    
    let orphanedUsers: Array<{ id: string; email: string }> = []
    if (allAuthUsers) {
      orphanedUsers = allAuthUsers
        .filter(user => !adminUserIds.has(user.id))
        .map(user => ({ id: user.id, email: user.email || 'unknown' }))
      
      // Filter to only truly orphaned users (no profile)
      const orphanedChecks = await Promise.all(
        orphanedUsers.map(async (user) => {
          const profile = await prisma.profile.findUnique({ where: { id: user.id } })
          return !profile ? user : null
        })
      )
      orphanedUsers = orphanedChecks.filter((u): u is { id: string; email: string } => u !== null)
    }

    if (orphanedUsers.length > 0) {
      console.log(`\nStep 3: Deleting ${orphanedUsers.length} orphaned auth user(s)...`)
      console.log('   (These users have no profiles, deleting directly from auth)')
      
      for (let i = 0; i < orphanedUsers.length; i++) {
        const user = orphanedUsers[i]
        console.log(`\n   [${i + 1}/${orphanedUsers.length}] Processing orphaned user: ${user.email}`)

        try {
          // Delete audit logs first (has FK constraint)
          await prisma.$executeRaw`
            DELETE FROM public.audit_logs WHERE user_id = ${user.id}::uuid
          `.catch(() => {}) // Ignore errors if table doesn't exist

          // Delete from auth using Supabase admin API
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
    console.log(`   🔒 Preserved: ${stats.adminCount} admin/super_admin user(s)`)
    console.log('='.repeat(60))

    // Step 5: Verify admin users still exist
    if (stats.adminCount > 0) {
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
    const finalStats = await getStats()
    console.log('\n📊 Final Statistics:')
    console.log(`   Admin users: ${finalStats.adminCount}`)
    console.log(`   Non-admin profiles: ${finalStats.nonAdminCount}`)
    console.log(`   Orphaned auth users: ${finalStats.orphanedCount}`)

    if (finalStats.nonAdminCount > 0 || finalStats.orphanedCount > 0) {
      console.log('\n   ⚠️  Some users could not be deleted. You may need to run the script again.')
    }

  } catch (error: any) {
    console.error('\n❌ Error clearing users:', error)
    console.error('Stack:', error.stack)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Confirmation prompt
function askConfirmation(): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question('⚠️  Are you sure you want to delete all non-admin users? (yes/no): ', (answer: string) => {
      rl.close()
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y')
    })
  })
}

// Main execution
async function main() {
  console.log('Starting user cleanup (preserving admins)...\n')

  const confirmed = await askConfirmation()
  
  if (!confirmed) {
    console.log('\n❌ Cancelled. No users were deleted.')
    process.exit(0)
  }

  try {
    await clearUsersExceptAdmin()
    console.log('\n✅ Cleanup completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error)
    process.exit(1)
  }
}

main()
