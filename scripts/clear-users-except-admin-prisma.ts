/**
 * Script to clear all users EXCEPT admin and super_admin using Prisma
 * 
 * This script leverages Prisma's cascade delete relationships to handle
 * all related data automatically.
 * 
 * Usage: npx tsx scripts/clear-users-except-admin-prisma.ts
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
  console.log('🧹 Clearing all users EXCEPT admin and super_admin using Prisma...')
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
    }

    // Step 2: Get all non-admin profiles
    console.log('\nStep 2: Identifying non-admin users...')
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

    // Step 2b: Also check for orphaned users in auth.users (users without profiles)
    console.log('   Checking for orphaned auth users (users without profiles)...')
    const { data: { users: allAuthUsers }, error: authListError } = await supabase.auth.admin.listUsers()
    
    if (authListError) {
      console.warn(`   ⚠️  Error fetching auth users: ${authListError.message}`)
    } else {
      const orphanedUsers = (allAuthUsers || []).filter(
        user => !adminUserIds.has(user.id) && !nonAdminProfiles.some(p => p.id === user.id)
      )
      
      if (orphanedUsers.length > 0) {
        console.log(`   Found ${orphanedUsers.length} orphaned auth user(s) (no profile):`)
        orphanedUsers.forEach(user => {
          console.log(`      - ${user.email || 'unknown'} (orphaned)`)
        })
      }
    }

    if (nonAdminProfiles.length === 0) {
      // Check if there are orphaned users to delete
      if (authListError || !allAuthUsers || allAuthUsers.filter(u => !adminUserIds.has(u.id)).length === 0) {
        console.log('   ℹ️  No non-admin users found to delete')
        return
      }
    }

    console.log(`   🗑️  Found ${nonAdminProfiles.length} non-admin user(s) to delete:`)
    nonAdminProfiles.slice(0, 10).forEach(user => {
      console.log(`      - ${user.email || 'unknown'} (${user.role})`)
    })
    if (nonAdminProfiles.length > 10) {
      console.log(`      ... and ${nonAdminProfiles.length - 10} more`)
    }

    // Step 3: Delete non-admin users
    console.log('\nStep 3: Deleting non-admin users...')
    console.log('   (Prisma will automatically cascade delete all related data)')
    
    let successCount = 0
    let failCount = 0
    const failedUsers: Array<{ email: string; error: string }> = []

    // Step 3a: Delete users with profiles using Prisma
    for (let i = 0; i < nonAdminProfiles.length; i++) {
      const profile = nonAdminProfiles[i]
      console.log(`\n   [${i + 1}/${nonAdminProfiles.length}] Processing: ${profile.email || 'unknown'} (${profile.role})`)

      try {
        // Step 3a: Delete using Prisma (this will cascade delete all related data)
        // Prisma will automatically handle:
        // - Appointments (onDelete: Cascade)
        // - Prescriptions (onDelete: Cascade)
        // - Investigations (onDelete: Cascade)
        // - Consultation Notes (onDelete: Cascade)
        // - Notifications (onDelete: Cascade)
        // - Messages (onDelete: Cascade)
        // - Doctor Availability (onDelete: Cascade)
        
        console.log(`      Deleting profile and related data via Prisma...`)
        await prisma.profile.delete({
          where: { id: profile.id },
        })
        
        console.log(`      ✅ Deleted profile and related data`)

        // Step 3b: Delete from Supabase auth
        console.log(`      Deleting from Supabase auth...`)
        const { error: authError } = await supabase.auth.admin.deleteUser(profile.id)
        
        if (authError) {
          console.log(`      ⚠️  Auth deletion error: ${authError.message}`)
          // Profile is already deleted, so we'll continue
          // The auth user might be orphaned but that's okay
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

    // Step 3b: Delete orphaned auth users (users without profiles)
    if (!authListError && allAuthUsers) {
      const orphanedUsers = allAuthUsers.filter(
        user => !adminUserIds.has(user.id) && !nonAdminProfiles.some(p => p.id === user.id)
      )

      if (orphanedUsers.length > 0) {
        console.log(`\n   Deleting ${orphanedUsers.length} orphaned auth user(s)...`)
        
        for (let i = 0; i < orphanedUsers.length; i++) {
          const user = orphanedUsers[i]
          console.log(`\n   [${i + 1}/${orphanedUsers.length}] Processing orphaned user: ${user.email || 'unknown'}`)

          try {
            // Just delete from auth (no profile to delete)
            console.log(`      Deleting from Supabase auth...`)
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
              email: user.email || 'unknown',
              error: error.message || 'Unknown error'
            })
          }

          await new Promise(resolve => setTimeout(resolve, 200))
        }
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

    console.log('\n📊 Final Statistics:')
    console.log(`   Admin users: ${adminCount}`)
    console.log(`   Non-admin users: ${remainingCount}`)
    console.log(`   Total users: ${adminCount + remainingCount}`)

  } catch (error: any) {
    console.error('\n❌ Error clearing users:', error)
    console.error('Stack:', error.stack)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
console.log('Starting user cleanup with Prisma (preserving admins)...\n')

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
