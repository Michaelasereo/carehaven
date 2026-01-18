import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SOAPForm } from '@/components/consultation/soap-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, Video, FileText, Pill, TestTube } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { JoinConsultationButton } from '@/components/doctor/join-consultation-button'
import { CreatePrescriptionButton } from '@/components/doctor/create-prescription-button'
import { RequestInvestigationButton } from '@/components/doctor/request-investigation-button'
import { PatientHistoryTimeline } from '@/components/doctor/patient-history-timeline'

export default async function AppointmentDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'doctor') {
    redirect('/patient')
  }

  // Fetch appointment with patient details
  const { data: appointment } = await supabase
    .from('appointments')
    .select(`
      *,
      profiles!appointments_patient_id_fkey(*)
    `)
    .eq('id', params.id)
    .eq('doctor_id', user.id)
    .single()

  if (!appointment) {
    redirect('/doctor/sessions')
  }

  // Fetch consultation notes
  const { data: notes } = await supabase
    .from('consultation_notes')
    .select('*')
    .eq('appointment_id', params.id)
    .single()

  // Fetch prescriptions
  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('appointment_id', params.id)
    .order('created_at', { ascending: false })

  // Fetch investigations
  const { data: investigations } = await supabase
    .from('investigations')
    .select('*')
    .eq('appointment_id', params.id)
    .order('created_at', { ascending: false })

  const patient = appointment.profiles
  const scheduledAt = new Date(appointment.scheduled_at)
  const endTime = new Date(scheduledAt.getTime() + (appointment.duration_minutes || 45) * 60000)
  const canJoin = appointment.status === 'confirmed' || appointment.status === 'in_progress'
  const isCompleted = appointment.status === 'completed'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointment Details</h1>
          <p className="text-gray-600 mt-1">
            Consultation with {patient?.full_name || 'Patient'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
            {appointment.status}
          </Badge>
          {canJoin && (
            <JoinConsultationButton appointmentId={appointment.id} />
          )}
        </div>
      </div>

      {/* Patient Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Patient Information
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium">{patient?.full_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{patient?.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-medium">{patient?.phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date of Birth</p>
            <p className="font-medium">
              {patient?.date_of_birth
                ? format(new Date(patient.date_of_birth), 'MMM d, yyyy')
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Gender</p>
            <p className="font-medium">{patient?.gender || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Blood Group</p>
            <p className="font-medium">{patient?.blood_group || 'N/A'}</p>
          </div>
        </div>
        {patient?.allergies && patient.allergies.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Allergies</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {patient.allergies.map((allergy: string, idx: number) => (
                <Badge key={idx} variant="outline">{allergy}</Badge>
              ))}
            </div>
          </div>
        )}
        {patient?.chronic_conditions && patient.chronic_conditions.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Chronic Conditions</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {patient.chronic_conditions.map((condition: string, idx: number) => (
                <Badge key={idx} variant="outline">{condition}</Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Appointment Details */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Appointment Details
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Scheduled Date</p>
            <p className="font-medium">{format(scheduledAt, 'MMM d, yyyy')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Time</p>
            <p className="font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format(scheduledAt, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Chief Complaint</p>
            <p className="font-medium">{appointment.chief_complaint || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Payment Status</p>
            <Badge variant={appointment.payment_status === 'paid' ? 'default' : 'secondary'}>
              {appointment.payment_status}
            </Badge>
          </div>
        </div>
        {appointment.symptoms_description && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Symptoms Description</p>
            <p className="mt-1">{appointment.symptoms_description}</p>
          </div>
        )}
      </Card>

      {/* Consultation Notes */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consultation Notes
          </h2>
        </div>
        {notes ? (
          <div className="space-y-4">
            <SOAPForm appointmentId={appointment.id} doctorId={user.id} patientId={appointment.patient_id} />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">No consultation notes yet. Start documenting below.</p>
            <SOAPForm appointmentId={appointment.id} doctorId={user.id} patientId={appointment.patient_id} />
          </div>
        )}
      </Card>

      {/* Prescriptions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Prescriptions
          </h2>
          {isCompleted && (
            <CreatePrescriptionButton appointmentId={appointment.id} />
          )}
        </div>
        {prescriptions && prescriptions.length > 0 ? (
          <div className="space-y-4">
            {prescriptions.map((prescription: any) => (
              <div key={prescription.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                    {prescription.status}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {format(new Date(prescription.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium">Medications:</p>
                  <pre className="text-sm mt-1 bg-gray-50 p-2 rounded">
                    {JSON.stringify(prescription.medications, null, 2)}
                  </pre>
                </div>
                {prescription.instructions && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Instructions:</p>
                    <p className="text-sm text-gray-600">{prescription.instructions}</p>
                  </div>
                )}
                {prescription.duration_days && (
                  <p className="text-sm text-gray-600 mt-2">
                    Duration: {prescription.duration_days} days
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {isCompleted ? (
              <p>No prescriptions yet. Create one below.</p>
            ) : (
              <p>Prescriptions will be available after consultation is completed.</p>
            )}
          </div>
        )}
      </Card>

      {/* Investigations */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Investigations
          </h2>
          {isCompleted && (
            <RequestInvestigationButton appointmentId={appointment.id} />
          )}
        </div>
        {investigations && investigations.length > 0 ? (
          <div className="space-y-4">
            {investigations.map((investigation: any) => (
              <div key={investigation.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{investigation.test_name}</p>
                    {investigation.test_type && (
                      <p className="text-sm text-gray-600">{investigation.test_type}</p>
                    )}
                  </div>
                  <Badge variant={investigation.status === 'completed' ? 'default' : 'secondary'}>
                    {investigation.status}
                  </Badge>
                </div>
                {investigation.results_text && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Results:</p>
                    <p className="text-sm text-gray-600">{investigation.results_text}</p>
                  </div>
                )}
                {investigation.interpretation && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Interpretation:</p>
                    <p className="text-sm text-gray-600">{investigation.interpretation}</p>
                  </div>
                )}
                {investigation.results_url && (
                  <div className="mt-2">
                    <a
                      href={investigation.results_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal-600 hover:underline"
                    >
                      View Results File
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {isCompleted ? (
              <p>No investigations requested yet. Request one below.</p>
            ) : (
              <p>Investigations will be available after consultation is completed.</p>
            )}
          </div>
        )}
      </Card>

      {/* Patient Medical History */}
      <PatientHistoryTimeline 
        patientId={appointment.patient_id}
        currentAppointmentId={appointment.id}
      />
    </div>
  )
}
