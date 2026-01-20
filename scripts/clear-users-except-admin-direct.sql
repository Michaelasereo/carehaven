-- ============================================================================
-- DIRECT SQL Script to Clear All Users EXCEPT Admin and Super Admin
-- ============================================================================
-- This script manually deletes all related data first, then deletes users
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Get list of non-admin user IDs
DO $$
DECLARE
  non_admin_user_ids UUID[];
  user_id UUID;
  deleted_count INTEGER := 0;
  admin_count INTEGER;
BEGIN
  -- Get all non-admin user IDs
  SELECT ARRAY_AGG(u.id) INTO non_admin_user_ids
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE COALESCE(p.role, 'patient') NOT IN ('admin', 'super_admin');
  
  -- Show summary
  SELECT COUNT(*) INTO admin_count
  FROM public.profiles
  WHERE role IN ('admin', 'super_admin');
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Starting Direct Deletion';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Admin users to preserve: %', admin_count;
  RAISE NOTICE 'Non-admin users to delete: %', array_length(non_admin_user_ids, 1);
  RAISE NOTICE '============================================================';
  
  IF non_admin_user_ids IS NULL OR array_length(non_admin_user_ids, 1) = 0 THEN
    RAISE NOTICE 'No non-admin users to delete.';
    RETURN;
  END IF;
  
  -- Step 2: Delete related data for each user
  RAISE NOTICE '';
  RAISE NOTICE 'Step 2: Deleting related data...';
  
  -- Delete appointments
  DELETE FROM public.appointments 
  WHERE patient_id = ANY(non_admin_user_ids) OR doctor_id = ANY(non_admin_user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % appointment(s)', deleted_count;
  
  -- Delete consultation notes
  DELETE FROM public.consultation_notes 
  WHERE doctor_id = ANY(non_admin_user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % consultation note(s)', deleted_count;
  
  -- Delete prescriptions
  DELETE FROM public.prescriptions 
  WHERE patient_id = ANY(non_admin_user_ids) OR doctor_id = ANY(non_admin_user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % prescription(s)', deleted_count;
  
  -- Delete investigations
  DELETE FROM public.investigations 
  WHERE patient_id = ANY(non_admin_user_ids) OR doctor_id = ANY(non_admin_user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % investigation(s)', deleted_count;
  
  -- Delete investigation requests (if exists)
  BEGIN
    DELETE FROM public.investigation_requests 
    WHERE patient_id = ANY(non_admin_user_ids) OR doctor_id = ANY(non_admin_user_ids);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '  Deleted % investigation request(s)', deleted_count;
  EXCEPTION
    WHEN undefined_table THEN NULL;
  END;
  
  -- Delete notifications
  DELETE FROM public.notifications 
  WHERE user_id = ANY(non_admin_user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % notification(s)', deleted_count;
  
  -- Delete messages
  DELETE FROM public.messages 
  WHERE sender_id = ANY(non_admin_user_ids) OR receiver_id = ANY(non_admin_user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % message(s)', deleted_count;
  
  -- Delete doctor availability
  DELETE FROM public.doctor_availability 
  WHERE doctor_id = ANY(non_admin_user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % doctor availability record(s)', deleted_count;
  
  -- Delete verification codes (if exists)
  BEGIN
    DELETE FROM public.email_verification_codes 
    WHERE user_id = ANY(non_admin_user_ids);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
      RAISE NOTICE '  Deleted % verification code(s)', deleted_count;
    END IF;
  EXCEPTION
    WHEN undefined_table THEN NULL;
  END;
  
  -- Delete verification tokens (if exists)
  BEGIN
    DELETE FROM public.email_verification_tokens 
    WHERE user_id = ANY(non_admin_user_ids);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
      RAISE NOTICE '  Deleted % verification token(s)', deleted_count;
    END IF;
  EXCEPTION
    WHEN undefined_table THEN NULL;
  END;
  
  -- Delete auto signin tokens (if exists)
  BEGIN
    DELETE FROM public.auto_signin_tokens 
    WHERE user_id = ANY(non_admin_user_ids);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
      RAISE NOTICE '  Deleted % auto signin token(s)', deleted_count;
    END IF;
  EXCEPTION
    WHEN undefined_table THEN NULL;
  END;
  
  -- Step 3: Delete profiles
  RAISE NOTICE '';
  RAISE NOTICE 'Step 3: Deleting profiles...';
  DELETE FROM public.profiles 
  WHERE id = ANY(non_admin_user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % profile(s)', deleted_count;
  
  -- Step 4: Delete from auth schema
  RAISE NOTICE '';
  RAISE NOTICE 'Step 4: Deleting from auth schema...';
  
  -- Delete identities
  DELETE FROM auth.identities 
  WHERE user_id = ANY(non_admin_user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % identity/identities', deleted_count;
  
  -- Delete sessions
  DELETE FROM auth.sessions 
  WHERE user_id = ANY(non_admin_user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % session(s)', deleted_count;
  
  -- Delete MFA factors (if exists)
  BEGIN
    DELETE FROM auth.mfa_factors 
    WHERE user_id = ANY(non_admin_user_ids);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
      RAISE NOTICE '  Deleted % MFA factor(s)', deleted_count;
    END IF;
  EXCEPTION
    WHEN undefined_table THEN NULL;
  END;
  
  -- Delete MFA challenges (if exists)
  BEGIN
    DELETE FROM auth.mfa_challenges 
    WHERE user_id = ANY(non_admin_user_ids);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
      RAISE NOTICE '  Deleted % MFA challenge(s)', deleted_count;
    END IF;
  EXCEPTION
    WHEN undefined_table THEN NULL;
  END;
  
  -- Finally delete users
  DELETE FROM auth.users 
  WHERE id = ANY(non_admin_user_ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '  Deleted % user(s) from auth.users', deleted_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ Deletion completed!';
  RAISE NOTICE '  Total users deleted: %', deleted_count;
  RAISE NOTICE '============================================================';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error during deletion: %', SQLERRM;
    RAISE;
END $$;

-- Step 5: Verify results
SELECT 
  COUNT(*) FILTER (WHERE COALESCE(p.role, 'unknown') IN ('admin', 'super_admin')) as admin_users_preserved,
  COUNT(*) FILTER (WHERE COALESCE(p.role, 'unknown') NOT IN ('admin', 'super_admin')) as non_admin_users_remaining,
  COUNT(*) as total_users
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- List remaining users
SELECT 
  u.email,
  COALESCE(p.role, 'unknown') as role,
  CASE 
    WHEN COALESCE(p.role, 'unknown') IN ('admin', 'super_admin') THEN '✅ PRESERVED'
    ELSE '⚠️ SHOULD BE DELETED'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY 
  CASE WHEN COALESCE(p.role, 'unknown') IN ('admin', 'super_admin') THEN 0 ELSE 1 END,
  u.email;
