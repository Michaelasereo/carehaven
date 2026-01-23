'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { isTimeAvailable, getAvailableTimeSlots, type AvailabilitySlot } from '@/lib/utils/availability'
import { Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const BUFFER_MINUTES = 15

interface PersonOption {
  id: string
  full_name: string | null
  email: string | null
}

interface AdminBookAppointmentProps {
  patients: PersonOption[]
  doctors: PersonOption[]
  consultationPrice: number
  consultationDuration: number
}

export function AdminBookAppointment({
  patients,
  doctors,
  consultationPrice,
  consultationDuration,
}: AdminBookAppointmentProps) {
  const router = useRouter()
  const supabase = createClient()
  const { addToast } = useToast()

  const [patientId, setPatientId] = useState<string>('')
  const [doctorId, setDoctorId] = useState<string>('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'waived'>('waived')
  const [symptoms, setSymptoms] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const { data: availability, isLoading: isLoadingAvailability } = useQuery({
    queryKey: ['admin-doctor-availability', doctorId],
    queryFn: async () => {
      if (!doctorId) return []
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true })
      if (error) throw error
      return (data || []).map((slot: { day_of_week: number; start_time: string; end_time: string; active: boolean }) => ({
        day_of_week: slot.day_of_week,
        start_time: typeof slot.start_time === 'string' ? slot.start_time.substring(0, 5) : slot.start_time,
        end_time: typeof slot.end_time === 'string' ? slot.end_time.substring(0, 5) : slot.end_time,
        active: slot.active,
      })) as AvailabilitySlot[]
    },
    enabled: !!doctorId,
  })

  const { data: existingAppointments } = useQuery({
    queryKey: ['admin-doctor-appointments', doctorId, date],
    queryFn: async () => {
      if (!doctorId || !date) return []
      const startOfDay = new Date(`${date}T00:00:00`)
      const endOfDay = new Date(`${date}T23:59:59`)
      const { data, error } = await supabase
        .from('appointments')
        .select('scheduled_at, duration_minutes')
        .eq('doctor_id', doctorId)
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
        .in('status', ['scheduled', 'confirmed', 'in_progress'])
      if (error) throw error
      return data || []
    },
    enabled: !!doctorId && !!date,
  })

  const dateObj = date ? (() => {
    const [y, m, d] = date.split('-').map(Number)
    return new Date(y, m - 1, d)
  })() : null
  const availableTimeSlots = dateObj && availability
    ? getAvailableTimeSlots(dateObj, availability, consultationDuration, existingAppointments || [], BUFFER_MINUTES)
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId || !doctorId || !date || !time) {
      addToast({
        variant: 'destructive',
        title: 'Missing details',
        description: 'Please select patient, doctor, date, and time.',
      })
      return
    }

    const scheduledAt = new Date(`${date}T${time}`).toISOString()

    if (availability && availability.length > 0) {
      const scheduledDate = new Date(`${date}T${time}`)
      if (!isTimeAvailable(scheduledDate, time, availability)) {
        addToast({
          variant: 'destructive',
          title: 'Time not available',
          description: 'The selected time is not in the doctor\'s schedule. Please choose an offered slot.',
        })
        return
      }
    }

    const ourStart = new Date(`${date}T${time}`).getTime()
    const ourEnd = ourStart + consultationDuration * 60 * 1000
    const hasConflict = (existingAppointments || []).some((apt) => {
      const aptStart = new Date(apt.scheduled_at).getTime()
      const aptEnd = aptStart + (apt.duration_minutes || consultationDuration) * 60 * 1000
      return ourStart < aptEnd && ourEnd > aptStart
    })
    if (hasConflict) {
      addToast({
        variant: 'destructive',
        title: 'Time slot taken',
        description: 'This time overlaps with an existing appointment. Please choose another time.',
      })
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/appointments/admin-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: doctorId,
          scheduled_at: scheduledAt,
          duration_minutes: consultationDuration,
          chief_complaint: symptoms || 'Admin booking',
          symptoms_description: symptoms || null,
          amount: consultationPrice,
          currency: 'NGN',
          status: 'scheduled',
          payment_status: paymentStatus,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data.error as string) || 'Failed to create appointment')
      }

      addToast({
        variant: 'success',
        title: 'Appointment created',
        description: 'The appointment has been booked successfully. The patient and doctor will receive booking email and SMS.',
      })
      router.push('/admin/appointments')
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string }
      const msg = (e?.message && typeof e.message === 'string')
        ? e.message
        : (err instanceof Error ? err.message : 'Unable to create the appointment. Please try again.')
      console.error('Error creating appointment:', e?.message, e?.code, err)
      addToast({
        variant: 'destructive',
        title: 'Booking failed',
        description: msg,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2 w-full">
          <Label>Select Patient *</Label>
          <Select value={patientId} onValueChange={setPatientId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.full_name || 'Unnamed'} {patient.email ? `(${patient.email})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 w-full">
          <Label>Doctor *</Label>
            <Select
              value={doctorId}
              onValueChange={(v) => {
                setDoctorId(v)
                setDate('')
                setTime('')
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.full_name || 'Unnamed'} {doctor.email ? `(${doctor.email})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setTime('')
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Time *</Label>
            {!doctorId ? (
              <p className="text-sm text-gray-500 py-2">Select a doctor first</p>
            ) : !date ? (
              <p className="text-sm text-gray-500 py-2">Select a date first</p>
            ) : isLoadingAvailability ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading availability...</span>
              </div>
            ) : availableTimeSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableTimeSlots.map((slot) => {
                  const [h, min] = slot.split(':').map(Number)
                  const disp = `${h % 12 || 12}:${String(min).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className={cn(
                        'p-2 text-sm rounded-lg border transition-colors',
                        time === slot ? 'bg-teal-600 text-white border-teal-600' : 'bg-white hover:bg-teal-50 border-gray-200'
                      )}
                    >
                      {disp}
                    </button>
                  )
                })}
              </div>
            ) : availability && availability.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-amber-700 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Doctor has not set their availability. You can enter a time below.
                </p>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-amber-700 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  No available slots for this date. You can enter a custom time below.
                </p>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Payment Status *</Label>
            <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as 'paid' | 'pending' | 'waived')}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="waived">Waived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="symptoms">Complaints / Symptoms (optional)</Label>
          <Textarea
            id="symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={4}
            placeholder="Optional notes about the appointment"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Consultation fee: ₦{Math.round(consultationPrice / 100).toLocaleString()}
          </div>
          <Button
            type="submit"
            className="bg-teal-600 hover:bg-teal-700"
            disabled={isSaving}
          >
            {isSaving ? 'Booking...' : 'Book Appointment'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
