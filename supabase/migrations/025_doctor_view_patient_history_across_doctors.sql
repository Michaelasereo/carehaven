-- Allow doctors to view a patient's history across doctors
-- Requirement:
-- - If a doctor is seeing a patient, they should be able to view previous session notes
--   from that patient even if authored by other doctors.
--
-- Safety constraint:
-- - Only allow this if the requesting doctor has at least one appointment with the patient.

-- IMPORTANT:
-- Do NOT reference `appointments` directly inside an `appointments` policy (causes infinite recursion in RLS).
-- Use SECURITY DEFINER helper functions to safely check relationships without triggering RLS recursion.

-- Helper: is the current user a doctor?
CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'doctor'
  );
$$;

-- Helper: has the current doctor had any appointment with this patient?
CREATE OR REPLACE FUNCTION public.doctor_has_seen_patient(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_doctor()
  AND EXISTS (
    SELECT 1
    FROM public.appointments a2
    WHERE a2.patient_id = p_patient_id
      AND a2.doctor_id = auth.uid()
  );
$$;

-- Appointments: allow doctors to read all appointments for patients they have seen
DROP POLICY IF EXISTS "Doctors can view patient appointments across doctors" ON appointments;
CREATE POLICY "Doctors can view patient appointments across doctors"
  ON appointments FOR SELECT
  USING (public.doctor_has_seen_patient(appointments.patient_id));

-- Consultation notes: allow doctors to read notes for patients they have seen
DROP POLICY IF EXISTS "Doctors can view patient consultation notes across doctors" ON consultation_notes;
CREATE POLICY "Doctors can view patient consultation notes across doctors"
  ON consultation_notes FOR SELECT
  USING (
    public.is_doctor()
    AND public.doctor_has_seen_patient(
      (SELECT a_note.patient_id FROM public.appointments a_note WHERE a_note.id = consultation_notes.appointment_id)
    )
  );

