import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SessionNotesList } from '@/components/doctor/session-notes-list'

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SessionNotesPage() {
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

  // Fetch completed appointments that don't have consultation notes
  // Using a subquery approach since Supabase doesn't support LEFT JOIN directly in select
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:profiles!appointments_patient_id_fkey(full_name, email)
    `)
    .eq('doctor_id', user.id)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: false })
    .limit(100)

  if (appointmentsError) {
    console.error('Error fetching appointments:', appointmentsError)
  }

  // Fetch all consultation notes for these appointments to filter out ones that have notes
  const appointmentIds = appointments?.map(apt => apt.id) || []
  
  let appointmentsWithoutNotes = appointments || []
  
  if (appointmentIds.length > 0) {
    const { data: notes } = await supabase
      .from('consultation_notes')
      .select('appointment_id')
      .in('appointment_id', appointmentIds)

    const appointmentIdsWithNotes = new Set(notes?.map(note => note.appointment_id) || [])
    
    // Filter out appointments that already have notes
    appointmentsWithoutNotes = appointments?.filter(
      apt => !appointmentIdsWithNotes.has(apt.id)
    ) || []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Session Notes</h1>
          <p className="text-gray-600 mt-1">
            Complete consultation notes for finished sessions
          </p>
        </div>
      </div>

      <SessionNotesList 
        initialAppointments={appointmentsWithoutNotes}
        doctorId={user.id}
      />
    </div>
  )
}
