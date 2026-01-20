import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { 
  Calendar, 
  Clock,
  FileText, 
  Pill,
  TestTube,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'patient') {
    redirect('/patient')
  }

  // Fetch appointment - verify it belongs to this patient
  const { data: appointment } = await supabase
    .from('appointments')
    .select(`
      *,
      profiles!appointments_doctor_id_fkey(*)
    `)
    .eq('id', id)
    .eq('patient_id', user.id)
    .single()

  if (!appointment) {
    redirect('/patient/sessions')
  }

  // Only show notes for completed appointments
  if (appointment.status !== 'completed') {
    redirect('/patient/sessions')
  }

  // Fetch consultation notes
  const { data: notes } = await supabase
    .from('consultation_notes')
    .select('*')
    .eq('appointment_id', id)
    .single()

  // Fetch prescriptions
  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('appointment_id', id)
    .order('created_at', { ascending: false })

  // Fetch investigations
  const { data: investigations } = await supabase
    .from('investigations')
    .select('*')
    .eq('appointment_id', id)
    .order('created_at', { ascending: false })

  const doctor = appointment.profiles
  const scheduledAt = new Date(appointment.scheduled_at)
  const endTime = new Date(scheduledAt.getTime() + (appointment.duration_minutes || 45) * 60000)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/patient/sessions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sessions
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Session Notes</h1>
            <p className="text-gray-600 mt-1">
              Consultation with {doctor?.full_name || 'Dr. Unknown'}
            </p>
          </div>
        </div>
        <Badge variant="default">Completed</Badge>
      </div>

      {/* Appointment Details */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Appointment Details
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Date</p>
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
            <p className="text-sm text-gray-600">Doctor</p>
            <p className="font-medium">{doctor?.full_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Chief Complaint</p>
            <p className="font-medium">{appointment.chief_complaint || 'N/A'}</p>
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
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Consultation Notes
        </h2>
        {notes ? (
          <div className="space-y-6">
            {/* SOAP Format */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.subjective && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Subjective (S)</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {notes.subjective}
                  </p>
                </div>
              )}
              {notes.objective && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Objective (O)</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {notes.objective}
                  </p>
                </div>
              )}
              {notes.assessment && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Assessment (A)</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {notes.assessment}
                  </p>
                </div>
              )}
              {notes.plan && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Plan (P)</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {notes.plan}
                  </p>
                </div>
              )}
            </div>

            {/* Diagnosis */}
            {notes.diagnosis && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Diagnosis</h3>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                  {notes.diagnosis}
                </p>
              </div>
            )}

            {/* Prescription from notes (if stored separately) */}
            {notes.prescription && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Prescription</h3>
                <pre className="text-sm bg-gray-50 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(notes.prescription, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Consultation notes are not available yet.</p>
            <p className="text-sm mt-1">Please check back later or contact your doctor.</p>
          </div>
        )}
      </Card>

      {/* Prescriptions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Prescriptions
        </h2>
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
                  <p className="text-sm font-medium mb-1">Medications:</p>
                  {prescription.medications && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {Array.isArray(prescription.medications) ? (
                        <ul className="list-disc list-inside space-y-1">
                          {prescription.medications.map((med: any, idx: number) => (
                            <li key={idx} className="text-sm text-gray-900">
                              {typeof med === 'string' ? med : JSON.stringify(med)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <pre className="text-sm overflow-x-auto">
                          {JSON.stringify(prescription.medications, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
                {prescription.instructions && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Instructions:</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {prescription.instructions}
                    </p>
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
            <p>No prescriptions available for this session.</p>
          </div>
        )}
      </Card>

      {/* Investigations */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Investigations
        </h2>
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
                    <p className="text-sm font-medium mb-1">Results:</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {investigation.results_text}
                    </p>
                  </div>
                )}
                {investigation.interpretation && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Interpretation:</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {investigation.interpretation}
                    </p>
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
            <p>No investigations available for this session.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
