-- Create FAQs table for managing frequently asked questions
-- Supports real-time updates and admin management

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

CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_faqs_updated_at();

-- Enable Row Level Security
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

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
ALTER PUBLICATION supabase_realtime ADD TABLE faqs;

-- Add comments for documentation
COMMENT ON TABLE faqs IS 'Frequently asked questions managed by admins and displayed on homepage';
COMMENT ON COLUMN faqs.display_order IS 'Order in which FAQs are displayed (lower numbers appear first)';
COMMENT ON COLUMN faqs.is_active IS 'Whether the FAQ is active and should be displayed on the homepage';
