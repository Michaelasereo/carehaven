/**
 * Debug script to find why a specific user cannot be deleted
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function debugUserDeletion() {
  const email = 'asereope@gmail.com'
  
  console.log(`🔍 Debugging user deletion for: ${email}\n`)
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
      console.log(`ℹ️  User ${email} not found in auth.users`)
      return
    }

    console.log(`✅ Found user: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Created: ${user.created_at}`)
    console.log()

    // Step 2: Check for references in various tables
    console.log('Checking for user references in database tables...\n')

    // Check system_settings
    const { data: systemSettings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .eq('updated_by', user.id)
    
    if (settingsError) {
      if (settingsError.message.includes('does not exist')) {
        console.log('ℹ️  system_settings table does not exist')
      } else {
        console.warn('⚠️  Error checking system_settings:', settingsError.message)
      }
    } else {
      if (systemSettings && systemSettings.length > 0) {
        console.log(`❌ BLOCKER: Found ${systemSettings.length} record(s) in system_settings`)
        console.log('   This table has foreign key WITHOUT ON DELETE CASCADE')
        console.log('   Records:', JSON.stringify(systemSettings, null, 2))
        console.log()
      } else {
        console.log('✅ No references in system_settings')
      }
    }

    // Check audit_logs
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id)
      .limit(5)
    
    if (auditError) {
      console.warn('⚠️  Error checking audit_logs:', auditError.message)
    } else {
      if (auditLogs && auditLogs.length > 0) {
        console.log(`⚠️  Found ${auditLogs.length} audit log(s) (first 5 shown)`)
        console.log('   This table also has foreign key WITHOUT ON DELETE CASCADE')
        console.log('   Note: Audit logs should typically be preserved, not deleted')
        console.log()
      } else {
        console.log('✅ No references in audit_logs')
      }
    }

    // Check all other tables (with CASCADE, should be fine but let's verify)
    const tables = ['profiles', 'appointments', 'prescriptions', 'investigations', 
                   'notifications', 'messages', 'email_verification_tokens', 
                   'email_verification_codes']
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .or(`user_id.eq.${user.id},patient_id.eq.${user.id},doctor_id.eq.${user.id},sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        
        if (error) {
          if (error.message.includes('does not exist')) {
            // Table doesn't exist, skip
            continue
          }
          console.warn(`⚠️  Error checking ${table}:`, error.message)
        } else {
          if (count && count > 0) {
            console.log(`✅ Found ${count} reference(s) in ${table} (has CASCADE, will auto-delete)`)
          }
        }
      } catch (err) {
        // Table might not exist, continue
      }
    }

    console.log()
    console.log('='.repeat(60))
    console.log('💡 SOLUTION:')
    
    if (systemSettings && systemSettings.length > 0) {
      console.log('The user cannot be deleted because they are referenced in system_settings.')
      console.log('To fix this, you need to:')
      console.log('1. Either delete/update the system_settings records first')
      console.log('2. Or modify the foreign key to use ON DELETE SET NULL or CASCADE')
      console.log()
      console.log('Quick fix - Delete system_settings references:')
      console.log(`   DELETE FROM system_settings WHERE updated_by = '${user.id}';`)
    } else {
      console.log('No obvious blockers found. The issue might be:')
      console.log('- Database-level constraint or trigger')
      console.log('- Supabase admin API limitation')
      console.log('- The user might be a service account or have special permissions')
    }

  } catch (error: any) {
    console.error('❌ Error:', error)
  }
}

debugUserDeletion()
