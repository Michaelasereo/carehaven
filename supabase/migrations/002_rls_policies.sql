-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Doctors can view patient profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'doctor'
    ) AND role = 'patient'
  );

-- Appointments RLS Policies
CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  USING (
    auth.uid() = patient_id OR 
    auth.uid() = doctor_id
  );

CREATE POLICY "Patients can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  USING (
    auth.uid() = patient_id OR 
    auth.uid() = doctor_id
  );

-- Consultation Notes RLS Policies
CREATE POLICY "Doctors can create consultation notes"
  ON consultation_notes FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Users can view related consultation notes"
  ON consultation_notes FOR SELECT
  USING (
    auth.uid() = doctor_id OR
    auth.uid() IN (
      SELECT patient_id FROM appointments WHERE id = consultation_notes.appointment_id
    )
  );

CREATE POLICY "Doctors can update consultation notes"
  ON consultation_notes FOR UPDATE
  USING (auth.uid() = doctor_id);

-- Prescriptions RLS Policies
CREATE POLICY "Users can view own prescriptions"
  ON prescriptions FOR SELECT
  USING (
    auth.uid() = patient_id OR 
    auth.uid() = doctor_id
  );

CREATE POLICY "Doctors can create prescriptions"
  ON prescriptions FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

-- Investigations RLS Policies
CREATE POLICY "Users can view own investigations"
  ON investigations FOR SELECT
  USING (
    auth.uid() = patient_id OR 
    auth.uid() = doctor_id
  );

CREATE POLICY "Doctors can create investigations"
  ON investigations FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Users can update own investigations"
  ON investigations FOR UPDATE
  USING (
    auth.uid() = patient_id OR 
    auth.uid() = doctor_id
  );

-- Notifications RLS Policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Messages RLS Policies
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Doctor Availability RLS Policies
CREATE POLICY "Doctors can manage own availability"
  ON doctor_availability FOR ALL
  USING (auth.uid() = doctor_id);

CREATE POLICY "Anyone can view doctor availability"
  ON doctor_availability FOR SELECT
  USING (true);

