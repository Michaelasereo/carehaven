import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pill, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'

export default async function PrescriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Fetch prescriptions with doctor details
  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select(`
      *,
      profiles!prescriptions_doctor_id_fkey(full_name, specialty)
    `)
    .eq('patient_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Pill className="h-8 w-8" />
          My Prescriptions
        </h1>
      </div>

      {prescriptions && prescriptions.length > 0 ? (
        <div className="grid gap-4">
          {prescriptions.map((prescription: any) => (
            <Card key={prescription.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">Prescription</h3>
                    <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                      {prescription.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>
                        {prescription.profiles?.full_name || 'Dr. Unknown'}
                        {prescription.profiles?.specialty && ` - ${prescription.profiles.specialty}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(prescription.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Medications</h4>
                  <div className="space-y-2">
                    {Array.isArray(prescription.medications) ? (
                      prescription.medications.map((med: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{med.name || 'Medication'}</p>
                              {med.dosage && (
                                <p className="text-sm text-gray-600">Dosage: {med.dosage}</p>
                              )}
                              {med.frequency && (
                                <p className="text-sm text-gray-600">Frequency: {med.frequency}</p>
                              )}
                              {med.duration && (
                                <p className="text-sm text-gray-600">Duration: {med.duration}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">No medications listed</p>
                    )}
                  </div>
                </div>

                {prescription.instructions && (
                  <div>
                    <h4 className="font-medium mb-2">Instructions</h4>
                    <p className="text-gray-600">{prescription.instructions}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  {prescription.duration_days && (
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-medium">{prescription.duration_days} days</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Refills Remaining</p>
                    <p className="font-medium">{prescription.refills_remaining || 0}</p>
                  </div>
                  {prescription.expires_at && (
                    <div>
                      <p className="text-sm text-gray-600">Expires</p>
                      <p className="font-medium">
                        {format(new Date(prescription.expires_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Pill className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No prescriptions found</p>
          <p className="text-sm text-gray-500 mt-2">
            Your prescriptions will appear here after consultations.
          </p>
        </Card>
      )}
    </div>
  )
}
