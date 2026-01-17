import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DoctorListTable } from '@/components/admin/doctor-list-table'
import { DoctorListClient } from '@/components/admin/doctor-list-client'
import { DoctorSearchForm } from '@/components/admin/doctor-search-form'
import { Download } from 'lucide-react'

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams: { 
    filter?: string
    search?: string
    specialty?: string
    sort?: string
    order?: 'asc' | 'desc'
    page?: string
  }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    redirect('/patient')
  }

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
  if (searchParams.filter === 'pending') {
    query = query.eq('license_verified', false)
  } else if (searchParams.filter === 'verified') {
    query = query.eq('license_verified', true)
  }

  if (searchParams.specialty) {
    query = query.eq('specialty', searchParams.specialty)
  }

  if (searchParams.search) {
    query = query.or(
      `full_name.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%,license_number.ilike.%${searchParams.search}%,specialty.ilike.%${searchParams.search}%`
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

  if (searchParams.filter === 'pending') {
    countQuery = countQuery.eq('license_verified', false)
  } else if (searchParams.filter === 'verified') {
    countQuery = countQuery.eq('license_verified', true)
  }

  if (searchParams.specialty) {
    countQuery = countQuery.eq('specialty', searchParams.specialty)
  }

  if (searchParams.search) {
    countQuery = countQuery.or(
      `full_name.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%,license_number.ilike.%${searchParams.search}%,specialty.ilike.%${searchParams.search}%`
    )
  }

  const { count: totalCount } = await countQuery

  const totalPages = Math.ceil((totalCount || 0) / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctor Management</h1>
          <p className="text-gray-600 mt-1">Manage and verify doctor accounts</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Enhanced Filters */}
      <DoctorSearchForm
        specialties={specialties}
        currentFilter={searchParams.filter}
        currentSearch={searchParams.search}
        currentSpecialty={searchParams.specialty}
      />

      {/* Enhanced Doctors Table */}
      <DoctorListClient 
        doctors={doctorsWithStats}
        currentPage={page}
        totalPages={totalPages}
        searchParams={searchParams}
      />
    </div>
  )
}
