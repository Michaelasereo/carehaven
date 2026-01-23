import { createClient } from '@/lib/supabase/server'
import { AppointmentFilters } from '@/components/admin/appointment-filters'
import { AppointmentListClient } from '@/components/admin/appointment-list-client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    doctor?: string
    patient?: string
    payment_status?: string
    date_from?: string
    date_to?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Get unique statuses and doctors for filters
  const { data: statusData } = await supabase
    .from('appointments')
    .select('status')
    .limit(1000)

  const statuses = Array.from(new Set(statusData?.map(a => a.status).filter(Boolean) || []))

  const { data: doctorsData } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'doctor')
    .limit(100)

  const doctors = doctorsData || []

  // Build query with filters
  let query = supabase
    .from('appointments')
    .select(`
      *,
      patient:profiles!appointments_patient_id_fkey(full_name, email),
      doctor:profiles!appointments_doctor_id_fkey(full_name, email, specialty)
    `)

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.doctor && params.doctor !== 'all') {
    query = query.eq('doctor_id', params.doctor)
  }

  if (params.payment_status && params.payment_status !== 'all') {
    query = query.eq('payment_status', params.payment_status)
  }

  if (params.date_from) {
    query = query.gte('scheduled_at', new Date(params.date_from).toISOString())
  }

  if (params.date_to) {
    const dateTo = new Date(params.date_to)
    dateTo.setHours(23, 59, 59, 999)
    query = query.lte('scheduled_at', dateTo.toISOString())
  }

  // Apply sorting
  query = query.order('scheduled_at', { ascending: false })

  // Pagination
  const page = parseInt(params.page || '1')
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to)

  const { data: appointments, error } = await query

  if (error) {
    console.error('Error fetching appointments:', error)
  }

  // Get total count for pagination
  let countQuery = supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })

  if (params.status && params.status !== 'all') {
    countQuery = countQuery.eq('status', params.status)
  }

  if (params.doctor && params.doctor !== 'all') {
    countQuery = countQuery.eq('doctor_id', params.doctor)
  }

  if (params.payment_status && params.payment_status !== 'all') {
    countQuery = countQuery.eq('payment_status', params.payment_status)
  }

  if (params.date_from) {
    countQuery = countQuery.gte('scheduled_at', new Date(params.date_from).toISOString())
  }

  if (params.date_to) {
    const dateTo = new Date(params.date_to)
    dateTo.setHours(23, 59, 59, 999)
    countQuery = countQuery.lte('scheduled_at', dateTo.toISOString())
  }

  const { count: totalCount } = await countQuery

  const totalPages = Math.ceil((totalCount || 0) / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointment Management</h1>
          <p className="text-gray-600 mt-1">View and monitor all platform appointments</p>
        </div>
        <Link href="/admin/appointments/book">
          <Button className="bg-teal-600 hover:bg-teal-700">Book Appointment</Button>
        </Link>
      </div>

      {/* Filters */}
      <AppointmentFilters statuses={statuses} doctors={doctors} />

      {/* Appointments List */}
      <AppointmentListClient
        appointments={appointments || []}
        currentPage={page}
        totalPages={totalPages}
        searchParams={params}
      />
    </div>
  )
}
