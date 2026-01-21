/**
 * Setup Storage RLS Policies
 * 
 * Run: npx tsx scripts/setup-storage-rls-policies.ts
 * 
 * Requires: SUPABASE_SERVICE_ROLE_KEY in .env.local
 * 
 * This script uses the service role key to create storage RLS policies
 * that require elevated privileges.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function setupStoragePolicies() {
  console.log('🔧 Setting up Storage RLS Policies...\n')

  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'scripts', 'setup-storage-rls-policies.sql')
    const sql = readFileSync(sqlPath, 'utf-8')

    // Execute the SQL
    console.log('📝 Executing SQL policies...')
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // If the RPC function doesn't exist, try direct SQL execution via REST API
      console.log('⚠️  RPC method failed, trying direct SQL execution...')
      
      // Split SQL into individual statements and execute them
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        try {
          // Use the PostgREST endpoint for raw SQL (if available)
          const { error: execError } = await supabase
            .from('_realtime')
            .select('*')
            .limit(0) // This won't work for SQL execution
          
          // Alternative: Execute via REST API with service role
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey!,
              'Authorization': `Bearer ${supabaseServiceKey!}`,
            },
            body: JSON.stringify({ sql_query: statement }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.warn(`⚠️  Could not execute statement: ${statement.substring(0, 50)}...`)
            console.warn(`   Error: ${errorText}`)
          }
        } catch (err: any) {
          console.warn(`⚠️  Error executing statement: ${err.message}`)
        }
      }

      console.log('\n💡 Note: Direct SQL execution may not work for storage policies.')
      console.log('   Please run the SQL manually in Supabase Dashboard SQL Editor.')
      console.log('   Or set up policies through Storage → Policies UI.\n')
      console.log('📄 SQL file location: scripts/setup-storage-rls-policies.sql')
      return
    }

    console.log('✅ Storage RLS policies created successfully!')
    console.log('\n🔍 Verifying policies...')

    // Verify policies were created by checking storage.objects policies
    const { data: policies, error: checkError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'storage')
      .eq('tablename', 'objects')

    if (checkError) {
      console.warn('⚠️  Could not verify policies:', checkError.message)
    } else {
      console.log(`✅ Found ${policies?.length || 0} storage policies`)
      if (policies && policies.length > 0) {
        policies.forEach((policy: any) => {
          console.log(`   - ${policy.policyname}`)
        })
      }
    }

  } catch (error: any) {
    console.error('❌ Error setting up storage policies:', error.message)
    console.error('\n💡 This operation requires elevated privileges.')
    console.error('   Please run the SQL manually in Supabase Dashboard SQL Editor:')
    console.error('   📄 scripts/setup-storage-rls-policies.sql')
    console.error('\n   Or set up policies through Storage → Policies UI in Dashboard.')
    process.exit(1)
  }
}

setupStoragePolicies()
