import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { ClientListTable } from '@/components/doctor/client-list-table'
import { ClientListClient } from '@/components/doctor/client-list-client'

// Force dynamic rendering to ensure fresh data after appointment status changes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DoctorSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    search?: string
    sort?: string
    order?: 'asc' | 'desc'
    page?: string
  }>
}) {
  // Await searchParams as required in Next.js 15
  const resolvedSearchParams = await searchParams
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
  // Include all appointment statuses (scheduled, confirmed, in_progress, completed) to ensure
  // clients appear in the list even after sessions complete
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('patient_id, status, created_at')
    .eq('doctor_id', user.id)
    // No status filter - we want all patients who have had any appointment with this doctor
    .order('created_at', { ascending: false })

  if (appointmentsError) {
    console.error('Error fetching appointments for clients list:', {
      error: appointmentsError,
      message: appointmentsError.message,
      details: appointmentsError.details,
      hint: appointmentsError.hint,
      code: appointmentsError.code,
      doctorId: user.id,
    })
  }

  // Extract unique patient IDs - filter out any null/undefined values
  const uniquePatientIds = new Set(
    (appointments || [])
      .map(apt => apt.patient_id)
      .filter((id): id is string => !!id) // Type guard to filter out null/undefined
  )
  const patientIds = Array.from(uniquePatientIds)

  // Log diagnostic information
  if (process.env.NODE_ENV === 'development') {
    console.log('Client list query diagnostics:', {
      totalAppointments: appointments?.length || 0,
      uniquePatientIds: patientIds.length,
      patientIds: patientIds,
      appointmentStatuses: appointments?.reduce((acc, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    })
  }

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
  // Removed role filter - patient IDs come from appointments linked to this doctor
  let query = supabase
    .from('profiles')
    .select('*')
    .in('id', patientIds)

  if (resolvedSearchParams.search) {
    query = query.or(
      `full_name.ilike.%${resolvedSearchParams.search}%,email.ilike.%${resolvedSearchParams.search}%,phone.ilike.%${resolvedSearchParams.search}%`
    )
  }

  // Apply sorting
  const sortField = resolvedSearchParams.sort || 'created_at'
  const sortOrder = resolvedSearchParams.order || 'desc'
  query = query.order(sortField, { ascending: sortOrder === 'asc' })

  // Pagination
  const page = parseInt(resolvedSearchParams.page || '1')
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to)

  const { data: patients, error } = await query

  if (error) {
    console.error('Error fetching patients:', {
      error,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      patientIds: patientIds.length,
      searchParams: resolvedSearchParams,
    })
  }

  // Log diagnostic information for patient fetch
  if (process.env.NODE_ENV === 'development') {
    console.log('Patient profiles fetch diagnostics:', {
      patientsFound: patients?.length || 0,
      totalPatientIds: patientIds.length,
      searchQuery: resolvedSearchParams.search || 'none',
      page: page,
    })
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
  // Removed role filter - patient IDs come from appointments linked to this doctor
  let countQuery = supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('id', patientIds)

  if (resolvedSearchParams.search) {
    countQuery = countQuery.or(
      `full_name.ilike.%${resolvedSearchParams.search}%,email.ilike.%${resolvedSearchParams.search}%,phone.ilike.%${resolvedSearchParams.search}%`
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
        searchParams={resolvedSearchParams}
      />
    </div>
  )
}
