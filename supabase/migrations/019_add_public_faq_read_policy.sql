-- Add public read policy for active FAQs
-- This allows the homepage (public/unauthenticated) to display FAQs

-- Allow anonymous/public users to read active FAQs
CREATE POLICY "Allow public to read active FAQs"
  ON faqs
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
