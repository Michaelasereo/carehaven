-- =============================================================================
-- Care Haven – consolidated schema for a fresh Supabase project
-- Run this in Supabase SQL Editor. Tables, constraints, and RLS are in
-- dependency order so the script can be executed as a single run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Tables (dependency order: profiles first, then tables that reference them)
-- -----------------------------------------------------------------------------

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin', 'super_admin')),
  full_name TEXT,
  avatar_url TEXT,
  email TEXT UNIQUE,
  profile_completed BOOLEAN DEFAULT FALSE,
  onboarded_at TIMESTAMP WITH TIME ZONE,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  phone TEXT,
  blood_group TEXT,
  allergies TEXT[] DEFAULT '{}',
  chronic_conditions TEXT[] DEFAULT '{}',
  occupation TEXT,
  marital_status TEXT,
  license_number TEXT UNIQUE,
  license_verified BOOLEAN DEFAULT FALSE,
  specialty TEXT,
  years_experience TEXT,
  consultation_fee DECIMAL(10, 2) DEFAULT 20000.00,
  currency TEXT DEFAULT 'NGN',
  bio TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "sms": true}'::jsonb,
  age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  chief_complaint TEXT,
  symptoms_description TEXT,
  daily_room_name TEXT UNIQUE,
  daily_room_url TEXT,
  recording_id TEXT,
  recording_url TEXT,
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'NGN',
  paystack_reference TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'waived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultation notes
CREATE TABLE consultation_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  diagnosis TEXT,
  prescription JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  medications JSONB NOT NULL,
  instructions TEXT,
  duration_days INTEGER,
  refills_remaining INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'filled', 'expired', 'cancelled')),
  filled_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investigations
CREATE TABLE investigations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_type TEXT,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'in_progress', 'completed', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  results_url TEXT,
  results_text TEXT,
  interpretation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('appointment', 'prescription', 'investigation', 'message', 'system')),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  attachments JSONB,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctor availability
CREATE TABLE doctor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week, start_time)
);

-- Audit logs (user_id SET NULL on delete so logs are kept when user is deleted)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings (single row; updated_by SET NULL on delete)
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_price DECIMAL(10, 2) NOT NULL DEFAULT 5000.00,
  currency TEXT DEFAULT 'NGN',
  consultation_duration INTEGER NOT NULL DEFAULT 45,
  faq_display_count INTEGER NOT NULL DEFAULT 4,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FAQs
CREATE TABLE faqs (
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

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_specialty ON profiles(specialty) WHERE role = 'doctor';
CREATE INDEX idx_profiles_email ON profiles(email);

CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX idx_appointments_doctor_time ON appointments(doctor_id, scheduled_at, status) WHERE status IN ('scheduled', 'confirmed', 'in_progress');
CREATE INDEX idx_appointments_patient_time ON appointments(patient_id, scheduled_at);

CREATE INDEX idx_consultation_notes_appointment_id ON consultation_notes(appointment_id);
CREATE INDEX idx_consultation_notes_doctor_id ON consultation_notes(doctor_id);

CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_appointment_id ON prescriptions(appointment_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);

CREATE INDEX idx_investigations_patient_id ON investigations(patient_id);
CREATE INDEX idx_investigations_appointment_id ON investigations(appointment_id);
CREATE INDEX idx_investigations_status ON investigations(status);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_appointment_id ON messages(appointment_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_doctor_availability_doctor_id ON doctor_availability(doctor_id);
CREATE INDEX idx_doctor_availability_active ON doctor_availability(active) WHERE active = true;

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_faqs_display_order ON faqs(display_order);
CREATE INDEX idx_faqs_is_active ON faqs(is_active);
CREATE INDEX idx_faqs_active_order ON faqs(is_active, display_order);

-- -----------------------------------------------------------------------------
-- Functions
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ensure_single_system_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM system_settings) > 1 THEN
    RAISE EXCEPTION 'Only one system_settings row is allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, profile_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.investigation_id_from_object_name(object_name text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(split_part(object_name, '/', 1), '')::uuid;
$$;

-- -----------------------------------------------------------------------------
-- Triggers (updated_at, profile creation, audit, system_settings single row)
-- -----------------------------------------------------------------------------
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultation_notes_updated_at
  BEFORE UPDATE ON consultation_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investigations_updated_at
  BEFORE UPDATE ON investigations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctor_availability_updated_at
  BEFORE UPDATE ON doctor_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER single_system_settings_trigger
  BEFORE INSERT ON system_settings
  FOR EACH ROW EXECUTE FUNCTION ensure_single_system_settings();
CREATE TRIGGER system_settings_updated_at_trigger
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_system_settings_updated_at();

CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION update_faqs_updated_at();

CREATE TRIGGER audit_appointments
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_consultation_notes
  AFTER INSERT OR UPDATE OR DELETE ON consultation_notes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_prescriptions
  AFTER INSERT OR UPDATE OR DELETE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_investigations
  AFTER INSERT OR UPDATE OR DELETE ON investigations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_profiles
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_messages
  AFTER INSERT OR UPDATE OR DELETE ON messages
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- -----------------------------------------------------------------------------
-- Row Level Security (enable on all tables)
-- -----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS Policies – profiles
-- -----------------------------------------------------------------------------
CREATE POLICY "Allow profile creation via trigger"
  ON profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Doctors can view patient profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'doctor')
    AND role = 'patient'
  );

