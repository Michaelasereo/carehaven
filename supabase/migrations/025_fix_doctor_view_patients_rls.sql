-- Fix the recursive RLS policy for doctors viewing patient profiles
-- The previous policy had a subquery that referenced profiles from within profiles RLS,
-- causing a circular dependency that prevented doctors from seeing patient profiles.

-- Step 1: Create a SECURITY DEFINER function to check if current user is a doctor
-- This bypasses RLS when checking the user's role
CREATE OR REPLACE FUNCTION public.is_current_user_doctor()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'doctor'
  );
END;
$$;

-- Step 2: Drop the problematic policy
DROP POLICY IF EXISTS "Doctors can view patient profiles" ON profiles;

-- Step 3: Create new policy using the SECURITY DEFINER function
CREATE POLICY "Doctors can view patient profiles"
  ON profiles FOR SELECT
  USING (
    public.is_current_user_doctor() AND role = 'patient'
  );

-- Add a comment for documentation
COMMENT ON FUNCTION public.is_current_user_doctor() IS 
'Helper function to check if current authenticated user is a doctor. Uses SECURITY DEFINER to bypass RLS and prevent circular dependencies in RLS policies.';
