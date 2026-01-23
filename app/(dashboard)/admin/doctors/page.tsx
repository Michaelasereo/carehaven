import { createClient } from '@/lib/supabase/server'
import { DoctorListClient } from '@/components/admin/doctor-list-client'
import { DoctorSearchForm } from '@/components/admin/doctor-search-form'

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string
    search?: string
    specialty?: string
    sort?: string
    order?: 'asc' | 'desc'
    page?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Get all specialties for filter
  const { data: specialtiesData } = await supabase
    .from('profiles')
    .select('specialty')
    .eq('role', 'doctor')
    .not('specialty', 'is', null)

  const specialties = Array.from(new Set(specialtiesData?.map(d => d.specialty).filter(Boolean) || []))

  // Build query
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'doctor')

  // Apply filters
  if (params.filter === 'pending') {
    query = query.eq('license_verified', false)
  } else if (params.filter === 'verified') {
    query = query.eq('license_verified', true)
  }

  if (params.specialty) {
    query = query.eq('specialty', params.specialty)
  }

  if (params.search) {
    query = query.or(
      `full_name.ilike.%${params.search}%,email.ilike.%${params.search}%,license_number.ilike.%${params.search}%,specialty.ilike.%${params.search}%`
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

  const { data: doctors, error } = await query

  if (error) {
    console.error('Error fetching doctors:', error)
  }

  // Fetch aggregated data for each doctor
  const doctorsWithStats = await Promise.all(
    (doctors || []).map(async (doctor: any) => {
      // Get patient count (unique patients who booked with this doctor)
      const { count: patientCount } = await supabase
        .from('appointments')
        .select('patient_id', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id)

      // Get revenue (sum of paid appointments)
      const { data: paidAppointments } = await supabase
        .from('appointments')
        .select('amount')
        .eq('doctor_id', doctor.id)
        .eq('payment_status', 'paid')

      const revenue = paidAppointments?.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0

      return {
        ...doctor,
        patient_count: patientCount || 0,
        revenue,
      }
    })
  )

  // Get total count for pagination
  let countQuery = supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'doctor')

  if (params.filter === 'pending') {
    countQuery = countQuery.eq('license_verified', false)
  } else if (params.filter === 'verified') {
    countQuery = countQuery.eq('license_verified', true)
  }

  if (params.specialty) {
    countQuery = countQuery.eq('specialty', params.specialty)
  }

  if (params.search) {
    countQuery = countQuery.or(
      `full_name.ilike.%${params.search}%,email.ilike.%${params.search}%,license_number.ilike.%${params.search}%,specialty.ilike.%${params.search}%`
    )
  }

  const { count: totalCount } = await countQuery

  const totalPages = Math.ceil((totalCount || 0) / pageSize)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Doctor Management</h1>
        <p className="text-gray-600 mt-1">Manage and verify doctor accounts</p>
      </div>

      {/* Enhanced Filters */}
      <DoctorSearchForm
        specialties={specialties}
        currentFilter={params.filter}
        currentSearch={params.search}
        currentSpecialty={params.specialty}
      />

      {/* Enhanced Doctors Table */}
      <DoctorListClient 
        doctors={doctorsWithStats}
        currentPage={page}
        totalPages={totalPages}
        searchParams={params}
      />
    </div>
  )
}
