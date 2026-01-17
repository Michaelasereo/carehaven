'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Calendar, Pill, TestTube, FileText } from 'lucide-react'
import Link from 'next/link'

interface PatientMedicalHistoryProps {
  patientId: string
  doctorId: string
}

export function PatientMedicalHistory({ patientId, doctorId }: PatientMedicalHistoryProps) {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [investigations, setInvestigations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [
          { data: apts },
          { data: prescs },
          { data: invs },
        ] = await Promise.all([
          supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', patientId)
            .eq('doctor_id', doctorId)
            .order('scheduled_at', { ascending: false }),
          supabase
            .from('prescriptions')
            .select('*, appointments!prescriptions_appointment_id_fkey(scheduled_at)')
            .eq('patient_id', patientId)
            .eq('doctor_id', doctorId)
            .order('created_at', { ascending: false }),
          supabase
            .from('investigations')
            .select('*, appointments!investigations_appointment_id_fkey(scheduled_at)')
            .eq('patient_id', patientId)
            .eq('doctor_id', doctorId)
            .order('created_at', { ascending: false }),
        ])

        setAppointments(apts || [])
        setPrescriptions(prescs || [])
        setInvestigations(invs || [])
      } catch (error) {
        console.error('Error fetching medical history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [patientId, doctorId, supabase])

  if (loading) {
    return <Card className="p-6">Loading medical history...</Card>
  }

  // Combine all items into a timeline
  const timelineItems = [
    ...appointments.map(apt => ({
      type: 'appointment',
      id: apt.id,
      date: apt.scheduled_at,
      data: apt,
    })),
    ...prescriptions.map(presc => ({
      type: 'prescription',
      id: presc.id,
      date: presc.created_at,
      data: presc,
    })),
    ...investigations.map(inv => ({
      type: 'investigation',
      id: inv.id,
      date: inv.created_at,
      data: inv,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Complete Medical Timeline</h3>
      <div className="space-y-4">
        {timelineItems.length > 0 ? (
          timelineItems.map((item) => {
            if (item.type === 'appointment') {
              const apt = item.data
              return (
                <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">Appointment - {format(new Date(apt.scheduled_at), 'MMM d, yyyy')}</p>
                      <Badge variant={apt.status === 'completed' ? 'default' : 'secondary'}>
                        {apt.status}
                      </Badge>
                    </div>
                    {apt.chief_complaint && (
                      <p className="text-sm text-gray-600">{apt.chief_complaint}</p>
                    )}
                    <Link href={`/doctor/appointments/${apt.id}`}>
                      <span className="text-sm text-teal-600 hover:underline mt-1 inline-block">
                        View Details →
                      </span>
                    </Link>
                  </div>
                </div>
              )
            } else if (item.type === 'prescription') {
              const presc = item.data
              return (
                <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Pill className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">Prescription - {format(new Date(presc.created_at), 'MMM d, yyyy')}</p>
                      <Badge variant={presc.status === 'active' ? 'default' : 'secondary'}>
                        {presc.status}
                      </Badge>
                    </div>
                    {presc.instructions && (
                      <p className="text-sm text-gray-600">{presc.instructions}</p>
                    )}
                  </div>
                </div>
              )
            } else {
              const inv = item.data
              return (
                <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <TestTube className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{inv.test_name} - {format(new Date(inv.created_at), 'MMM d, yyyy')}</p>
                      <Badge variant={inv.status === 'completed' ? 'default' : 'secondary'}>
                        {inv.status}
                      </Badge>
                    </div>
                    {inv.results_text && (
                      <p className="text-sm text-gray-600">{inv.results_text}</p>
                    )}
                  </div>
                </div>
              )
            }
          })
        ) : (
          <p className="text-gray-500 text-center py-8">No medical history available</p>
        )}
      </div>
    </Card>
  )
}
