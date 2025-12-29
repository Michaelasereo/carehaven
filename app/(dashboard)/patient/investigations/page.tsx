import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PatientDemographics } from '@/components/dashboard/patient-demographics'
import { InvestigationCard } from '@/components/patient/investigation-card'
import { Calendar } from 'lucide-react'

export default async function InvestigationsPage() {
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

  const { data: investigations } = await supabase
    .from('investigations')
    .select('*, profiles!investigations_doctor_id_fkey(*)')
    .eq('patient_id', user.id)
    .order('created_at', { ascending: false })

  const completed = investigations?.filter(i => i.status === 'completed') || []
  const pending = investigations?.filter(i => i.status !== 'completed') || []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
        <Calendar className="h-8 w-8" />
        Investigations History
      </h1>

      {profile && (
        <PatientDemographics
          name={profile.full_name}
          age={profile.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : undefined}
          sex={profile.gender?.charAt(0).toUpperCase()}
          occupation={profile.occupation}
          maritalStatus={profile.marital_status}
        />
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Investigations History</h2>
        <div className="grid grid-cols-3 gap-4">
          {completed.map((investigation: any) => (
            <InvestigationCard key={investigation.id} investigation={investigation} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
        <div className="grid grid-cols-3 gap-4">
          {pending.map((investigation: any) => (
            <InvestigationCard key={investigation.id} investigation={investigation} showUpload />
          ))}
        </div>
      </div>
    </div>
  )
}

