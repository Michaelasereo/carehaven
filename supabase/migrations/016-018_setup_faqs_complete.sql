-- Complete FAQ Setup Script
-- Run this script in Supabase SQL Editor to set up FAQs system
-- This combines migrations 016, 017, and 018

-- ============================================
-- Step 1: Create FAQs table (Migration 016)
-- ============================================

CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_faqs_display_order ON faqs(display_order);
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_active_order ON faqs(is_active, display_order);

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_faqs_updated_at();

-- Enable Row Level Security
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow authenticated users to read active FAQs" ON faqs;
DROP POLICY IF EXISTS "Allow admins to read all FAQs" ON faqs;
DROP POLICY IF EXISTS "Allow admins to insert FAQs" ON faqs;
DROP POLICY IF EXISTS "Allow admins to update FAQs" ON faqs;
DROP POLICY IF EXISTS "Allow admins to delete FAQs" ON faqs;

-- RLS Policies
-- Allow all authenticated users to read active FAQs
CREATE POLICY "Allow authenticated users to read active FAQs"
  ON faqs
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow admins and super_admins to read all FAQs
CREATE POLICY "Allow admins to read all FAQs"
  ON faqs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Allow admins and super_admins to insert FAQs
CREATE POLICY "Allow admins to insert FAQs"
  ON faqs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Allow admins and super_admins to update FAQs
CREATE POLICY "Allow admins to update FAQs"
  ON faqs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Allow admins and super_admins to delete FAQs
CREATE POLICY "Allow admins to delete FAQs"
  ON faqs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Allow anonymous/public users to read active FAQs (for homepage)
CREATE POLICY "Allow public to read active FAQs"
  ON faqs
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Enable realtime for FAQs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'faqs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE faqs;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE faqs IS 'Frequently asked questions managed by admins and displayed on homepage';
COMMENT ON COLUMN faqs.display_order IS 'Order in which FAQs are displayed (lower numbers appear first)';
COMMENT ON COLUMN faqs.is_active IS 'Whether the FAQ is active and should be displayed on the homepage';

-- ============================================
-- Step 2: Add FAQ display count to system_settings (Migration 017)
-- ============================================

ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS faq_display_count INTEGER NOT NULL DEFAULT 4;

-- Update existing row with default value if not set
UPDATE system_settings 
SET faq_display_count = 4 
WHERE faq_display_count IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN system_settings.faq_display_count IS 'Number of FAQs to display on the homepage (default: 4). Admins can configure this in the dashboard.';

-- ============================================
-- Step 3: Seed initial FAQs (Migration 018)
-- ============================================

-- Insert initial FAQs only if they don't already exist
INSERT INTO faqs (question, answer, display_order, is_active, created_at, updated_at)
SELECT * FROM (VALUES
  (
    'What is Care Haven?',
    'Care Haven is a secure and confidential digital health platform designed for encrypted video consultations, virtual visits, electronic prescriptions, lab referrals, and health record management.',
    0,
    true,
    NOW(),
    NOW()
  ),
  (
    'Is my information secure?',
    'Yes, absolutely. Care Haven uses industry-leading security measures including end-to-end encryption, HIPAA-compliant data storage, and regular security audits. Your personal health information is protected with the same standards used by major healthcare institutions.',
    1,
    true,
    NOW(),
    NOW()
  ),
  (
    'How do I book an appointment?',
    'Booking an appointment is simple. Sign up for a free account, browse available healthcare providers, select a convenient time slot, and confirm your appointment. You''ll receive confirmation and reminders via email and SMS before your consultation.',
    2,
    true,
    NOW(),
    NOW()
  ),
  (
    'Can I get a prescription through Care Haven?',
    'Yes, licensed healthcare providers on our platform can issue electronic prescriptions after a consultation. Prescriptions are sent directly to your preferred pharmacy and can also be viewed in your Care Haven account for easy reference and management.',
    3,
    true,
    NOW(),
    NOW()
  )
) AS v(question, answer, display_order, is_active, created_at, updated_at)
WHERE NOT EXISTS (
  SELECT 1 FROM faqs WHERE faqs.question = v.question
);

-- ============================================
-- Success message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'FAQ system setup completed successfully!';
  RAISE NOTICE 'Created FAQs table, added display count setting, and seeded 4 initial FAQs.';
END $$;
