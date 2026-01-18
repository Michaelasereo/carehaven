-- Seed initial FAQs for the homepage
-- These are the 4 FAQs that were previously hardcoded
-- NOTE: This migration requires migrations 016 and 017 to be run first

-- Only insert if table exists and FAQs don't already exist
DO $$
BEGIN
  -- Check if faqs table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faqs') THEN
    -- Insert FAQs only if they don't already exist
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
  END IF;
END $$;
