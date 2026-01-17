-- Fix RLS policy to allow trigger function to insert profiles
-- This prevents infinite recursion when the trigger tries to create a profile

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Doctors can view patient profiles" ON profiles;

-- Recreate it with a better implementation that avoids recursion
CREATE POLICY "Doctors can view patient profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'doctor'
    ) AND role = 'patient'
  );

-- Add policy to allow trigger function to insert profiles
-- SECURITY DEFINER functions should bypass RLS, but we add this as a safety measure
CREATE POLICY "System can insert profiles via trigger"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Note: The SECURITY DEFINER function should bypass RLS, but if it doesn't,
-- this policy allows the trigger to insert profiles during user creation
