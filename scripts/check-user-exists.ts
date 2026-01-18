/**
 * Check if a user exists and optionally delete them
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function checkUser(email: string) {
  console.log(`🔍 Checking user: ${email}\n`)

  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Error fetching users:', error)
      return
    }

    const user = users?.find(u => u.email === email)
    
    if (!user) {
      console.log(`✅ User ${email} does NOT exist`)
      console.log('   You can sign up with this email')
      return
    }

    console.log(`⚠️  User ${email} EXISTS`)
    console.log(`   User ID: ${user.id}`)
    console.log(`   Created: ${user.created_at}`)
    console.log(`   Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
    console.log(`   Last sign in: ${user.last_sign_in_at || 'Never'}`)
    
    // Check if profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      console.log(`   Profile exists: ${profile.role}`)
      console.log(`   Profile completed: ${profile.profile_completed}`)
    } else {
      console.log('   No profile found')
    }
    
    console.log('\n💡 To delete this user and start fresh:')
    console.log(`   npx tsx scripts/fix-delete-user.ts`)
    console.log('   (Or use a different email address for testing)')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

const email = process.argv[2] || 'asereope@gmail.com'
checkUser(email)
