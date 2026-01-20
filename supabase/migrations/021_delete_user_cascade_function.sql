-- ============================================================================
-- CASCADE DELETE FUNCTION FOR USER DELETION
-- ============================================================================
-- 
-- IMPORTANT: This is a SQL file - run it in Supabase SQL Editor
-- DO NOT copy TypeScript/JavaScript code into SQL Editor!
--
-- Usage after creating this function:
--   SELECT delete_user_cascade('user-uuid-here');
--
-- This function handles all foreign key constraints properly and deletes
-- users from all related tables in the correct order.
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_user_cascade(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_name TEXT;
  constraint_name TEXT;
  sql_query TEXT;
  deleted_count INTEGER;
BEGIN
  -- Step 1: Delete from public schema tables that reference profiles (which references auth.users)
  -- These need to be deleted first because they reference profiles, not auth.users directly
  
  -- Delete appointments (references profiles via patient_id and doctor_id)
  DELETE FROM public.appointments 
  WHERE patient_id = target_user_id OR doctor_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % appointment(s)', deleted_count;
  END IF;
  
  -- Delete consultation_notes (references profiles via doctor_id)
  DELETE FROM public.consultation_notes 
  WHERE doctor_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % consultation note(s)', deleted_count;
  END IF;
  
  -- Delete prescriptions (references profiles via patient_id and doctor_id)
  DELETE FROM public.prescriptions 
  WHERE patient_id = target_user_id OR doctor_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % prescription(s)', deleted_count;
  END IF;
  
  -- Delete investigations (references profiles via patient_id and doctor_id)
  DELETE FROM public.investigations 
  WHERE patient_id = target_user_id OR doctor_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % investigation(s)', deleted_count;
  END IF;
  
  -- Delete investigation_requests if it exists (references profiles)
  BEGIN
    DELETE FROM public.investigation_requests 
    WHERE patient_id = target_user_id OR doctor_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
      RAISE NOTICE 'Deleted % investigation request(s)', deleted_count;
    END IF;
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist, skip
      NULL;
  END;
  
  -- Delete notifications (references profiles via user_id)
  DELETE FROM public.notifications 
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % notification(s)', deleted_count;
  END IF;
  
  -- Delete messages (references profiles via sender_id and receiver_id)
  DELETE FROM public.messages 
  WHERE sender_id = target_user_id OR receiver_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % message(s)', deleted_count;
  END IF;
  
  -- Delete doctor_availability (references profiles via doctor_id)
  DELETE FROM public.doctor_availability 
  WHERE doctor_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % doctor availability record(s)', deleted_count;
  END IF;
  
  -- Step 2: Delete from tables that directly reference auth.users
  
  -- Delete email_verification_codes (references auth.users)
  BEGIN
    DELETE FROM public.email_verification_codes 
    WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
      RAISE NOTICE 'Deleted % email verification code(s)', deleted_count;
    END IF;
  EXCEPTION
    WHEN undefined_table THEN
      NULL;
  END;
  
  -- Delete email_verification_tokens (references auth.users)
  BEGIN
    DELETE FROM public.email_verification_tokens 
    WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
      RAISE NOTICE 'Deleted % email verification token(s)', deleted_count;
    END IF;
  EXCEPTION
    WHEN undefined_table THEN
      NULL;
  END;
  
  -- Delete auto_signin_tokens (references auth.users)
  BEGIN
    DELETE FROM public.auto_signin_tokens 
    WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
      RAISE NOTICE 'Deleted % auto signin token(s)', deleted_count;
    END IF;
  EXCEPTION
    WHEN undefined_table THEN
      NULL;
  END;
  
  -- Note: audit_logs, faqs, and system_settings use ON DELETE SET NULL,
  -- so they don't need explicit deletion (they'll be set to NULL automatically)
  
  -- Step 3: Delete from profiles (references auth.users with CASCADE, but we'll do it explicitly)
  DELETE FROM public.profiles 
  WHERE id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted profile';
  END IF;
  
  -- Step 4: Delete from auth schema tables
  BEGIN
    -- Delete from auth.identities
    DELETE FROM auth.identities WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
      RAISE NOTICE 'Deleted % identity/identities', deleted_count;
    END IF;
    
    -- Delete from auth.sessions
    DELETE FROM auth.sessions WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
      RAISE NOTICE 'Deleted % session(s)', deleted_count;
    END IF;
    
    -- Delete from auth.mfa_factors
    BEGIN
      DELETE FROM auth.mfa_factors WHERE user_id = target_user_id;
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      IF deleted_count > 0 THEN
        RAISE NOTICE 'Deleted % MFA factor(s)', deleted_count;
      END IF;
    EXCEPTION
      WHEN undefined_table THEN
        NULL;
    END;
    
    -- Delete from auth.mfa_challenges
    BEGIN
      DELETE FROM auth.mfa_challenges WHERE user_id = target_user_id;
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      IF deleted_count > 0 THEN
        RAISE NOTICE 'Deleted % MFA challenge(s)', deleted_count;
      END IF;
    EXCEPTION
      WHEN undefined_table THEN
        NULL;
    END;
    
    -- Finally delete from auth.users
    DELETE FROM auth.users WHERE id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count > 0 THEN
      RAISE NOTICE 'Successfully deleted user %', target_user_id;
      RETURN TRUE;
    ELSE
      RAISE NOTICE 'User % not found in auth.users', target_user_id;
      RETURN FALSE;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error deleting from auth schema: %', SQLERRM;
      RETURN FALSE;
  END;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in delete_user_cascade: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant execute permission to service_role and authenticated users
GRANT EXECUTE ON FUNCTION delete_user_cascade(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION delete_user_cascade(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION delete_user_cascade IS 'Cascades deletion of a user from all related tables. Returns TRUE on success, FALSE on failure.';
