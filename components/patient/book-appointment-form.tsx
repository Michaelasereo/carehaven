'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
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
import { useCreateAppointment } from '@/lib/react-query/mutations'
import { useRouter } from 'next/navigation'
import { DoctorList } from './doctor-list'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Calendar, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isTimeAvailable, getAvailableTimeSlots, type AvailabilitySlot } from '@/lib/utils/availability'
import { useQuery } from '@tanstack/react-query'

const appointmentSchema = z.object({
  chief_complaint: z.string().min(5, 'Reason must be at least 5 characters'),
  symptoms_description: z.string().optional(),
  doctor_id: z.string().uuid('Please select a doctor'),
  scheduled_at: z.string().min(1, 'Please select a date and time'),
  amount: z.number().optional(),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

export function BookAppointmentForm() {
  const router = useRouter()
  const supabase = createClient()
  const createAppointment = useCreateAppointment()
  
  const [step, setStep] = useState(1)
  const [selectedDoctor, setSelectedDoctor] = useState<{
    id: string
    name: string
    specialty: string | null
    fee: number | null
  } | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [consultationPrice, setConsultationPrice] = useState<number>(5000) // Default 50 naira (5000 kobo)

  // Fetch doctor availability with real-time sync
  const { data: availability, refetch: refetchAvailability } = useQuery({
    queryKey: ['doctor-availability', selectedDoctor?.id],
    queryFn: async () => {
      if (!selectedDoctor?.id) return []
      
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', selectedDoctor.id)
        .eq('active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error
      return (data || []) as AvailabilitySlot[]
    },
    enabled: !!selectedDoctor?.id,
  })

  // Subscribe to real-time availability changes
  useEffect(() => {
    if (!selectedDoctor?.id) return

    let timeoutId: NodeJS.Timeout

    const channel = supabase
      .channel(`doctor-availability-${selectedDoctor.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctor_availability',
          filter: `doctor_id=eq.${selectedDoctor.id}`,
        },
        () => {
          // Debounce refetch (500ms) to prevent excessive updates
          clearTimeout(timeoutId)
          timeoutId = setTimeout(() => {
            refetchAvailability()
          }, 500)
        }
      )
      .subscribe()

    return () => {
      clearTimeout(timeoutId)
      supabase.removeChannel(channel)
    }
  }, [selectedDoctor?.id, supabase, refetchAvailability])

  // Fetch existing appointments for conflict checking
  const { data: existingAppointments } = useQuery({
    queryKey: ['doctor-appointments', selectedDoctor?.id, selectedDate],
    queryFn: async () => {
      if (!selectedDoctor?.id || !selectedDate) return []
      
      const startOfDay = new Date(`${selectedDate}T00:00:00`)
      const endOfDay = new Date(`${selectedDate}T23:59:59`)
      
      const { data, error } = await supabase
        .from('appointments')
        .select('scheduled_at, duration_minutes')
        .eq('doctor_id', selectedDoctor.id)
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
        .in('status', ['scheduled', 'confirmed', 'in_progress'])

      if (error) throw error
      return data || []
    },
    enabled: !!selectedDoctor?.id && !!selectedDate,
  })

  // Generate available time slots when date changes
  const availableTimeSlots = selectedDate && availability
    ? getAvailableTimeSlots(
        new Date(selectedDate),
        availability,
        30,
        existingAppointments || []
      )
    : []

  // Reset time when date changes
  useEffect(() => {
    if (selectedDate && availableTimeSlots.length > 0) {
      // Auto-select first available slot if current time is not available
      if (!selectedTime || !availableTimeSlots.includes(selectedTime)) {
        setSelectedTime(availableTimeSlots[0])
      }
    } else if (selectedDate && availableTimeSlots.length === 0) {
      setSelectedTime('')
      setAvailabilityError('No available time slots for this date. Please select another date.')
    } else {
      setAvailabilityError(null)
    }
  }, [selectedDate, availableTimeSlots, selectedTime])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  })

  const chiefComplaint = watch('chief_complaint')
  const symptomsDescription = watch('symptoms_description')

  // Step 1: Enter Details
  const handleStep1Next = () => {
    if (!chiefComplaint || chiefComplaint.length < 5) {
      return
    }
    setStep(2)
  }

  // Step 2: Select Doctor
  const handleDoctorSelect = (doctorId: string) => {
    // Fetch doctor details
    supabase
      .from('profiles')
      .select('id, full_name, specialty, consultation_fee')
      .eq('id', doctorId)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          setSelectedDoctor({
            id: data.id,
            name: data.full_name || 'Dr. Unknown',
            specialty: data.specialty,
            fee: data.consultation_fee,
          })
          setValue('doctor_id', data.id)
          setValue('amount', consultationPrice)
          // Reset date/time when doctor changes
          setSelectedDate('')
          setSelectedTime('')
          setAvailabilityError(null)
          setStep(3)
        }
      })
  }

  // Step 3: Checkout & Payment
  const onSubmit = async (data: AppointmentFormData) => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      return
    }

    // Validate availability
    if (availability && availability.length > 0) {
      const scheduledDate = new Date(`${selectedDate}T${selectedTime}`)
      if (!isTimeAvailable(scheduledDate, selectedTime, availability)) {
        setAvailabilityError('Selected time is not available. Please choose another time.')
        return
      }
    }

    // Check for conflicts with existing appointments
    if (existingAppointments && existingAppointments.length > 0) {
      const scheduledDate = new Date(`${selectedDate}T${selectedTime}`)
      const scheduledEnd = new Date(scheduledDate.getTime() + 30 * 60000)
      
      const hasConflict = existingAppointments.some(apt => {
        const aptDate = new Date(apt.scheduled_at)
        const aptEnd = new Date(aptDate.getTime() + (apt.duration_minutes || 30) * 60000)
        return scheduledDate < aptEnd && scheduledEnd > aptDate
      })

      if (hasConflict) {
        setAvailabilityError('This time slot is already booked. Please choose another time.')
        return
      }
    }

    setAvailabilityError(null)
    setIsProcessingPayment(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }

      // Combine date and time
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}`).toISOString()

      // Create appointment
      const appointment = await createAppointment.mutateAsync({
        patient_id: user.id,
        doctor_id: data.doctor_id,
        chief_complaint: data.chief_complaint,
        symptoms_description: data.symptoms_description,
        scheduled_at: scheduledAt,
        amount: consultationPrice,
        currency: 'NGN',
        status: 'scheduled',
        payment_status: 'pending',
      })

      // Initialize payment
      const paymentResponse = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: consultationPrice,
          appointmentId: appointment.id,
        }),
      })

      const paymentData = await paymentResponse.json()

      if (paymentData.authorization_url) {
        // Redirect to Paystack
        window.location.href = paymentData.authorization_url
      } else {
        throw new Error('Failed to initialize payment')
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      alert('Failed to book appointment. Please try again.')
      setIsProcessingPayment(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant={step >= 1 ? 'default' : 'outline'}
          size="sm"
          className={step >= 1 ? 'bg-teal-600' : ''}
          disabled
        >
          Step 1: Enter Details
        </Button>
        <Button
          variant={step >= 2 ? 'default' : 'outline'}
          size="sm"
          className={step >= 2 ? 'bg-teal-600' : ''}
          disabled
        >
          Step 2: Match with Doctor
        </Button>
        <Button
          variant={step >= 3 ? 'default' : 'outline'}
          size="sm"
          className={step >= 3 ? 'bg-teal-600' : ''}
          disabled
        >
          Step 3: Checkout
        </Button>
      </div>

      {/* Back Button */}
      {step > 1 && (
        <Button
          variant="ghost"
          onClick={() => setStep(step - 1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Enter Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="chief_complaint">Reason for Consultation *</Label>
              <Input
                id="chief_complaint"
                {...register('chief_complaint')}
                placeholder="e.g., Initial Consultation, Follow-up, etc."
              />
              {errors.chief_complaint && (
                <p className="mt-1 text-sm text-red-600">{errors.chief_complaint.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="symptoms_description">Complaints / Symptoms</Label>
              <Textarea
                id="symptoms_description"
                {...register('symptoms_description')}
                rows={4}
                placeholder="Describe your symptoms or reason for consultation..."
              />
            </div>

            <Button
              type="button"
              onClick={handleStep1Next}
              className="bg-teal-600 hover:bg-teal-700"
              disabled={!chiefComplaint || chiefComplaint.length < 5}
            >
              Next
            </Button>
          </div>
        )}

        {/* Step 2: Match with Doctor */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Select a Doctor</h3>
              <DoctorList onSelectDoctor={handleDoctorSelect} />
            </div>
          </div>
        )}

        {/* Step 3: Checkout */}
        {step === 3 && selectedDoctor && (
          <div className="space-y-6">
            <div className="border rounded-lg p-6 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Consultation with {selectedDoctor.name}</p>
                  {selectedDoctor.specialty && (
                    <p className="text-sm text-gray-600">{selectedDoctor.specialty}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Date: {selectedDate || 'Not selected'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    Time: {selectedTime
                      ? (() => {
                          const [hours, minutes] = selectedTime.split(':').map(Number)
                          const hour12 = hours % 12 || 12
                          const ampm = hours >= 12 ? 'PM' : 'AM'
                          return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
                        })()
                      : 'Not selected'}
                  </span>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="appointment_date">Select Date *</Label>
                    <Input
                      id="appointment_date"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value)
                        setSelectedTime('') // Reset time when date changes
                        setAvailabilityError(null)
                        if (selectedTime) {
                          const dateTime = `${e.target.value}T${selectedTime}`
                          setValue('scheduled_at', dateTime)
                        }
                      }}
                      className="w-48"
                    />
                  </div>
                  {!selectedDate && (
                    <p className="mt-1 text-sm text-red-600">Please select a date</p>
                  )}
                  {selectedDate && availability && availability.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Available time slots will appear below after selecting a date
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <Label htmlFor="appointment_time">Select Time *</Label>
                  {selectedDate && availability && availability.length > 0 ? (
                    <div className="mt-2">
                      {availableTimeSlots.length > 0 ? (
                        <Select
                          value={selectedTime}
                          onValueChange={(value) => {
                            setSelectedTime(value)
                            if (selectedDate) {
                              const dateTime = `${selectedDate}T${value}`
                              setValue('scheduled_at', dateTime)
                            }
                            setAvailabilityError(null)
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a time slot" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTimeSlots.map((time) => {
                              // Format time for display (HH:MM -> 12-hour format)
                              const [hours, minutes] = time.split(':').map(Number)
                              const hour12 = hours % 12 || 12
                              const ampm = hours >= 12 ? 'PM' : 'AM'
                              const displayTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
                              
                              return (
                                <SelectItem key={time} value={time}>
                                  {displayTime}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800">
                              No available time slots
                            </p>
                            <p className="text-sm text-yellow-700 mt-1">
                              This doctor has no available time slots for the selected date. Please choose another date.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : selectedDate && (!availability || availability.length === 0) ? (
                    <div className="mt-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Availability not set
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          This doctor has not set their availability. Please contact them directly or choose another doctor.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">Please select a date first</p>
                  )}
                  {availabilityError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {availabilityError}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                  <span className="text-lg font-semibold">Subtotal:</span>
                  <span className="text-2xl font-bold text-teal-600">
                    {formatCurrency(consultationPrice, 'NGN')}
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={
                isProcessingPayment ||
                !selectedDate ||
                !selectedTime ||
                availableTimeSlots.length === 0 ||
                !!availabilityError
              }
            >
              {isProcessingPayment ? 'Processing...' : 'Proceed to Checkout'}
            </Button>
            {availabilityError && (
              <p className="text-sm text-red-600 text-center">{availabilityError}</p>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
