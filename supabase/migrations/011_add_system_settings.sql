-- System Settings table for global configuration
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_price DECIMAL(10, 2) NOT NULL DEFAULT 5000.00,
  currency TEXT DEFAULT 'NGN',
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create single default row with consultation price of 50 naira (5000 kobo)
INSERT INTO system_settings (consultation_price) VALUES (5000.00);

-- Add constraint to ensure only one settings row exists
-- Using a trigger-based approach since CHECK constraints can't reference other rows
CREATE OR REPLACE FUNCTION ensure_single_system_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM system_settings) > 1 THEN
    RAISE EXCEPTION 'Only one system_settings row is allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER single_system_settings_trigger
  BEFORE INSERT ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_system_settings();

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_settings_updated_at_trigger
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

-- Enable real-time for system_settings table
ALTER PUBLICATION supabase_realtime ADD TABLE system_settings;

-- RLS Policies (allow authenticated users to read, only admins to update)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read system settings
CREATE POLICY "Allow authenticated users to read system settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to update system settings
CREATE POLICY "Allow admins to update system settings"
  ON system_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
