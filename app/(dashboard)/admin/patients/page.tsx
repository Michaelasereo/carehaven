import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PatientListTable } from '@/components/admin/patient-list-table'
import { Download } from 'lucide-react'
import { PatientListClient } from '@/components/admin/patient-list-client'

export default async function AdminPatientsPage({
  searchParams,
}: {
  searchParams: { 
    search?: string
    sort?: string
    order?: 'asc' | 'desc'
    page?: string
    filter?: string
  }
}) {
  // Auth and role checks are handled by app/(dashboard)/layout.tsx
  const supabase = await createClient()

  // Build query
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'patient')

  // Apply filters
  if (searchParams.filter === 'complete') {
    query = query.eq('profile_completed', true)
  } else if (searchParams.filter === 'incomplete') {
    query = query.eq('profile_completed', false)
  }

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
  const patientsWithStats = await Promise.all(
    (patients || []).map(async (patient: any) => {
      // Get appointment count
      const { count: appointmentCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patient.id)

      // Get last visit (most recent appointment)
      const { data: lastAppointment } = await supabase
        .from('appointments')
        .select('scheduled_at')
        .eq('patient_id', patient.id)
        .order('scheduled_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return {
        ...patient,
        appointment_count: appointmentCount || 0,
        last_visit: lastAppointment?.scheduled_at || null,
      }
    })
  )

  // Get total count for pagination
  let countQuery = supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'patient')

  if (searchParams.filter === 'complete') {
    countQuery = countQuery.eq('profile_completed', true)
  } else if (searchParams.filter === 'incomplete') {
    countQuery = countQuery.eq('profile_completed', false)
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
          <p className="text-gray-600 mt-1">View and manage patient accounts</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <PatientListClient
        patients={patientsWithStats}
        currentPage={page}
        totalPages={totalPages}
        searchParams={searchParams}
      />
    </div>
  )
}
