-- Add 'waived' to allowed payment_status for admin bookings
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_payment_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'waived'));
