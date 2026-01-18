export const mockPrescriptions = {
  active: {
    id: 'prescription-1',
    appointment_id: 'appointment-3',
    patient_id: 'patient-user-id',
    doctor_id: 'doctor-user-id',
    medications: [
      {
        name: 'Paracetamol',
        dosage: '500mg',
        instructions: 'Take twice daily after meals',
      },
      {
        name: 'Ibuprofen',
        dosage: '400mg',
        instructions: 'Take once daily',
      },
    ],
    instructions: 'Take with plenty of water',
    duration_days: 7,
    refills_remaining: 0,
    status: 'active',
    created_at: new Date().toISOString(),
  },
  filled: {
    id: 'prescription-2',
    appointment_id: 'appointment-3',
    patient_id: 'patient-user-id',
    doctor_id: 'doctor-user-id',
    medications: [
      {
        name: 'Amoxicillin',
        dosage: '500mg',
        instructions: 'Take three times daily',
      },
    ],
    instructions: 'Complete the full course',
    duration_days: 10,
    refills_remaining: 0,
    status: 'filled',
    filled_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
}
