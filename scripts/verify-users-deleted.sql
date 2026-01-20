-- ============================================================================
-- Verification Query: Check Remaining Users After Deletion
-- ============================================================================
-- Run this in Supabase SQL Editor to verify the cleanup results
-- ============================================================================

-- Check remaining users count by role
SELECT 
  COALESCE(p.role, 'unknown') as role,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
GROUP BY COALESCE(p.role, 'unknown')
ORDER BY 
  CASE 
    WHEN COALESCE(p.role, 'unknown') = 'super_admin' THEN 1
    WHEN COALESCE(p.role, 'unknown') = 'admin' THEN 2
    ELSE 3
  END;

-- List all remaining users with details
SELECT 
  u.id,
  u.email,
  COALESCE(p.role, 'unknown') as role,
  u.created_at,
  CASE 
    WHEN COALESCE(p.role, 'unknown') IN ('admin', 'super_admin') THEN '✅ PRESERVED'
    ELSE '⚠️ SHOULD BE DELETED'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY 
  CASE WHEN COALESCE(p.role, 'unknown') IN ('admin', 'super_admin') THEN 0 ELSE 1 END,
  p.role,
  u.email;

-- Summary
SELECT 
  COUNT(*) FILTER (WHERE COALESCE(p.role, 'unknown') IN ('admin', 'super_admin')) as admin_users_preserved,
  COUNT(*) FILTER (WHERE COALESCE(p.role, 'unknown') NOT IN ('admin', 'super_admin')) as non_admin_users_remaining,
  COUNT(*) as total_users
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;
