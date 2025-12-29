-- Create indexes for performance

-- Appointments indexes
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_payment_status ON appointments(payment_status);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Messages indexes
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_appointment_id ON messages(appointment_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Profiles indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_specialty ON profiles(specialty) WHERE role = 'doctor';
CREATE INDEX idx_profiles_email ON profiles(email);

-- Consultation notes indexes
CREATE INDEX idx_consultation_notes_appointment_id ON consultation_notes(appointment_id);
CREATE INDEX idx_consultation_notes_doctor_id ON consultation_notes(doctor_id);

-- Prescriptions indexes
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_appointment_id ON prescriptions(appointment_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);

-- Investigations indexes
CREATE INDEX idx_investigations_patient_id ON investigations(patient_id);
CREATE INDEX idx_investigations_appointment_id ON investigations(appointment_id);
CREATE INDEX idx_investigations_status ON investigations(status);

-- Doctor availability indexes
CREATE INDEX idx_doctor_availability_doctor_id ON doctor_availability(doctor_id);
CREATE INDEX idx_doctor_availability_active ON doctor_availability(active) WHERE active = true;

