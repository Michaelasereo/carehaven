-- ============================================================================
-- Delete Orphaned Auth Users (Users without Profiles)
-- ============================================================================
-- This script deletes users that exist in auth.users but don't have profiles
-- It manually deletes from all auth tables first to avoid foreign key errors
-- ============================================================================

-- List of orphaned user emails to delete (users without profiles, not admin)
-- These are the specific emails that need to be deleted:
-- - themichaelsjournal@gmail.com
-- - michaelasereoo@gmail.com
-- - test-doctor-1768843479767@example.com
-- - test-doctor-1768842860388@example.com
-- - test-doctor-1768841916870@example.com
-- - asereope@gmail.com
-- - asereopeyemi1@gmail.com
-- - blessingayoadebayo@gmail.com
-- - skyegenius@gmail.com
-- - obgynect@gmail.com
-- - michael@opportunedesignco.com

DO $$
DECLARE
  user_ids UUID[];
  user_record RECORD;
  deleted_count INTEGER;
  orphaned_count INTEGER;
BEGIN
  -- Get orphaned user IDs (users in auth.users but not in profiles, and not admin)
  SELECT array_agg(u.id)
  INTO user_ids
  FROM auth.users u
  WHERE u.id NOT IN (SELECT id FROM public.profiles)
  AND u.id NOT IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  AND u.email IN (
    'themichaelsjournal@gmail.com',
    'michaelasereoo@gmail.com',
    'test-doctor-1768843479767@example.com',
    'test-doctor-1768842860388@example.com',
    'test-doctor-1768841916870@example.com',
    'asereope@gmail.com',
    'asereopeyemi1@gmail.com',
    'blessingayoadebayo@gmail.com',
    'skyegenius@gmail.com',
    'obgynect@gmail.com',
    'michael@opportunedesignco.com'
  );
  
  -- Count orphaned users
  SELECT COUNT(*) INTO orphaned_count
  FROM auth.users u
  WHERE u.id = ANY(COALESCE(user_ids, ARRAY[]::UUID[]));
  
  IF orphaned_count IS NULL OR orphaned_count = 0 THEN
    RAISE NOTICE 'No orphaned users found.';
    RETURN;
  END IF;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Found % orphaned auth user(s) to delete:', orphaned_count;
  RAISE NOTICE '============================================================';
  
  FOR user_record IN 
    SELECT u.id, u.email
    FROM auth.users u
    WHERE u.id = ANY(COALESCE(user_ids, ARRAY[]::UUID[]))
    ORDER BY u.email
  LOOP
    RAISE NOTICE '  - %', user_record.email;
  END LOOP;
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Starting deletion from auth schema...';
  RAISE NOTICE '';
  
  -- Delete from auth schema tables (order matters!)
  -- Must also delete from public.audit_logs which has foreign key to users
  
  -- Delete from public.audit_logs first (has foreign key constraint)
  DELETE FROM public.audit_logs WHERE user_id = ANY(COALESCE(user_ids, ARRAY[]::UUID[]));
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE '  Deleted % audit log(s)', deleted_count;
  END IF;
  
  -- Delete from auth.sessions (user_id is UUID in this table)
  DELETE FROM auth.sessions WHERE user_id = ANY(COALESCE(user_ids, ARRAY[]::UUID[]));
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE '  Deleted % session(s)', deleted_count;
  END IF;
  
  -- Delete from auth.identities (must be deleted before users)
  DELETE FROM auth.identities WHERE user_id = ANY(COALESCE(user_ids, ARRAY[]::UUID[]));
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE '  Deleted % identity/identities', deleted_count;
  END IF;
  
  -- Finally delete from auth.users
  DELETE FROM auth.users WHERE id = ANY(COALESCE(user_ids, ARRAY[]::UUID[]));
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE '  Deleted % user(s) from auth.users', deleted_count;
  END IF;
  
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

-- Verify results
SELECT 
  COUNT(*) FILTER (WHERE COALESCE(p.role, 'unknown') IN ('admin', 'super_admin')) as admin_users_preserved,
  COUNT(*) FILTER (WHERE COALESCE(p.role, 'unknown') NOT IN ('admin', 'super_admin')) as non_admin_users_remaining,
  COUNT(*) FILTER (WHERE p.id IS NULL) as orphaned_users_remaining,
  COUNT(*) as total_users
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- List remaining users for verification
SELECT 
  u.email,
  COALESCE(p.role, 'orphaned (no profile)') as role,
  CASE 
    WHEN COALESCE(p.role, 'unknown') IN ('admin', 'super_admin') THEN '✅ PRESERVED'
    WHEN p.id IS NULL THEN '⚠️ ORPHANED - Should be deleted'
    ELSE '⚠️ SHOULD BE DELETED'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY 
  CASE WHEN COALESCE(p.role, 'unknown') IN ('admin', 'super_admin') THEN 0 ELSE 1 END,
  u.email;
