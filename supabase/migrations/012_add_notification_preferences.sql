-- Add notification_preferences column to profiles table
-- This column stores user preferences for email and SMS notifications

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": true}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN profiles.notification_preferences IS 'User notification preferences: {"email": boolean, "sms": boolean}. Defaults to both enabled.';
