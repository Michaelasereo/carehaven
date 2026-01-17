import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { 
  Calendar, 
  DollarSign, 
  FileText, 
  Clock,
  Pill,
  Stethoscope,
  TrendingUp,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { PatientMedicalHistory } from '@/components/doctor/patient-medical-history'
import { PatientAnalytics } from '@/components/doctor/patient-analytics'

export default async function PatientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/doctor/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'doctor') {
    redirect('/patient')
  }

  // Verify this patient has appointments with this doctor
  const { data: appointmentCheck } = await supabase
    .from('appointments')
    .select('id')
    .eq('patient_id', params.id)
    .eq('doctor_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!appointmentCheck) {
    redirect('/doctor/sessions')
  }

  // Fetch patient details
  const { data: patient, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .eq('role', 'patient')
    .single()

  if (error || !patient) {
    notFound()
  }

  // Fetch patient data (only appointments with this doctor)
  const [
    { data: appointments },
    { data: prescriptions },
    { data: investigations },
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', params.id)
      .eq('doctor_id', user.id)
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', params.id)
      .eq('doctor_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('investigations')
      .select('*')
      .eq('patient_id', params.id)
      .eq('doctor_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const totalSpent = appointments
    ?.filter(apt => apt.payment_status === 'paid')
    .reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0

  const initials = patient.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'P'

  const age = patient.date_of_birth
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/doctor/sessions">
            <Button variant="outline" size="sm">← Back to Clients</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Details</h1>
            <p className="text-gray-600 mt-1">View patient profile and medical history</p>
          </div>
        </div>
      </div>

      {/* Profile Overview */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={patient.avatar_url || undefined} alt={patient.full_name || 'Patient'} />
            <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold">{patient.full_name || 'Unknown'}</h2>
              <Badge variant={patient.profile_completed ? 'default' : 'secondary'}>
                {patient.profile_completed ? 'Complete' : 'Incomplete'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{patient.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{patient.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Age</p>
                <p className="font-medium">{age ? `${age} years` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Gender</p>
                <p className="font-medium">{patient.gender || 'N/A'}</p>
              </div>
              {patient.blood_group && (
                <div>
                  <p className="text-sm text-gray-600">Blood Group</p>
                  <p className="font-medium">{patient.blood_group}</p>
                </div>
              )}
              {patient.allergies && patient.allergies.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Allergies</p>
                  <p className="font-medium">{patient.allergies.join(', ')}</p>
                </div>
              )}
            </div>
            {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-1">Chronic Conditions</p>
                <p className="text-gray-900">{patient.chronic_conditions.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold mt-2">{appointments?.length || 0}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold mt-2">₦{Math.round(totalSpent / 100).toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Prescriptions</p>
              <p className="text-2xl font-bold mt-2">{prescriptions?.length || 0}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Pill className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs for Detailed Views */}
      <Tabs defaultValue="medical-history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="medical-history">Medical History</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="investigations">Investigations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="medical-history" className="space-y-4">
          <PatientMedicalHistory
            patientId={params.id}
            doctorId={user.id}
          />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Appointment History</h3>
            <div className="space-y-3">
              {appointments && appointments.length > 0 ? (
                appointments.map((apt: any) => (
                  <div
                    key={apt.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{format(new Date(apt.scheduled_at), 'MMM d, yyyy')}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(apt.scheduled_at), 'h:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={apt.status === 'completed' ? 'default' : 'secondary'}>
                          {apt.status}
                        </Badge>
                        <Link href={`/doctor/appointments/${apt.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </div>
                    </div>
                    {apt.chief_complaint && (
                      <p className="text-sm text-gray-700 mt-2">{apt.chief_complaint}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No appointments found</p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Prescription History</h3>
            <div className="space-y-3">
              {prescriptions && prescriptions.length > 0 ? (
                prescriptions.map((prescription: any) => (
                  <div
                    key={prescription.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {format(new Date(prescription.created_at), 'MMM d, yyyy')}
                      </span>
                      <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                        {prescription.status}
                      </Badge>
                    </div>
                    {prescription.medications && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Medications:</p>
                        <pre className="text-sm mt-1 bg-gray-50 p-2 rounded">
                          {JSON.stringify(prescription.medications, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No prescriptions found</p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="investigations" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Investigation History</h3>
            <div className="space-y-3">
              {investigations && investigations.length > 0 ? (
                investigations.map((investigation: any) => (
                  <div
                    key={investigation.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{investigation.test_name}</p>
                      <Badge variant={investigation.status === 'completed' ? 'default' : 'secondary'}>
                        {investigation.status}
                      </Badge>
                    </div>
                    {investigation.results_text && (
                      <p className="text-sm text-gray-700 mt-2">{investigation.results_text}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No investigations found</p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <PatientAnalytics
            patientId={params.id}
            doctorId={user.id}
            appointments={appointments || []}
            totalSpent={totalSpent}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
