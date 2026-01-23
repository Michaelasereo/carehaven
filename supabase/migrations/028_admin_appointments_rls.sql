-- Allow admins to view all appointments
-- Uses is_current_user_admin() from migration 027 (SECURITY DEFINER)
CREATE POLICY "Admins can view all appointments"
  ON appointments FOR SELECT
  USING (public.is_current_user_admin());

-- Allow admins to create appointments for any patient
CREATE POLICY "Admins can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (public.is_current_user_admin());

-- Allow admins to update any appointment
CREATE POLICY "Admins can update all appointments"
  ON appointments FOR UPDATE
  USING (public.is_current_user_admin());
