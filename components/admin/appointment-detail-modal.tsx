'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import { Calendar, Clock, DollarSign, User, Stethoscope, FileText } from 'lucide-react'
import Link from 'next/link'

interface AppointmentDetailModalProps {
  appointmentId: string | null
  isOpen: boolean
  onClose: () => void
}

export function AppointmentDetailModal({
  appointmentId,
  isOpen,
  onClose,
}: AppointmentDetailModalProps) {
  const supabase = createClient()
  const [appointment, setAppointment] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [soapNotes, setSoapNotes] = useState<any>(null)
  const [prescription, setPrescription] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    // Fetch user role
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setUserRole(profile?.role || null)
      }
    }

    fetchUserRole()
  }, [isOpen, supabase])

  useEffect(() => {
    if (!appointmentId || !isOpen) return

    const fetchAppointmentDetails = async () => {
      setLoading(true)
      try {
        // Fetch appointment with related data
        const { data: apt, error } = await supabase
          .from('appointments')
          .select(`
            *,
            patient:profiles!appointments_patient_id_fkey(*),
            doctor:profiles!appointments_doctor_id_fkey(*)
          `)
          .eq('id', appointmentId)
          .single()

        if (error) throw error
        setAppointment(apt)

        // Fetch SOAP notes only if user is super_admin and appointment is completed
        if (userRole === 'super_admin' && apt?.status === 'completed') {
          const { data: notes } = await supabase
            .from('consultation_notes')
            .select('*')
            .eq('appointment_id', appointmentId)
            .maybeSingle()
          setSoapNotes(notes)
        } else {
          setSoapNotes(null)
        }

        // Fetch prescription if appointment is completed
        if (apt?.status === 'completed') {
          const { data: presc } = await supabase
            .from('prescriptions')
            .select('*')
            .eq('appointment_id', appointmentId)
            .maybeSingle()
          setPrescription(presc)
        }
      } catch (error) {
        console.error('Error fetching appointment details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAppointmentDetails()
  }, [appointmentId, isOpen, userRole, supabase])

  if (!appointment) return null

  const scheduledAt = new Date(appointment.scheduled_at)
  const endTime = new Date(scheduledAt.getTime() + (appointment.duration_minutes || 45) * 60000)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Appointment Details</DialogTitle>
          <DialogDescription>
            View complete appointment information
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Appointment Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Patient</p>
                  <Link
                    href={`/admin/patients/${appointment.patient?.id}`}
                    className="font-medium hover:text-blue-600"
                  >
                    {appointment.patient?.full_name || 'Unknown'}
                  </Link>
                  <p className="text-sm text-gray-500">{appointment.patient?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Doctor</p>
                  <Link
                    href={`/admin/doctors/${appointment.doctor?.id}`}
                    className="font-medium hover:text-teal-600"
                  >
                    {appointment.doctor?.full_name || 'Unknown'}
                  </Link>
                  <p className="text-sm text-gray-500">{appointment.doctor?.specialty}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="font-medium">
                    {format(scheduledAt, 'MMM d, yyyy')} at {format(scheduledAt, 'h:mm a')} - {format(endTime, 'h:mm a')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
                    {appointment.status}
                  </Badge>
                </div>
                {appointment.amount && (
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-medium">₦{Math.round(Number(appointment.amount) / 100).toLocaleString()}</p>
                    <Badge variant={appointment.payment_status === 'paid' ? 'default' : 'secondary'} className="mt-1">
                      {appointment.payment_status}
                    </Badge>
                  </div>
                )}
              </div>
              {appointment.chief_complaint && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-1">Chief Complaint</p>
                  <p className="text-gray-900">{appointment.chief_complaint}</p>
                </div>
              )}
            </Card>

            {/* SOAP Notes - Only visible to super_admin */}
            {userRole === 'super_admin' && soapNotes && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Consultation Notes (SOAP)</h3>
                <div className="space-y-4">
                  {soapNotes.subjective && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Subjective</p>
                      <p className="text-gray-900">{soapNotes.subjective}</p>
                    </div>
                  )}
                  {soapNotes.objective && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Objective</p>
                      <p className="text-gray-900">{soapNotes.objective}</p>
                    </div>
                  )}
                  {soapNotes.assessment && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Assessment</p>
                      <p className="text-gray-900">{soapNotes.assessment}</p>
                    </div>
                  )}
                  {soapNotes.plan && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Plan</p>
                      <p className="text-gray-900">{soapNotes.plan}</p>
                    </div>
                  )}
                  {soapNotes.diagnosis && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Diagnosis</p>
                      <p className="text-gray-900">{soapNotes.diagnosis}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Prescription */}
            {prescription && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Prescription</h3>
                {prescription.medications && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Medications</p>
                    <pre className="text-sm bg-gray-50 p-3 rounded">
                      {JSON.stringify(prescription.medications, null, 2)}
                    </pre>
                  </div>
                )}
              </Card>
            )}

            {/* Video Recording */}
            {appointment.recording_url && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Video Recording</h3>
                <a
                  href={appointment.recording_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:text-teal-700 underline"
                >
                  View Recording
                </a>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
