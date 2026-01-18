import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Initialize Supabase Admin Client (requires service role key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface AdminUser {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'super_admin'
}

const adminUsers: AdminUser[] = [
  {
    email: 'mycarehaven@gmail.com',
    password: 'carehaven',
    full_name: 'Super Admin',
    role: 'super_admin',
  },
  {
    email: 'asereopeyemimichael@gmail.com',
    password: 'carehaven',
    full_name: 'Admin',
    role: 'admin',
  },
]

async function createAdminUsers() {
  console.log('🔐 Creating admin users...\n')

  for (const admin of adminUsers) {
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users.find((u) => u.email === admin.email)

      let userId: string

      if (existingUser) {
        console.log(`⚠️  User ${admin.email} already exists`)
        userId = existingUser.id

        // Update password if needed
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          password: admin.password,
        })

        if (updateError) {
          console.error(`   ❌ Error updating password: ${updateError.message}`)
        } else {
          console.log(`   ✅ Password updated`)
        }
      } else {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: admin.email,
          password: admin.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: admin.full_name,
            role: admin.role,
          },
        })

        if (authError) {
          console.error(`❌ Error creating auth user for ${admin.email}:`, authError.message)
          continue
        }

        userId = authData.user.id
        console.log(`✅ Created auth user: ${admin.email} (${admin.role})`)
      }

      // Check if profile exists and update/create it
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .single()

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            role: admin.role,
            full_name: admin.full_name,
            email: admin.email,
            profile_completed: true,
          })
          .eq('id', userId)

        if (updateError) {
          console.error(`   ❌ Error updating profile: ${updateError.message}`)
        } else {
          console.log(`   ✅ Profile updated with role: ${admin.role}`)
        }
      } else {
        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
          id: userId,
          role: admin.role,
          full_name: admin.full_name,
          email: admin.email,
          profile_completed: true,
        })

        if (profileError) {
          console.error(`   ❌ Error creating profile: ${profileError.message}`)
        } else {
          console.log(`   ✅ Profile created with role: ${admin.role}`)
        }
      }
    } catch (error: any) {
      console.error(`❌ Unexpected error for ${admin.email}:`, error.message)
    }
  }

  console.log('\n✨ Admin user creation completed!')
}

// Run the script
createAdminUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
