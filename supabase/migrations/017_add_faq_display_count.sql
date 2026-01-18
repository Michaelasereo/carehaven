-- Add faq_display_count to system_settings table
-- Controls how many FAQs are displayed on the homepage
-- Default: 4 (to match current hardcoded FAQ count)

ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS faq_display_count INTEGER NOT NULL DEFAULT 4;

-- Update existing row with default value if not set
UPDATE system_settings 
SET faq_display_count = 4 
WHERE faq_display_count IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN system_settings.faq_display_count IS 'Number of FAQs to display on the homepage (default: 4). Admins can configure this in the dashboard.';
