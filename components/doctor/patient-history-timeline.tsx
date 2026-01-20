'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Calendar, Pill, TestTube, FileText } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

interface PatientHistoryTimelineProps {
  patientId: string
  currentAppointmentId: string
}

export function PatientHistoryTimeline({ patientId, currentAppointmentId }: PatientHistoryTimelineProps) {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [investigations, setInvestigations] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Fetch all appointments with this patient
        const { data: apts } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', patientId)
          .order('scheduled_at', { ascending: false })
          .limit(20)

        // Fetch all prescriptions
        const { data: prescs } = await supabase
          .from('prescriptions')
          .select('*, appointments!prescriptions_appointment_id_fkey(scheduled_at)')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(20)

        // Fetch all investigations
        const { data: invs } = await supabase
          .from('investigations')
          .select('*, appointments!investigations_appointment_id_fkey(scheduled_at)')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(20)

        // Fetch consultation notes across all appointments (including those from other doctors)
        const { data: noteRows } = await supabase
          .from('consultation_notes')
          .select(`
            *,
            appointments!consultation_notes_appointment_id_fkey(
              scheduled_at,
              doctor_id,
              profiles!appointments_doctor_id_fkey(full_name)
            )
          `)
          // Critical: scope to this patient only (via the joined appointment)
          .eq('appointments.patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(20)

        setAppointments(apts || [])
        setPrescriptions(prescs || [])
        setInvestigations(invs || [])
        setNotes(noteRows || [])
      } catch (error) {
        console.error('Error fetching patient history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [patientId, supabase])

  if (loading) {
    return <Card className="p-6">Loading history...</Card>
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Patient Medical History</h3>
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="investigations">Investigations</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-3">
          {appointments.length > 0 ? (
            appointments.map((apt) => (
              <div
                key={apt.id}
                className={`p-4 border rounded-lg ${apt.id === currentAppointmentId ? 'bg-teal-50 border-teal-200' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {format(new Date(apt.scheduled_at), 'MMM d, yyyy')}
                    </span>
                    {apt.id === currentAppointmentId && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </div>
                  <Badge variant={apt.status === 'completed' ? 'default' : 'secondary'}>
                    {apt.status}
                  </Badge>
                </div>
                {apt.chief_complaint && (
                  <p className="text-sm text-gray-600 mt-1">{apt.chief_complaint}</p>
                )}
                {apt.id !== currentAppointmentId && (
                  <Link href={`/doctor/appointments/${apt.id}`}>
                    <span className="text-sm text-teal-600 hover:underline mt-2 inline-block">
                      View Details →
                    </span>
                  </Link>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No previous appointments</p>
          )}
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-3">
          {prescriptions.length > 0 ? (
            prescriptions.map((presc) => (
              <div key={presc.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {format(new Date(presc.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <Badge variant={presc.status === 'active' ? 'default' : 'secondary'}>
                    {presc.status}
                  </Badge>
                </div>
                {presc.instructions && (
                  <p className="text-sm text-gray-600 mt-1">{presc.instructions}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No prescriptions</p>
          )}
        </TabsContent>

        <TabsContent value="investigations" className="space-y-3">
          {investigations.length > 0 ? (
            investigations.map((invest) => (
              <div key={invest.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TestTube className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{invest.test_name}</span>
                  </div>
                  <Badge variant={invest.status === 'completed' ? 'default' : 'secondary'}>
                    {invest.status}
                  </Badge>
                </div>
                {invest.results_text && (
                  <p className="text-sm text-gray-600 mt-1">{invest.results_text}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No investigations</p>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-3">
          {notes.length > 0 ? (
            notes.map((note) => {
              const apt = note.appointments
              const scheduledAt = apt?.scheduled_at ? new Date(apt.scheduled_at) : null
              const doctorName =
                apt?.profiles?.full_name ||
                'Doctor'

              const preview =
                note.diagnosis ||
                note.assessment ||
                note.subjective ||
                ''

              return (
                <div key={note.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {scheduledAt ? format(scheduledAt, 'MMM d, yyyy') : 'Session'}
                      </span>
                      <Badge variant="secondary">{doctorName}</Badge>
                      {note.appointment_id === currentAppointmentId && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </div>
                    {note.diagnosis ? (
                      <Badge variant="default">Diagnosis</Badge>
                    ) : (
                      <Badge variant="secondary">Note</Badge>
                    )}
                  </div>

                  {preview && (
                    <p className="text-sm text-gray-600 mt-1">
                      {String(preview).slice(0, 220)}
                      {String(preview).length > 220 ? '…' : ''}
                    </p>
                  )}

                  <Link href={`/doctor/appointments/${note.appointment_id}`}>
                    <span className="text-sm text-teal-600 hover:underline mt-2 inline-block">
                      View Full Session →
                    </span>
                  </Link>
                </div>
              )
            })
          ) : (
            <p className="text-gray-500 text-center py-4">No consultation notes</p>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  )
}
