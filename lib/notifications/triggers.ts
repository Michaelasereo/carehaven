import { createNotification } from './create'
import { sendEmail } from '@/lib/email/client'

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

/**
 * Send detailed email to doctor when appointment is booked
 */
export async function sendDoctorAppointmentEmail(
  doctorEmail: string,
  doctorName: string,
  patientName: string,
  scheduledAt: Date,
  appointmentDetails: {
    reason?: string | null
    complaints?: string | null
    chronicConditions?: string[]
    gender?: string | null
    age?: string | null
  }
) {
  const formattedDate = scheduledAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const chronicConditionsList = appointmentDetails.chronicConditions && appointmentDetails.chronicConditions.length > 0
    ? appointmentDetails.chronicConditions.join(', ')
    : 'None'

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0d9488; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .detail-row { margin: 15px 0; padding: 12px; background-color: white; border-radius: 4px; border-left: 3px solid #0d9488; }
          .label { font-weight: bold; color: #0d9488; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Appointment Booked</h2>
          </div>
          <div class="content">
            <p>Dear Dr. ${doctorName},</p>
            <p>A new appointment has been booked with you. Please find the details below:</p>
            
            <div class="detail-row">
              <span class="label">Patient Name:</span> ${patientName}
            </div>
            
            <div class="detail-row">
              <span class="label">Scheduled Date & Time:</span> ${formattedDate}
            </div>
            
            ${appointmentDetails.reason ? `
            <div class="detail-row">
              <span class="label">Reason for Consultation:</span> ${appointmentDetails.reason}
            </div>
            ` : ''}
            
            ${appointmentDetails.complaints ? `
            <div class="detail-row">
              <span class="label">Complaints / Symptoms:</span> ${appointmentDetails.complaints}
            </div>
            ` : ''}
            
            <div class="detail-row">
              <span class="label">Chronic Conditions:</span> ${chronicConditionsList}
            </div>
            
            ${appointmentDetails.gender || appointmentDetails.age ? `
            <div class="detail-row">
              ${appointmentDetails.gender ? `<span class="label">Gender:</span> ${appointmentDetails.gender}<br>` : ''}
              ${appointmentDetails.age ? `<span class="label">Age:</span> ${appointmentDetails.age}` : ''}
            </div>
            ` : ''}
            
            <p style="margin-top: 20px;">Please review the appointment details and prepare accordingly.</p>
            
            <div class="footer">
              <p>This is an automated notification from Care Haven.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    await sendEmail(
      doctorEmail,
      `New Appointment: ${patientName} - ${formattedDate}`,
      htmlContent
    )
    console.log(`Email sent to doctor ${doctorEmail} for appointment booking`)
  } catch (error) {
    console.error('Error sending doctor appointment email:', error)
    // Don't throw - email failure shouldn't break the booking flow
  }
}
