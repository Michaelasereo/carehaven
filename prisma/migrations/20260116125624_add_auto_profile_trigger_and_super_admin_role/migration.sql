-- Migration: Add auto-profile creation trigger and super_admin role
-- This migration:
-- 1. Adds super_admin to the role constraint
-- 2. Creates a trigger to automatically create profiles when users sign up

-- Step 1: Update role constraint to include super_admin
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('patient', 'doctor', 'admin', 'super_admin'));

COMMENT ON CONSTRAINT profiles_role_check ON profiles IS 
'User role constraint: patient, doctor, admin (full access), super_admin (limited/read-only access)';

-- Step 2: Create function to automatically create profile when a new user signs up
-- This handles both email/password and OAuth signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, profile_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger that fires after a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
