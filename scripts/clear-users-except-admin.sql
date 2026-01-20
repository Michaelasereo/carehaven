-- ============================================================================
-- SQL Script to Clear All Users EXCEPT Admin and Super Admin
-- ============================================================================
-- 
-- INSTRUCTIONS:
-- 1. Copy this entire script
-- 2. Open Supabase Dashboard → SQL Editor
-- 3. Paste and run
-- 4. This will delete all non-admin users and their related data
--
-- ⚠️  WARNING: This is irreversible! Make sure you have backups.
-- ============================================================================

-- Step 1: Show what will be deleted (for verification)
DO $$
DECLARE
  admin_count INTEGER;
  non_admin_count INTEGER;
  user_record RECORD;
BEGIN
  -- Count admin users
  SELECT COUNT(*) INTO admin_count
  FROM public.profiles
  WHERE role IN ('admin', 'super_admin');
  
  -- Count non-admin users
  SELECT COUNT(*) INTO non_admin_count
  FROM auth.users
  WHERE id NOT IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
  );
  
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'User Deletion Summary';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Admin/Super Admin users to PRESERVE: %', admin_count;
  RAISE NOTICE 'Non-admin users to DELETE: %', non_admin_count;
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Admin users that will be preserved:';
  
  FOR user_record IN 
    SELECT u.id, u.email, p.role
    FROM auth.users u
    JOIN public.profiles p ON u.id = p.id
    WHERE p.role IN ('admin', 'super_admin')
    ORDER BY p.role, u.email
  LOOP
    RAISE NOTICE '  - % (%)', user_record.email, user_record.role;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Non-admin users that will be deleted:';
  
  FOR user_record IN 
    SELECT u.id, u.email, COALESCE(p.role, 'unknown') as role
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE COALESCE(p.role, 'patient') NOT IN ('admin', 'super_admin')
    ORDER BY u.email
    LIMIT 20
  LOOP
    RAISE NOTICE '  - % (%)', user_record.email, user_record.role;
  END LOOP;
  
  SELECT COUNT(*) INTO non_admin_count
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE COALESCE(p.role, 'patient') NOT IN ('admin', 'super_admin');
  
  IF non_admin_count > 20 THEN
    RAISE NOTICE '  ... and % more users', non_admin_count - 20;
  END IF;
  
  RAISE NOTICE '============================================================';
END $$;

-- Step 2: Delete all non-admin users using cascade delete function
DO $$
DECLARE
  user_record RECORD;
  deleted_count INTEGER := 0;
  failed_count INTEGER := 0;
  result BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Starting deletion process...';
  RAISE NOTICE '';
  
  -- Loop through all non-admin users
  FOR user_record IN 
    SELECT u.id, u.email, COALESCE(p.role, 'unknown') as role
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE COALESCE(p.role, 'patient') NOT IN ('admin', 'super_admin')
    ORDER BY u.email
  LOOP
    BEGIN
      -- Use the cascade delete function
      SELECT delete_user_cascade(user_record.id) INTO result;
      
      IF result = TRUE THEN
        RAISE NOTICE '✅ Deleted: % (%)', user_record.email, user_record.role;
        deleted_count := deleted_count + 1;
      ELSE
        RAISE NOTICE '⚠️  Failed to delete: % (%) - user may not exist or cascade function returned false', user_record.email, user_record.role;
        failed_count := failed_count + 1;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ Error deleting % (%): %', user_record.email, user_record.role, SQLERRM;
        failed_count := failed_count + 1;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Deletion Summary';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ Successfully deleted: % user(s)', deleted_count;
  RAISE NOTICE '❌ Failed to delete: % user(s)', failed_count;
  RAISE NOTICE '============================================================';
END $$;

-- Step 3: Verify admin users are still intact
DO $$
DECLARE
  admin_count INTEGER;
  user_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Verifying preserved admin users...';
  
  SELECT COUNT(*) INTO admin_count
  FROM public.profiles
  WHERE role IN ('admin', 'super_admin');
  
  IF admin_count > 0 THEN
    RAISE NOTICE '';
    FOR user_record IN 
      SELECT u.id, u.email, p.role
      FROM auth.users u
      JOIN public.profiles p ON u.id = p.id
      WHERE p.role IN ('admin', 'super_admin')
      ORDER BY p.role, u.email
    LOOP
      RAISE NOTICE '✅ % (%) - OK', user_record.email, user_record.role;
    END LOOP;
  ELSE
    RAISE WARNING '⚠️  No admin users found!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Cleanup completed!';
  RAISE NOTICE '============================================================';
END $$;

-- Final verification: Show remaining users
SELECT 
  u.id,
  u.email,
  COALESCE(p.role, 'unknown') as role,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY 
  CASE WHEN COALESCE(p.role, 'unknown') IN ('admin', 'super_admin') THEN 0 ELSE 1 END,
  p.role,
  u.email;
