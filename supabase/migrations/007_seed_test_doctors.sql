-- Seed test doctors for development/testingory
-- IMPORTANT: This script creates auth users first, then profiles
-- Run this in Supabase SQL Editor (not via migration)
-- 
-- For production, use Supabase Auth dashboard or API to create users properly

-- Step 1: Create auth users (using Supabase auth functions)
-- Note: These will create users that can log in with email/password
-- For Google OAuth, you'll need to create them via the Auth dashboard

-- Doctor 1: Dr Peters (Gastroenterologist)
DO $$
DECLARE
  doctor1_id UUID;
  doctor2_id UUID;
  doctor3_id UUID;
BEGIN
  -- Create auth user for Dr Peters
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'dr.peters@carehaven.test',
    crypt('TestPassword123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Dr Peters"}',
    false,
    '',
    ''
  ) RETURNING id INTO doctor1_id;

  -- Create profile for Dr Peters
  INSERT INTO profiles (
    id, role, full_name, specialty, consultation_fee, 
    license_verified, email, profile_completed, bio, years_experience
  ) VALUES (
    doctor1_id,
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

  -- Create auth user for Dr Adetola
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'dr.adetola@carehaven.test',
    crypt('TestPassword123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Dr Adetola"}',
    false,
    '',
    ''
  ) RETURNING id INTO doctor2_id;

  -- Create profile for Dr Adetola
  INSERT INTO profiles (
    id, role, full_name, specialty, consultation_fee, 
    license_verified, email, profile_completed, bio, years_experience
  ) VALUES (
    doctor2_id,
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

  -- Create auth user for Dr Kemi
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'dr.kemi@carehaven.test',
    crypt('TestPassword123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Dr Kemi"}',
    false,
    '',
    ''
  ) RETURNING id INTO doctor3_id;

  -- Create profile for Dr Kemi
  INSERT INTO profiles (
    id, role, full_name, specialty, consultation_fee, 
    license_verified, email, profile_completed, bio, years_experience
  ) VALUES (
    doctor3_id,
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

END $$;

