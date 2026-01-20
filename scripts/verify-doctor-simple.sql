-- Verify all revoked doctors
-- Run this in Supabase SQL Editor

-- First, check current status
SELECT 
  id,
  full_name,
  email,
  license_verified,
  role
FROM profiles
WHERE role = 'doctor'
ORDER BY created_at DESC;

-- Then verify all revoked doctors
UPDATE profiles
SET license_verified = true
WHERE role = 'doctor' 
  AND license_verified = false;

-- Verify the update
SELECT 
  id,
  full_name,
  email,
  license_verified
FROM profiles
WHERE role = 'doctor'
ORDER BY created_at DESC;
