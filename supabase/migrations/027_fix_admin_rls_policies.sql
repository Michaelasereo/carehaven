-- Fix the recursive RLS policy for admins viewing all profiles
-- The previous policy had a subquery that referenced profiles from within profiles RLS,
-- causing a circular dependency that prevented admins from viewing profiles (including their own).

-- Step 1: Create a SECURITY DEFINER function to check if current user is an admin
-- This bypasses RLS when checking the user's role
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- Step 2: Drop the problematic policy if it exists
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Step 3: Create new policy using the SECURITY DEFINER function
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    public.is_current_user_admin()
  );

-- Add a comment for documentation
COMMENT ON FUNCTION public.is_current_user_admin() IS 
'Helper function to check if current authenticated user is an admin or super_admin. Uses SECURITY DEFINER to bypass RLS and prevent circular dependencies in RLS policies.';
