-- Test Query to Verify Availability is Accessible
-- Run this as a patient user (not service role) to test RLS

-- First, check if you can query availability for the doctor
-- Replace '1fd48f33-6e25-4c3f-8529-9e4beb250482' with actual doctor ID
SELECT 
  id,
  doctor_id,
  day_of_week,
  start_time,
  end_time,
  active
FROM doctor_availability
WHERE doctor_id = '1fd48f33-6e25-4c3f-8529-9e4beb250482'
  AND active = true
ORDER BY day_of_week, start_time;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'doctor_availability';

-- If the query above returns data, RLS is working
-- If it returns empty or error, RLS policy might be missing
