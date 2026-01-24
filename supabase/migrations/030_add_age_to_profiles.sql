-- Add age column to profiles table
-- This allows storing age directly instead of calculating from date_of_birth
-- Both fields can coexist for backward compatibility

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS age INTEGER;

COMMENT ON COLUMN profiles.age IS 'Patient age in years. Can be used instead of date_of_birth for simpler data entry.';
