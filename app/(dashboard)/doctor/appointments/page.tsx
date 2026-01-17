import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppointmentFilters } from '@/components/doctor/appointment-filters'
import { AppointmentListClient } from '@/components/doctor/appointment-list-client'

export default async function DoctorAppointmentsPage({
  searchParams,
}: {
  searchParams: {
    status?: string
    patient?: string
    date_from?: string
    date_to?: string
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
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'doctor') {
    redirect('/patient')
  }

  // Get unique statuses for filters
  const { data: statusData } = await supabase
    .from('appointments')
    .select('status')
    .eq('doctor_id', user.id)
    .limit(1000)

  const statuses = Array.from(new Set(statusData?.map(a => a.status).filter(Boolean) || []))

  // Build query with filters
  let query = supabase
    .from('appointments')
    .select(`
      *,
      patient:profiles!appointments_patient_id_fkey(full_name, email)
    `)
    .eq('doctor_id', user.id)

  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status)
  }

  if (searchParams.date_from) {
    query = query.gte('scheduled_at', new Date(searchParams.date_from).toISOString())
  }

  if (searchParams.date_to) {
    const dateTo = new Date(searchParams.date_to)
    dateTo.setHours(23, 59, 59, 999)
    query = query.lte('scheduled_at', dateTo.toISOString())
  }

  // Apply sorting
  query = query.order('scheduled_at', { ascending: false })

  // Pagination
  const page = parseInt(searchParams.page || '1')
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
    .eq('doctor_id', user.id)

  if (searchParams.status && searchParams.status !== 'all') {
    countQuery = countQuery.eq('status', searchParams.status)
  }

  if (searchParams.date_from) {
    countQuery = countQuery.gte('scheduled_at', new Date(searchParams.date_from).toISOString())
  }

  if (searchParams.date_to) {
    const dateTo = new Date(searchParams.date_to)
    dateTo.setHours(23, 59, 59, 999)
    countQuery = countQuery.lte('scheduled_at', dateTo.toISOString())
  }

  const { count: totalCount } = await countQuery

  const totalPages = Math.ceil((totalCount || 0) / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage your appointments and consultations</p>
        </div>
      </div>

      {/* Filters */}
      <AppointmentFilters statuses={statuses} />

      {/* Appointments List */}
      <AppointmentListClient
        appointments={appointments || []}
        currentPage={page}
        totalPages={totalPages}
        searchParams={searchParams}
      />
    </div>
  )
}
