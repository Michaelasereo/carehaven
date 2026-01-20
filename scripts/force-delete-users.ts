/**
 * Enhanced script for force-deleting specific users with cascade cleanup
 * This script handles all foreign key constraints and uses multiple fallback methods
 * 
 * Usage:
 *   npx tsx scripts/force-delete-users.ts
 * 
 * Or modify TARGET_EMAILS array below to specify which users to delete
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Modify this array to specify which users to delete
const TARGET_EMAILS = [
  'asereopeyemi1@gmail.com',
  'blessingayoadebayo@gmail.com',
  'skyegenius@gmail.com',
  'obgynect@gmail.com',
  'michael@opportunedesignco.com'
]

async function deleteUserWithData(userId: string, email: string) {
  console.log(`🧹 Cleaning up data for: ${email} (${userId})`)
  
  try {
    // Method 1: Try to delete from dependent tables first (optional, cascade function handles this)
    // But we'll do it explicitly for better error reporting
    const tables = [
      { name: 'appointments', columns: ['patient_id', 'doctor_id'] },
      { name: 'consultation_notes', columns: ['doctor_id'] },
      { name: 'prescriptions', columns: ['patient_id', 'doctor_id'] },
      { name: 'investigations', columns: ['patient_id', 'doctor_id'] },
      { name: 'notifications', columns: ['user_id'] },
      { name: 'messages', columns: ['sender_id', 'receiver_id'] },
      { name: 'doctor_availability', columns: ['doctor_id'] },
      { name: 'email_verification_codes', columns: ['user_id'] },
      { name: 'email_verification_tokens', columns: ['user_id'] },
      { name: 'auto_signin_tokens', columns: ['user_id'] },
    ]
    
    for (const table of tables) {
      try {
        let query = supabase.from(table.name).delete()
        
        // Build OR condition for multiple columns
        const conditions = table.columns.map(col => {
          if (col === 'user_id') {
            return `user_id.eq.${userId}`
          } else if (col === 'patient_id') {
            return `patient_id.eq.${userId}`
          } else if (col === 'doctor_id') {
            return `doctor_id.eq.${userId}`
          } else if (col === 'sender_id') {
            return `sender_id.eq.${userId}`
          } else if (col === 'receiver_id') {
            return `receiver_id.eq.${userId}`
          }
          return null
        }).filter(Boolean)
        
        if (conditions.length > 0) {
          const { error } = await query.or(conditions.join(','))
          
          if (error && !error.message.includes('does not exist')) {
            // Table might not exist or RLS might block, continue
            // The cascade function will handle it
          }
        }
      } catch (err: any) {
        // Table might not exist, continue
      }
    }
    
    // Method 2: Try Admin API (preferred method)
    console.log(`  🔄 Attempting Admin API deletion...`)
    const { error: adminError } = await supabase.auth.admin.deleteUser(userId)
    
    if (!adminError) {
      console.log(`  ✅ Deleted via Admin API`)
      return true
    }
    
    console.log(`  ⚠️  Admin API failed: ${adminError.message}`)
    
    // Method 3: Use cascade delete function (most reliable)
    console.log(`  🔄 Attempting cascade delete function...`)
    const { data: cascadeResult, error: sqlError } = await supabase.rpc('delete_user_cascade', { 
      target_user_id: userId 
    })
    
    if (!sqlError && cascadeResult === true) {
      console.log(`  ✅ Deleted via cascade function`)
      return true
    }
    
    if (sqlError) {
      console.log(`  ⚠️  Cascade function error: ${sqlError.message}`)
      
      // If function doesn't exist, suggest running migration
      if (sqlError.message.includes('function') && sqlError.message.includes('does not exist')) {
        console.log(`  💡 Tip: Run the migration 021_delete_user_cascade_function.sql first`)
      }
    } else if (cascadeResult === false) {
      console.log(`  ⚠️  Cascade function returned false (user may not exist)`)
    }
    
    // Method 4: Last resort - try direct profile deletion (might work if cascade is set up)
    console.log(`  🔄 Attempting direct profile deletion...`)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
    
    if (!profileError) {
      // Try auth deletion again after profile is gone
      const { error: finalAuthError } = await supabase.auth.admin.deleteUser(userId)
      if (!finalAuthError) {
        console.log(`  ✅ Deleted via profile + auth deletion`)
        return true
      }
    }
    
    console.log(`  ❌ All methods failed`)
    return false
    
  } catch (error: any) {
    console.log(`  ❌ Unexpected error: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🚀 Starting force deletion...\n')
  console.log(`📋 Target emails: ${TARGET_EMAILS.length}`)
  TARGET_EMAILS.forEach(email => console.log(`   - ${email}`))
  console.log()
  
  // Get all users
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('❌ Failed to list users:', error.message)
    process.exit(1)
  }
  
  if (!users || users.length === 0) {
    console.log('ℹ️  No users found in database')
    process.exit(0)
  }
  
  const targetUsers = users.filter(u => 
    TARGET_EMAILS.includes(u.email?.toLowerCase() || '')
  )
  
  if (targetUsers.length === 0) {
    console.log('ℹ️  No matching users found')
    console.log(`   Available users: ${users.map(u => u.email).join(', ')}`)
    process.exit(0)
  }
  
  console.log(`📋 Found ${targetUsers.length} target user(s):\n`)
  
  let successCount = 0
  let failCount = 0
  
  for (const user of targetUsers) {
    console.log(`\n${'='.repeat(60)}`)
    const success = await deleteUserWithData(user.id, user.email || 'unknown')
    
    if (success) {
      successCount++
      console.log(`✅ Successfully deleted: ${user.email}\n`)
    } else {
      failCount++
      console.log(`❌ Failed to delete: ${user.email}\n`)
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('='.repeat(60))
  console.log('🎉 Process complete!')
  console.log(`   ✅ Succeeded: ${successCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log('='.repeat(60))
  
  if (failCount > 0) {
    console.log('\n💡 If deletion failed, try:')
    console.log('   1. Run the migration: supabase/migrations/021_delete_user_cascade_function.sql')
    console.log('   2. Check for foreign key constraints in Supabase SQL Editor')
    console.log('   3. Use the SQL Editor to manually delete dependent data first')
  }
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