CREATE POLICY "Authenticated users can view verified doctors"
  ON profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND role = 'doctor'
    AND license_verified = true
  );

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_current_user_admin());

-- -----------------------------------------------------------------------------
-- RLS Policies – appointments
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE POLICY "Patients can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE POLICY "Admins can view all appointments"
  ON appointments FOR SELECT USING (public.is_current_user_admin());

CREATE POLICY "Admins can create appointments"
  ON appointments FOR INSERT WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update all appointments"
  ON appointments FOR UPDATE USING (public.is_current_user_admin());

-- -----------------------------------------------------------------------------
-- RLS Policies – consultation_notes
-- -----------------------------------------------------------------------------
CREATE POLICY "Doctors can create consultation notes"
  ON consultation_notes FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Users can view related consultation notes"
  ON consultation_notes FOR SELECT
  USING (
    auth.uid() = doctor_id
    OR auth.uid() IN (SELECT patient_id FROM appointments WHERE id = consultation_notes.appointment_id)
  );

CREATE POLICY "Doctors can update consultation notes"
  ON consultation_notes FOR UPDATE USING (auth.uid() = doctor_id);

-- -----------------------------------------------------------------------------
-- RLS Policies – prescriptions
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own prescriptions"
  ON prescriptions FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE POLICY "Doctors can create prescriptions"
  ON prescriptions FOR INSERT WITH CHECK (auth.uid() = doctor_id);

-- -----------------------------------------------------------------------------
-- RLS Policies – investigations
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own investigations"
  ON investigations FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE POLICY "Doctors can create investigations"
  ON investigations FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Users can update own investigations"
  ON investigations FOR UPDATE
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- -----------------------------------------------------------------------------
-- RLS Policies – notifications
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- RLS Policies – messages
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE USING (auth.uid() = receiver_id);

-- -----------------------------------------------------------------------------
-- RLS Policies – doctor_availability
-- -----------------------------------------------------------------------------
CREATE POLICY "Doctors can manage own availability"
  ON doctor_availability FOR ALL USING (auth.uid() = doctor_id);

CREATE POLICY "Anyone can view doctor availability"
  ON doctor_availability FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- RLS Policies – audit_logs
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (public.is_current_user_admin());

-- -----------------------------------------------------------------------------
-- RLS Policies – system_settings
-- -----------------------------------------------------------------------------
CREATE POLICY "Allow authenticated users to read system settings"
  ON system_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to update system settings"
  ON system_settings FOR UPDATE TO authenticated
  USING (public.is_current_user_admin());

-- -----------------------------------------------------------------------------
-- RLS Policies – faqs
-- -----------------------------------------------------------------------------
CREATE POLICY "Allow authenticated users to read active FAQs"
  ON faqs FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Allow admins to read all FAQs"
  ON faqs FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Allow admins to insert FAQs"
  ON faqs FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Allow admins to update FAQs"
  ON faqs FOR UPDATE TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Allow admins to delete FAQs"
  ON faqs FOR DELETE TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Allow public to read active FAQs"
  ON faqs FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- -----------------------------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE system_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE faqs;

-- -----------------------------------------------------------------------------
-- Storage buckets (run only if storage is available; may require Dashboard)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('investigations', 'investigations', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for investigations bucket (requires storage.objects)
DROP POLICY IF EXISTS "Patients can upload investigation files" ON storage.objects;
CREATE POLICY "Patients can upload investigation files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'investigations'
    AND EXISTS (
      SELECT 1 FROM public.investigations i
      WHERE i.id = public.investigation_id_from_object_name(name)
        AND i.patient_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can read investigation files" ON storage.objects;
CREATE POLICY "Users can read investigation files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'investigations'
    AND EXISTS (
      SELECT 1 FROM public.investigations i
      WHERE i.id = public.investigation_id_from_object_name(name)
        AND (i.patient_id = auth.uid() OR i.doctor_id = auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- Seed: single system_settings row (only if empty)
-- -----------------------------------------------------------------------------
INSERT INTO system_settings (consultation_price, consultation_duration, faq_display_count)
SELECT 5000.00, 45, 4
WHERE NOT EXISTS (SELECT 1 FROM system_settings LIMIT 1);

-- Optional: For email verification codes, auto-signin tokens, etc., run the
-- corresponding files in supabase/migrations/ (e.g. 008_email_verification_tokens.sql,
-- 013_email_verification_codes.sql, 019_auto_signin_tokens.sql) after this script.
