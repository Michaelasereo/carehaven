-- Fix RLS policy to allow trigger function to insert profiles
-- SECURITY DEFINER functions should bypass RLS, but we'll ensure it works

-- Step 1: Update the trigger function to explicitly handle RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile - SECURITY DEFINER should bypass RLS
  -- But we'll use a direct insert that should work
  INSERT INTO public.profiles (id, email, role, profile_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 2: Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Doctors can view patient profiles" ON profiles;

-- Step 3: Add permissive INSERT policy for trigger
DROP POLICY IF EXISTS "Allow profile creation via trigger" ON profiles;
CREATE POLICY "Allow profile creation via trigger"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Step 4: Recreate doctor view policy without recursion
-- Temporarily disable this policy to avoid recursion issues
-- We can re-enable it later with a better implementation
-- For now, doctors will use the "Users can view own profile" policy
-- CREATE POLICY "Doctors can view patient profiles"
--   ON profiles FOR SELECT
--   USING (
--     role = 'patient' AND
--     EXISTS (
--       SELECT 1 
--       FROM profiles p
--       WHERE p.id = auth.uid() 
--       AND p.role = 'doctor'
--     )
--   );
