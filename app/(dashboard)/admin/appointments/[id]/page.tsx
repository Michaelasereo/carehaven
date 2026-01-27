import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, FileText, Pill, TestTube } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { ViewResultsLink } from '@/components/investigations/view-results-link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminAppointmentDetailPage({
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

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    redirect('/auth/signin')
  }

  const isSuperAdmin = profile.role === 'super_admin'

  const { data: appointment, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:profiles!appointments_patient_id_fkey(*),
      doctor:profiles!appointments_doctor_id_fkey(*)
    `)
    .eq('id', id)
    .single()

  if (error || !appointment) {
    notFound()
  }

  const [
    { data: soapNotes },
    { data: prescriptionsData },
    { data: investigationsData },
  ] = await Promise.all([
    isSuperAdmin
      ? supabase
          .from('consultation_notes')
          .select('*')
          .eq('appointment_id', id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('prescriptions')
      .select('*')
      .eq('appointment_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('investigations')
      .select('*')
      .eq('appointment_id', id)
      .order('created_at', { ascending: false }),
  ])

  const prescriptions = prescriptionsData || []
  const investigations = investigationsData || []

  const patient = appointment.patient as Record<string, unknown> | null
  const doctor = appointment.doctor as Record<string, unknown> | null
  const scheduledAt = new Date(appointment.scheduled_at)
  const endTime = new Date(scheduledAt.getTime() + (appointment.duration_minutes || 45) * 60000)
  const paymentLabel = appointment.payment_status === 'waived' ? 'Waived' : 'Paid'
  const isCompleted = appointment.status === 'completed'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/appointments">
            <Button variant="outline" size="sm">← Back to Appointments</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointment Details</h1>
            <p className="text-gray-600 mt-1">
              {patient?.full_name as string || 'Patient'} with {doctor?.full_name as string || 'Doctor'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
            {appointment.status}
          </Badge>
          <Badge variant="default">{paymentLabel}</Badge>
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
            <Link href={`/admin/patients/${appointment.patient_id}`} className="font-medium hover:text-blue-600">
              {(patient?.full_name as string) || 'N/A'}
            </Link>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{(patient?.email as string) || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-medium">{(patient?.phone as string) || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date of Birth</p>
            <p className="font-medium">
              {patient?.date_of_birth
                ? format(new Date(patient.date_of_birth as string), 'MMM d, yyyy')
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Gender</p>
            <p className="font-medium">{(patient?.gender as string) || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Blood Group</p>
            <p className="font-medium">{(patient?.blood_group as string) || 'N/A'}</p>
          </div>
        </div>
        {patient?.allergies && Array.isArray(patient.allergies) && (patient.allergies as string[]).length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Allergies</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {(patient.allergies as string[]).map((allergy: string, idx: number) => (
                <Badge key={idx} variant="outline">{allergy}</Badge>
              ))}
            </div>
          </div>
        )}
        {patient?.chronic_conditions && Array.isArray(patient.chronic_conditions) && (patient.chronic_conditions as string[]).length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Chronic Conditions</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {(patient.chronic_conditions as string[]).map((condition: string, idx: number) => (
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
            <p className="text-sm text-gray-600">Doctor</p>
            <Link href={`/admin/doctors/${appointment.doctor_id}`} className="font-medium hover:text-teal-600">
              {(doctor?.full_name as string) || 'N/A'}
            </Link>
            {(doctor?.specialty as string) && (
              <p className="text-sm text-gray-500">{doctor.specialty as string}</p>
            )}
          </div>
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
            <Badge variant="default">{paymentLabel}</Badge>
          </div>
          {appointment.amount != null && (
            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-medium">₦{Math.round(Number(appointment.amount) / 100).toLocaleString()}</p>
            </div>
          )}
        </div>
        {appointment.symptoms_description && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Symptoms Description</p>
            <p className="mt-1">{appointment.symptoms_description}</p>
          </div>
        )}
      </Card>

      {/* Consultation Notes (SOAP) - super_admin only */}
      {isSuperAdmin && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consultation Notes (SOAP)
          </h2>
          <div className="space-y-4">
            {soapNotes?.subjective && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Subjective</p>
                <p className="text-gray-900">{soapNotes.subjective}</p>
              </div>
            )}
            {soapNotes?.objective && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Objective</p>
                <p className="text-gray-900">{soapNotes.objective}</p>
              </div>
            )}
            {soapNotes?.assessment && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Assessment</p>
                <p className="text-gray-900">{soapNotes.assessment}</p>
              </div>
            )}
            {soapNotes?.plan && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Plan</p>
                <p className="text-gray-900">{soapNotes.plan}</p>
              </div>
            )}
            {soapNotes?.diagnosis && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Diagnosis</p>
                <p className="text-gray-900">{soapNotes.diagnosis}</p>
              </div>
            )}
            {(!soapNotes || !(soapNotes.subjective || soapNotes.objective || soapNotes.assessment || soapNotes.plan || soapNotes.diagnosis)) && (
              <p className="text-gray-500">No consultation notes recorded.</p>
            )}
          </div>
        </Card>
      )}

      {/* Prescriptions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Prescriptions
        </h2>
        {prescriptions.length > 0 ? (
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
                  <p className="text-sm text-gray-600 mt-2">Duration: {prescription.duration_days} days</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">
            {isCompleted ? 'No prescriptions for this appointment.' : 'Prescriptions will be available after consultation is completed.'}
          </p>
        )}
      </Card>

      {/* Investigations */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Investigations
        </h2>
        {investigations.length > 0 ? (
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
                    <ViewResultsLink filePath={investigation.results_url} label="View Results File" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">
            {isCompleted ? 'No investigations for this appointment.' : 'Investigations will be available after consultation is completed.'}
          </p>
        )}
      </Card>
    </div>
  )
}
