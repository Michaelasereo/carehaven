import { createClient } from '@/lib/supabase/server'
import { AdminBookAppointment } from '@/components/admin/admin-book-appointment'
import { getConsultationDuration, getConsultationPrice } from '@/lib/admin/system-settings'

export default async function AdminBookAppointmentPage() {
  const supabase = await createClient()

  const [{ data: patients }, { data: doctors }, consultationPrice, consultationDuration] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'patient')
        .order('full_name', { ascending: true }),
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'doctor')
        .order('full_name', { ascending: true }),
      getConsultationPrice(),
      getConsultationDuration(),
    ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
        <p className="text-gray-600 mt-1">
          Create an appointment on behalf of a patient.
        </p>
      </div>
      <AdminBookAppointment
        patients={patients || []}
        doctors={doctors || []}
        consultationPrice={consultationPrice}
        consultationDuration={consultationDuration}
      />
    </div>
  )
}
