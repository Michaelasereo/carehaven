# How to Seed Test Doctors

## Option 1: Via Supabase Dashboard (Recommended - Easiest)

### Step 1: Create Auth Users
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Create 3 users:
   - **Email:** `dr.peters@carehaven.test`
   - **Email:** `dr.adetola@carehaven.test`  
   - **Email:** `dr.kemi@carehaven.test`
4. **Copy the User IDs** (you'll need these)

### Step 2: Create Profiles
Run this SQL in Supabase SQL Editor (replace `USER_ID_1`, `USER_ID_2`, `USER_ID_3` with actual IDs):

```sql
-- Dr Peters
INSERT INTO profiles (
  id, role, full_name, specialty, consultation_fee, 
  license_verified, email, profile_completed, bio, years_experience
) VALUES (
  'USER_ID_1',  -- Replace with actual auth user ID
  'doctor',
  'Dr Peters',
  'Gastroenterologist',
  20000.00,
  true,
  'dr.peters@carehaven.test',
  true,
  'Experienced gastroenterologist specializing in digestive health.',
  15
) ON CONFLICT (id) DO NOTHING;

-- Dr Adetola
INSERT INTO profiles (
  id, role, full_name, specialty, consultation_fee, 
  license_verified, email, profile_completed, bio, years_experience
) VALUES (
  'USER_ID_2',  -- Replace with actual auth user ID
  'doctor',
  'Dr Adetola',
  'Cardiologist',
  20000.00,
  true,
  'dr.adetola@carehaven.test',
  true,
  'Board-certified cardiologist with expertise in heart health.',
  12
) ON CONFLICT (id) DO NOTHING;

-- Dr Kemi
INSERT INTO profiles (
  id, role, full_name, specialty, consultation_fee, 
  license_verified, email, profile_completed, bio, years_experience
) VALUES (
  'USER_ID_3',  -- Replace with actual auth user ID
  'doctor',
  'Dr Kemi',
  'Nephrologist',
  20000.00,
  true,
  'dr.kemi@carehaven.test',
  true,
  'Specialist in kidney health and renal diseases.',
  10
) ON CONFLICT (id) DO NOTHING;
```

---

## Option 2: Quick Test (No Auth Users - UI Testing Only)

If you just need to test the doctor selection UI and don't need them to log in:

**⚠️ WARNING:** This bypasses the foreign key constraint. Only use for UI testing.

```sql
-- Temporarily disable foreign key check (PostgreSQL doesn't support this easily)
-- Better to use Option 1 or Option 3
```

---

## Option 3: Use Supabase Management API (Programmatic)

Create a script to create users via Supabase Admin API:

```typescript
// scripts/seed-doctors.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedDoctors() {
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

  for (const doctor of doctors) {
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
      console.error(`Error creating auth user for ${doctor.email}:`, authError)
      continue
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
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
      console.error(`Error creating profile for ${doctor.email}:`, profileError)
    } else {
      console.log(`✅ Created ${doctor.full_name}`)
    }
  }
}

seedDoctors()
```

Run with:
```bash
npx tsx scripts/seed-doctors.ts
```

---

## Quick Verification

After seeding, verify doctors exist:

```sql
SELECT id, full_name, specialty, consultation_fee, license_verified 
FROM profiles 
WHERE role = 'doctor' 
  AND email LIKE '%@carehaven.test';
```

You should see 3 doctors.

---

## For Production

Don't use test emails. Create real doctor accounts through:
1. Supabase Auth Dashboard
2. Your application's doctor enrollment flow
3. Admin API with proper credentials

