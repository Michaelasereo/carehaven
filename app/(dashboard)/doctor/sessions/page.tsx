import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientCard } from '@/components/doctor/client-card'
import { Input } from '@/components/ui/input'
import { Search, Filter } from 'lucide-react'

export default async function DoctorSessionsPage() {
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

  // Get unique patients who have appointments with this doctor
  const { data: appointments } = await supabase
    .from('appointments')
    .select('patient_id, profiles!appointments_patient_id_fkey(*)')
    .eq('doctor_id', user.id)

  const uniquePatients = appointments?.reduce((acc: any[], appointment: any) => {
    if (!acc.find(p => p.id === appointment.patient_id)) {
      acc.push({
        id: appointment.patient_id,
        ...appointment.profiles,
      })
    }
    return acc
  }, []) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Clients and Session Notes</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search" className="pl-10 w-64" />
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {uniquePatients.map((patient: any) => (
          <ClientCard key={patient.id} patient={patient} />
        ))}
      </div>
    </div>
  )
}

