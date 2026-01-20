-- Quick SQL script to delete specific users
-- Run this in Supabase SQL Editor for immediate deletion
-- 
-- IMPORTANT: First run the migration 021_delete_user_cascade_function.sql
-- to create the delete_user_cascade function

-- Option 1: Use the cascade function (RECOMMENDED)
-- Replace the email addresses below with the users you want to delete

DO $$
DECLARE
  user_record RECORD;
  target_emails TEXT[] := ARRAY[
    'asereopeyemi1@gmail.com',
    'blessingayoadebayo@gmail.com',
    'skyegenius@gmail.com',
    'obgynect@gmail.com',
    'michael@opportunedesignco.com'
  ];
  user_id_to_delete UUID;
  delete_result BOOLEAN;
BEGIN
  FOR user_record IN 
    SELECT id, email 
    FROM auth.users 
    WHERE email = ANY(target_emails)
  LOOP
    RAISE NOTICE 'Deleting user: % (%)', user_record.email, user_record.id;
    
    -- Use the cascade function
    SELECT delete_user_cascade(user_record.id) INTO delete_result;
    
    IF delete_result THEN
      RAISE NOTICE '✅ Successfully deleted: %', user_record.email;
    ELSE
      RAISE NOTICE '❌ Failed to delete: %', user_record.email;
    END IF;
  END LOOP;
END $$;

-- Option 2: Manual deletion (if cascade function doesn't exist)
-- Uncomment and use this if the function above doesn't work

/*
-- Step 1: Find user IDs
SELECT id, email 
FROM auth.users 
WHERE email IN (
  'asereopeyemi1@gmail.com',
  'blessingayoadebayo@gmail.com',
  'skyegenius@gmail.com',
  'obgynect@gmail.com',
  'michael@opportunedesignco.com'
);

-- Step 2: Delete dependent data (replace 'user-id-here' with actual IDs from Step 1)
DO $$
DECLARE
  user_id_to_delete UUID := 'user-id-here';
BEGIN
  -- Delete from public tables
  DELETE FROM public.appointments WHERE patient_id = user_id_to_delete OR doctor_id = user_id_to_delete;
  DELETE FROM public.consultation_notes WHERE doctor_id = user_id_to_delete;
  DELETE FROM public.prescriptions WHERE patient_id = user_id_to_delete OR doctor_id = user_id_to_delete;
  DELETE FROM public.investigations WHERE patient_id = user_id_to_delete OR doctor_id = user_id_to_delete;
  DELETE FROM public.notifications WHERE user_id = user_id_to_delete;
  DELETE FROM public.messages WHERE sender_id = user_id_to_delete OR receiver_id = user_id_to_delete;
  DELETE FROM public.doctor_availability WHERE doctor_id = user_id_to_delete;
  DELETE FROM public.profiles WHERE id = user_id_to_delete;
  
  -- Delete from auth tables
  DELETE FROM auth.identities WHERE user_id = user_id_to_delete;
  DELETE FROM auth.sessions WHERE user_id = user_id_to_delete;
  DELETE FROM auth.users WHERE id = user_id_to_delete;
  
  RAISE NOTICE 'User % deleted successfully', user_id_to_delete;
END $$;

-- Step 3: TEMPORARILY disable triggers (LAST RESORT - be careful!)
-- Only use if everything else fails
ALTER TABLE auth.users DISABLE TRIGGER ALL;

DELETE FROM auth.users 
WHERE email IN (
  'asereopeyemi1@gmail.com',
  'blessingayoadebayo@gmail.com',
  'skyegenius@gmail.com',
  'obgynect@gmail.com',
  'michael@opportunedesignco.com'
);

ALTER TABLE auth.users ENABLE TRIGGER ALL;
*/

-- Option 3: Check for blocking foreign keys
-- Run this first to see what's preventing deletion

/*
SELECT
  tc.table_schema, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY'
  AND (ccu.table_name = 'users' AND ccu.table_schema = 'auth')
  AND rc.delete_rule != 'CASCADE'
ORDER BY tc.table_name;
*/
