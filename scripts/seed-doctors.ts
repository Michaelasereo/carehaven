/**
 * Seed test doctors using Supabase Admin API
 * 
 * Run: npx tsx scripts/seed-doctors.ts
 * 
 * Requires: SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'

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
    persistSession: false
  }
})

const doctors = [
  {
    email: 'dr.peters@carehaven.test',
    password: 'TestPassword123!',
    full_name: 'Dr Peters',
    specialty: 'Gastroenterologist',
    consultation_fee: 20000,
    bio: 'Experienced gastroenterologist specializing in digestive health.',
    years_experience: 15,
  },
  {
    email: 'dr.adetola@carehaven.test',
    password: 'TestPassword123!',
    full_name: 'Dr Adetola',
    specialty: 'Cardiologist',
    consultation_fee: 20000,
    bio: 'Board-certified cardiologist with expertise in heart health.',
    years_experience: 12,
  },
  {
    email: 'dr.kemi@carehaven.test',
    password: 'TestPassword123!',
    full_name: 'Dr Kemi',
    specialty: 'Nephrologist',
    consultation_fee: 20000,
    bio: 'Specialist in kidney health and renal diseases.',
    years_experience: 10,
  },
]

async function seedDoctors() {
  console.log('🌱 Seeding test doctors...\n')

  for (const doctor of doctors) {
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users.find(u => u.email === doctor.email)

      let userId: string

      if (existingUser) {
        console.log(`⚠️  User ${doctor.email} already exists, using existing ID`)
        userId = existingUser.id
      } else {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: doctor.email,
          password: doctor.password,
          email_confirm: true,
          user_metadata: {
            full_name: doctor.full_name,
          },
        })

        if (authError) {
          console.error(`❌ Error creating auth user for ${doctor.email}:`, authError.message)
          continue
        }

        userId = authData.user.id
        console.log(`✅ Created auth user: ${doctor.email}`)
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (existingProfile) {
        console.log(`⚠️  Profile for ${doctor.full_name} already exists, skipping`)
        continue
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          role: 'doctor',
          full_name: doctor.full_name,
          specialty: doctor.specialty,
          consultation_fee: doctor.consultation_fee,
          license_verified: true,
          email: doctor.email,
          profile_completed: true,
          bio: doctor.bio,
          years_experience: doctor.years_experience,
        })

      if (profileError) {
        console.error(`❌ Error creating profile for ${doctor.full_name}:`, profileError.message)
      } else {
        console.log(`✅ Created profile: ${doctor.full_name} (${doctor.specialty})`)
      }
    } catch (error: any) {
      console.error(`❌ Unexpected error for ${doctor.email}:`, error.message)
    }
  }

  console.log('\n✨ Done!')
  console.log('\n📋 Summary:')
  console.log('   You can now test the booking flow with these doctors')
  console.log('   Login emails: dr.peters@carehaven.test, dr.adetola@carehaven.test, dr.kemi@carehaven.test')
  console.log('   Password: TestPassword123!')
}

seedDoctors().catch(console.error)

