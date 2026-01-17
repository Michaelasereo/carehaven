-- Add missing profile fields referenced in UI
-- These fields are used in PatientDemographics component and profile forms

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.occupation IS 'Patient occupation';
COMMENT ON COLUMN profiles.marital_status IS 'Patient marital status';

