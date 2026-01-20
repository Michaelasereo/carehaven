-- Add RLS policy to allow authenticated users (patients) to view verified doctor profiles
-- This is necessary for the booking flow where patients need to see available doctors
-- If auth.uid() IS NOT NULL, the user is authenticated

CREATE POLICY "Authenticated users can view verified doctors"
  ON profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND role = 'doctor' 
    AND license_verified = true
  );
