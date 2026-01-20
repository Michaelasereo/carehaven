-- SQL Script to Check Doctor Availability Data
-- Run this in Supabase SQL Editor to diagnose availability issues

-- 1. List all verified doctors
SELECT 
  id,
  full_name,
  email,
  role,
  license_verified,
  consultation_fee
FROM profiles
WHERE role = 'doctor' AND license_verified = true
ORDER BY full_name;

-- 2. Check if any availability records exist at all
SELECT 
  COUNT(*) as total_availability_records,
  COUNT(DISTINCT doctor_id) as doctors_with_availability,
  COUNT(CASE WHEN active = true THEN 1 END) as active_records,
  COUNT(CASE WHEN active = false THEN 1 END) as inactive_records
FROM doctor_availability;

-- 3. Show all availability records with doctor names
SELECT 
  da.id,
  p.full_name as doctor_name,
  p.email as doctor_email,
  da.doctor_id,
  CASE da.day_of_week
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
    ELSE 'Unknown'
  END as day_name,
  da.day_of_week,
  da.start_time,
  da.end_time,
  da.active,
  da.created_at,
  da.updated_at
FROM doctor_availability da
LEFT JOIN profiles p ON da.doctor_id = p.id
ORDER BY p.full_name, da.day_of_week, da.start_time;

-- 4. Show only ACTIVE availability records (what booking flow queries)
SELECT 
  da.id,
  p.full_name as doctor_name,
  p.email as doctor_email,
  da.doctor_id,
  CASE da.day_of_week
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
    ELSE 'Unknown'
  END as day_name,
  da.day_of_week,
  da.start_time,
  da.end_time,
  da.active,
  da.created_at,
  da.updated_at
FROM doctor_availability da
LEFT JOIN profiles p ON da.doctor_id = p.id
WHERE da.active = true
ORDER BY p.full_name, da.day_of_week, da.start_time;

-- 5. Count availability per doctor
SELECT 
  p.full_name as doctor_name,
  p.email as doctor_email,
  da.doctor_id,
  COUNT(*) as total_slots,
  COUNT(CASE WHEN da.active = true THEN 1 END) as active_slots,
  COUNT(CASE WHEN da.active = false THEN 1 END) as inactive_slots,
  STRING_AGG(
    DISTINCT (CASE da.day_of_week
      WHEN 0 THEN 'Sun (0)'
      WHEN 1 THEN 'Mon (1)'
      WHEN 2 THEN 'Tue (2)'
      WHEN 3 THEN 'Wed (3)'
      WHEN 4 THEN 'Thu (4)'
      WHEN 5 THEN 'Fri (5)'
      WHEN 6 THEN 'Sat (6)'
    END),
    ', '
  ) as days_with_availability
FROM doctor_availability da
LEFT JOIN profiles p ON da.doctor_id = p.id
GROUP BY p.full_name, p.email, da.doctor_id
ORDER BY p.full_name;

-- 6. Check for specific doctor (replace 'DOCTOR_EMAIL_HERE' with actual email)
-- SELECT 
--   p.id as doctor_id,
--   p.full_name as doctor_name,
--   p.email as doctor_email,
--   da.id as availability_id,
--   CASE da.day_of_week
--     WHEN 0 THEN 'Sunday'
--     WHEN 1 THEN 'Monday'
--     WHEN 2 THEN 'Tuesday'
--     WHEN 3 THEN 'Wednesday'
--     WHEN 4 THEN 'Thursday'
--     WHEN 5 THEN 'Friday'
--     WHEN 6 THEN 'Saturday'
--   END as day_name,
--   da.day_of_week,
--   da.start_time,
--   da.end_time,
--   da.active
-- FROM profiles p
-- LEFT JOIN doctor_availability da ON p.id = da.doctor_id
-- WHERE p.email = 'DOCTOR_EMAIL_HERE' AND p.role = 'doctor'
-- ORDER BY da.day_of_week, da.start_time;

-- 7. Check RLS policies on doctor_availability table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'doctor_availability';

-- 8. Test query as it would be executed by the booking form
-- Replace 'DOCTOR_ID_HERE' with an actual doctor ID from query 1
-- SELECT *
-- FROM doctor_availability
-- WHERE doctor_id = 'DOCTOR_ID_HERE'
--   AND active = true
-- ORDER BY day_of_week ASC, start_time ASC;
