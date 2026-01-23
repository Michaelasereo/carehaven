import { createClient } from '@/lib/supabase/server'
import { PatientListClient } from '@/components/admin/patient-list-client'

export default async function AdminPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    sort?: string
    order?: 'asc' | 'desc'
    page?: string
    filter?: string
    doctor?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // If filtering by doctor, get patient IDs who have appointments with that doctor
  let doctorPatientIds: string[] | null = null
  if (params.doctor) {
    const { data: aptRows } = await supabase
      .from('appointments')
      .select('patient_id')
      .eq('doctor_id', params.doctor)
    doctorPatientIds = [...new Set((aptRows || []).map((r) => r.patient_id))]
  }

  // Build query
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'patient')

  if (doctorPatientIds !== null) {
    if (doctorPatientIds.length > 0) {
      query = query.in('id', doctorPatientIds)
    } else {
      query = query.eq('id', '00000000-0000-0000-0000-000000000000')
    }
  }

  // Apply filters
  if (params.filter === 'complete') {
    query = query.eq('profile_completed', true)
  } else if (params.filter === 'incomplete') {
    query = query.eq('profile_completed', false)
  }

  if (params.search) {
    query = query.or(
      `full_name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%`
    )
  }

  // Apply sorting
  const sortField = params.sort || 'created_at'
  const sortOrder = params.order || 'desc'
  query = query.order(sortField, { ascending: sortOrder === 'asc' })

  // Pagination
  const page = parseInt(params.page || '1')
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to)

  const { data: patients, error } = await query

  if (error) {
    console.error('Error fetching patients:', error)
  }
  const errorMessage = error
    ? 'Unable to load patients. Check admin access and RLS policies.'
    : null

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

  if (doctorPatientIds !== null) {
    if (doctorPatientIds.length > 0) {
      countQuery = countQuery.in('id', doctorPatientIds)
    } else {
      countQuery = countQuery.eq('id', '00000000-0000-0000-0000-000000000000')
    }
  }

  if (params.filter === 'complete') {
    countQuery = countQuery.eq('profile_completed', true)
  } else if (params.filter === 'incomplete') {
    countQuery = countQuery.eq('profile_completed', false)
  }

  if (params.search) {
    countQuery = countQuery.or(
      `full_name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%`
    )
  }

  const { count: totalCount } = await countQuery

  const totalPages = Math.ceil((totalCount || 0) / pageSize)

  // Fetch doctor name when filtering by doctor
  let doctorName: string | undefined
  if (params.doctor) {
    const { data: doc } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', params.doctor)
      .single()
    doctorName = doc?.full_name || undefined
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
        <p className="text-gray-600 mt-1">View and manage patient accounts</p>
      </div>

      <PatientListClient
        patients={patientsWithStats}
        currentPage={page}
        totalPages={totalPages}
        searchParams={params}
        errorMessage={errorMessage}
        doctor={params.doctor}
        doctorName={doctorName}
      />
    </div>
  )
}
