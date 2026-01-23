import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AvailabilityCalendarView } from '@/components/doctor/availability-calendar-view'
import { AvailabilityPageClient } from '@/components/doctor/availability-page-client'

export default async function AdminDoctorAvailabilityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const doctorId = id

  const supabase = await createClient()

  const { data: doctor } = await supabase
    .from('profiles')
    .select('id, full_name, license_verified')
    .eq('id', doctorId)
    .single()

  if (!doctor) {
    notFound()
  }

  const { data: availability } = await supabase
    .from('doctor_availability')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('day_of_week', { ascending: true })

  const slots = (availability || []).map((s: { day_of_week: number; start_time: string; end_time: string; active: boolean }) => ({
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    end_time: s.end_time,
    active: s.active,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Availability</h1>
        <p className="text-gray-600 mt-1">
          Editing availability for {doctor.full_name || 'Doctor'}.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Calendar View</h2>
        <p className="text-sm text-gray-600 mb-3">Recurring weekly availability for the next 3 weeks.</p>
        <AvailabilityCalendarView availability={slots} weeks={3} />
      </div>

      <AvailabilityPageClient
        doctorId={doctorId}
        initialLicenseVerified={doctor.license_verified ?? true}
        initialAvailability={availability || []}
      />
    </div>
  )
}
