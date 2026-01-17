-- Add super_admin role to profiles table constraint
-- This migration adds 'super_admin' to the role enum constraint

-- Drop existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with super_admin role
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('patient', 'doctor', 'admin', 'super_admin'));

-- Add comment for documentation
COMMENT ON CONSTRAINT profiles_role_check ON profiles IS 
'User role constraint: patient, doctor, admin (full access), super_admin (limited/read-only access)';
