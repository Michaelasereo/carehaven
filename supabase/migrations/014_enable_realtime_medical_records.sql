-- Enable real-time for medical records tables
-- This allows real-time updates for consultation notes, prescriptions, and investigations

-- Enable real-time for consultation_notes
ALTER PUBLICATION supabase_realtime ADD TABLE consultation_notes;

-- Enable real-time for prescriptions
ALTER PUBLICATION supabase_realtime ADD TABLE prescriptions;

-- Enable real-time for investigations
ALTER PUBLICATION supabase_realtime ADD TABLE investigations;
