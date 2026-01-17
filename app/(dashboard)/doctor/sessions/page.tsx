import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { ClientListTable } from '@/components/doctor/client-list-table'
import { ClientListClient } from '@/components/doctor/client-list-client'

export default async function DoctorSessionsPage({
  searchParams,
}: {
  searchParams: { 
    search?: string
    sort?: string
    order?: 'asc' | 'desc'
    page?: string
  }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/doctor/login')
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

  const uniquePatientIds = new Set(appointments?.map(apt => apt.patient_id) || [])
  const patientIds = Array.from(uniquePatientIds)

  if (patientIds.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Clients and Session Notes</h1>
        </div>
        <Card className="p-12 text-center">
          <p className="text-gray-600">No clients yet</p>
        </Card>
      </div>
    )
  }

  // Build query for patient profiles
  let query = supabase
    .from('profiles')
    .select('*')
    .in('id', patientIds)
    .eq('role', 'patient')

  if (searchParams.search) {
    query = query.or(
      `full_name.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%,phone.ilike.%${searchParams.search}%`
    )
  }

  // Apply sorting
  const sortField = searchParams.sort || 'created_at'
  const sortOrder = searchParams.order || 'desc'
  query = query.order(sortField, { ascending: sortOrder === 'asc' })

  // Pagination
  const page = parseInt(searchParams.page || '1')
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to)

  const { data: patients, error } = await query

  if (error) {
    console.error('Error fetching patients:', error)
  }

  // Fetch aggregated data for each patient
  const clientsWithStats = await Promise.all(
    (patients || []).map(async (patient: any) => {
      // Get appointment count
      const { count: appointmentCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patient.id)
        .eq('doctor_id', user.id)

      // Get last visit
      const { data: lastAppointment } = await supabase
        .from('appointments')
        .select('scheduled_at')
        .eq('patient_id', patient.id)
        .eq('doctor_id', user.id)
        .order('scheduled_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Get total spent
      const { data: paidAppointments } = await supabase
        .from('appointments')
        .select('amount')
        .eq('patient_id', patient.id)
        .eq('doctor_id', user.id)
        .eq('payment_status', 'paid')

      const totalSpent = paidAppointments?.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0

      return {
        ...patient,
        appointment_count: appointmentCount || 0,
        last_visit: lastAppointment?.scheduled_at || null,
        total_spent: totalSpent,
      }
    })
  )

  // Get total count for pagination
  let countQuery = supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('id', patientIds)
    .eq('role', 'patient')

  if (searchParams.search) {
    countQuery = countQuery.or(
      `full_name.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%,phone.ilike.%${searchParams.search}%`
    )
  }

  const { count: totalCount } = await countQuery

  const totalPages = Math.ceil((totalCount || 0) / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients and Session Notes</h1>
          <p className="text-gray-600 mt-1">Manage your patients and their medical records</p>
        </div>
      </div>

      <ClientListClient
        clients={clientsWithStats}
        currentPage={page}
        totalPages={totalPages}
        searchParams={searchParams}
      />
    </div>
  )
}
