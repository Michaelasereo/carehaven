/**
 * Fix script to delete a user that's blocked by audit_logs
 * This will first clear audit_logs references, then delete the user
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function fixDeleteUser() {
  const email = 'asereope@gmail.com'
  
  console.log(`🔧 Fixing user deletion for: ${email}\n`)
  console.log('='.repeat(60))

  try {
    // Step 1: Find the user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error fetching users:', listError)
      return
    }

    const user = users?.find(u => u.email === email)
    
    if (!user) {
      console.log(`ℹ️  User ${email} not found`)
      return
    }

    console.log(`✅ Found user: ${user.id}\n`)

    // Step 2: Delete audit_logs entries for this user
    console.log('Step 1: Clearing audit_logs references...')
    const { error: auditError, count } = await supabase
      .from('audit_logs')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
    
    if (auditError) {
      console.error('❌ Error deleting audit_logs:', auditError.message)
      
      // Try setting user_id to NULL instead (if constraint allows)
      console.log('\n   Trying alternative: Setting user_id to NULL...')
      const { error: updateError } = await supabase
        .from('audit_logs')
        .update({ user_id: null })
        .eq('user_id', user.id)
      
      if (updateError) {
        console.error('❌ Error updating audit_logs:', updateError.message)
        console.log('\n💡 The foreign key constraint is preventing this.')
        console.log('   You may need to run SQL directly in Supabase dashboard:')
        console.log(`   DELETE FROM audit_logs WHERE user_id = '${user.id}';`)
        console.log(`   OR`)
        console.log(`   ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;`)
        console.log(`   ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey`)
        console.log(`   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;`)
        return
      } else {
        console.log('   ✅ Set user_id to NULL in audit_logs')
      }
    } else {
      console.log(`   ✅ Deleted ${count || 0} audit log(s)`)
    }

    // Step 3: Check system_settings
    console.log('\nStep 2: Checking system_settings...')
    const { error: settingsError, count: settingsCount } = await supabase
      .from('system_settings')
      .delete({ count: 'exact' })
      .eq('updated_by', user.id)
    
    if (settingsError) {
      if (settingsError.message.includes('does not exist')) {
        console.log('   ℹ️  system_settings table does not exist')
      } else {
        // Try setting to NULL
        const { error: updateError } = await supabase
          .from('system_settings')
          .update({ updated_by: null })
          .eq('updated_by', user.id)
        
        if (updateError) {
          console.warn('   ⚠️  Could not clear system_settings:', updateError.message)
        } else {
          console.log('   ✅ Cleared system_settings references')
        }
      }
    } else {
      console.log(`   ✅ Cleared ${settingsCount || 0} system_settings reference(s)`)
    }

    // Step 4: Now try deleting the user
    console.log('\nStep 3: Deleting user from auth...')
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError.message)
      console.log('\n💡 If this still fails, the issue might be:')
      console.log('1. Database trigger or constraint at the database level')
      console.log('2. The user might need to be deleted via SQL directly')
      console.log(`\n   Try running in Supabase SQL Editor:`)
      console.log(`   DELETE FROM auth.users WHERE id = '${user.id}';`)
    } else {
      console.log('✅ User deleted successfully!')
    }

  } catch (error: any) {
    console.error('❌ Error:', error)
  }
}

fixDeleteUser()
