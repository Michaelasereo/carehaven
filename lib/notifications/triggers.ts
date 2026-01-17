import { createNotification } from './create'

/**
 * Create notification when appointment is confirmed
 */
export async function notifyAppointmentConfirmed(
  patientId: string,
  appointmentId: string,
  doctorName: string,
  scheduledAt: Date
) {
  await createNotification(
    patientId,
    'appointment',
    'Appointment Confirmed',
    `Your appointment with ${doctorName} is confirmed for ${scheduledAt.toLocaleDateString()}`,
    { appointment_id: appointmentId }
  )
}

/**
 * Create notification when prescription is created
 */
export async function notifyPrescriptionCreated(
  patientId: string,
  prescriptionId: string,
  doctorName: string
) {
  await createNotification(
    patientId,
    'prescription',
    'New Prescription',
    `You have a new prescription from ${doctorName}`,
    { prescription_id: prescriptionId }
  )
}

/**
 * Create notification when investigation is requested
 */
export async function notifyInvestigationRequested(
  patientId: string,
  investigationId: string,
  testName: string,
  doctorName: string
) {
  await createNotification(
    patientId,
    'investigation',
    'Investigation Requested',
    `${doctorName} has requested a ${testName} test for you`,
    { investigation_id: investigationId }
  )
}

/**
 * Create notification when appointment is rescheduled
 */
export async function notifyAppointmentRescheduled(
  patientId: string,
  appointmentId: string,
  newDate: Date
) {
  await createNotification(
    patientId,
    'appointment',
    'Appointment Rescheduled',
    `Your appointment has been rescheduled to ${newDate.toLocaleDateString()}`,
    { appointment_id: appointmentId }
  )
}

/**
 * Create notification when appointment is cancelled
 */
export async function notifyAppointmentCancelled(
  patientId: string,
  appointmentId: string
) {
  await createNotification(
    patientId,
    'appointment',
    'Appointment Cancelled',
    'Your appointment has been cancelled',
    { appointment_id: appointmentId }
  )
}

/**
 * Create notification for doctor when appointment is booked
 */
export async function notifyDoctorAppointmentBooked(
  doctorId: string,
  appointmentId: string,
  patientName: string,
  scheduledAt: Date
) {
  await createNotification(
    doctorId,
    'appointment',
    'New Appointment',
    `${patientName} has booked an appointment for ${scheduledAt.toLocaleDateString()}`,
    { appointment_id: appointmentId }
  )
}
