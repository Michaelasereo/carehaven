-- Add index to improve appointment conflict checking performance
-- This index helps quickly find appointments for a doctor within a time range

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_time 
ON appointments(doctor_id, scheduled_at, status) 
WHERE status IN ('scheduled', 'confirmed', 'in_progress');

-- Add index for patient appointments lookup
CREATE INDEX IF NOT EXISTS idx_appointments_patient_time 
ON appointments(patient_id, scheduled_at);
