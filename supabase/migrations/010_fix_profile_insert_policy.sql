-- Fix RLS policy to allow trigger function to insert profiles
-- This migration ensures that the handle_new_user() trigger can create profiles
-- even when RLS is enabled

-- Step 1: Update the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile - SECURITY DEFINER should bypass RLS
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

-- Step 2: Add permissive INSERT policy for profiles
-- This allows the trigger (and fallback profile creation) to insert profiles
DROP POLICY IF EXISTS "Allow profile creation via trigger" ON profiles;
CREATE POLICY "Allow profile creation via trigger"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Step 3: Ensure trigger exists (in case it was dropped)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
