-- Add consultation_duration to system_settings table
-- Default: 45 minutes (configurable by admin)

ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS consultation_duration INTEGER NOT NULL DEFAULT 45;

-- Update existing row with default value if not set
UPDATE system_settings 
SET consultation_duration = 45 
WHERE consultation_duration IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN system_settings.consultation_duration IS 'Default consultation duration in minutes (default: 45). Total blocking time = duration + 15 min buffer.';
