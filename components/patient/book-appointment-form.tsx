'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
import { OrderSummaryCard } from './order-summary-card'
import { cn } from '@/lib/utils'
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { createClient } from '@/lib/supabase/client'
import { isTimeAvailable, getAvailableTimeSlots, type AvailabilitySlot } from '@/lib/utils/availability'
import { useQuery } from '@tanstack/react-query'
import { getConsultationDurationClient, getConsultationPriceClient } from '@/lib/admin/system-settings-client'
import { useToast } from '@/components/ui/toast'

const appointmentSchema = z.object({
  symptoms_description: z.string().min(5, 'Please describe your symptoms (min 5 characters)'),
  doctor_id: z.string().uuid('Please select a doctor'),
  scheduled_at: z.string().min(1, 'Please select a date and time'),
  amount: z.number().optional(),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

export function BookAppointmentForm() {
  const router = useRouter()
  const supabase = createClient()
  const createAppointment = useCreateAppointment()
  const { addToast } = useToast()
  
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
  const [pendingAppointmentId, setPendingAppointmentId] = useState<string | null>(null)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [consultationPrice, setConsultationPrice] = useState<number>(5000) // Default 50 naira (5000 kobo)
  const [consultationDuration, setConsultationDuration] = useState<number>(45) // Default 45 minutes
  const [chronicConditions, setChronicConditions] = useState<string[]>([])
  const [gender, setGender] = useState<string>('')
  const [age, setAge] = useState<string>('')
  const [isGenderLocked, setIsGenderLocked] = useState(false)
  const [isAgeLocked, setIsAgeLocked] = useState(false)
  const [genderError, setGenderError] = useState<string>('')
  const [ageError, setAgeError] = useState<string>('')
  const BUFFER_MINUTES = 15 // Buffer time between appointments
  const storageKey = 'carehaven.booking.form'

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  })

  const symptomsDescription = watch('symptoms_description')
  const watchedDoctorId = watch('doctor_id')
  const watchedScheduledAt = watch('scheduled_at')
  const watchedAmount = watch('amount')

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    if (Number.isNaN(birthDate.getTime())) return ''
    const today = new Date()
    let years = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      years -= 1
    }
    return years.toString()
  }

  useEffect(() => {
    const loadProfileDemographics = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('gender, date_of_birth')
        .eq('id', user.id)
        .single()
      if (!profile) return

      if (profile.gender) {
        setGender(profile.gender)
        setIsGenderLocked(true)
        setGenderError('')
      }
      if (profile.date_of_birth) {
        const calculatedAge = calculateAge(profile.date_of_birth)
        if (calculatedAge) {
          setAge(calculatedAge)
          setIsAgeLocked(true)
          setAgeError('')
        }
      }
    }

    loadProfileDemographics()
  }, [supabase])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = sessionStorage.getItem(storageKey)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as {
        step?: number
        selectedDoctor?: {
          id: string
          name: string
          specialty: string | null
          fee: number | null
        }
        selectedDate?: string
        selectedTime?: string
        gender?: string
        age?: string
        chronicConditions?: string[]
        pendingAppointmentId?: string | null
        formValues?: {
          symptoms_description?: string
          doctor_id?: string
          scheduled_at?: string
          amount?: number
        }
      }

      if (parsed.step) setStep(parsed.step)
      if (parsed.selectedDoctor?.id) {
        setSelectedDoctor(parsed.selectedDoctor)
        setValue('doctor_id', parsed.selectedDoctor.id)
      }
      if (parsed.selectedDate) setSelectedDate(parsed.selectedDate)
      if (parsed.selectedTime) setSelectedTime(parsed.selectedTime)
      if (parsed.gender) setGender(parsed.gender)
      if (parsed.age) setAge(parsed.age)
      if (Array.isArray(parsed.chronicConditions)) setChronicConditions(parsed.chronicConditions)
      if (parsed.pendingAppointmentId) setPendingAppointmentId(parsed.pendingAppointmentId)
      if (parsed.formValues?.symptoms_description) {
        setValue('symptoms_description', parsed.formValues.symptoms_description)
      }
      if (parsed.formValues?.scheduled_at) {
        setValue('scheduled_at', parsed.formValues.scheduled_at)
      }
      if (typeof parsed.formValues?.amount === 'number') {
        setValue('amount', parsed.formValues.amount)
      }
    } catch {
      sessionStorage.removeItem(storageKey)
    }
  }, [setValue])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const payload = {
      step,
      selectedDoctor,
      selectedDate,
      selectedTime,
      gender,
      age,
      chronicConditions,
      pendingAppointmentId,
      formValues: {
        symptoms_description: symptomsDescription,
        doctor_id: watchedDoctorId,
        scheduled_at: watchedScheduledAt,
        amount: watchedAmount,
      },
    }
    sessionStorage.setItem(storageKey, JSON.stringify(payload))
  }, [
    step,
    selectedDoctor,
    selectedDate,
    selectedTime,
    gender,
    age,
    chronicConditions,
    pendingAppointmentId,
    symptomsDescription,
    watchedDoctorId,
    watchedScheduledAt,
    watchedAmount,
  ])

  // Fetch consultation price with real-time sync
  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getConsultationPriceClient()
      setConsultationPrice(price)
    }

    fetchPrice()

    // Subscribe to real-time price changes
    let reconnectTimeoutId: NodeJS.Timeout
    let isSubscribed = false

    const setupSubscription = () => {
      const channel = supabase
        .channel('system-settings-price-booking')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'system_settings',
          },
          async () => {
            try {
              const newPrice = await getConsultationPriceClient()
              setConsultationPrice(newPrice)
            } catch (error) {
              console.error('Error fetching consultation price:', error)
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isSubscribed = true
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Realtime subscription error for consultation price:', status)
            isSubscribed = false
            // Attempt reconnection after 5 seconds
            reconnectTimeoutId = setTimeout(() => {
              if (!isSubscribed) {
                setupSubscription()
              }
            }, 5000)
          }
        })

      return channel
    }

    const channel = setupSubscription()

    return () => {
      clearTimeout(reconnectTimeoutId)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  useEffect(() => {
    if (selectedDoctor?.id) {
      setValue('amount', consultationPrice)
    }
  }, [consultationPrice, selectedDoctor, setValue])

  // Fetch consultation duration with real-time sync
  useEffect(() => {
    const fetchDuration = async () => {
      const duration = await getConsultationDurationClient()
      setConsultationDuration(duration)
    }

    fetchDuration()

    // Subscribe to real-time duration changes
    let reconnectTimeoutId: NodeJS.Timeout
    let isSubscribed = false

    const setupSubscription = () => {
      const channel = supabase
        .channel('system-settings-duration-booking')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'system_settings',
          },
          async () => {
            try {
              const newDuration = await getConsultationDurationClient()
              setConsultationDuration(newDuration)
            } catch (error) {
              console.error('Error fetching consultation duration:', error)
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isSubscribed = true
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Realtime subscription error for consultation duration:', status)
            isSubscribed = false
            // Attempt reconnection after 5 seconds
            reconnectTimeoutId = setTimeout(() => {
              if (!isSubscribed) {
                setupSubscription()
              }
            }, 5000)
          }
        })

      return channel
    }

    const channel = setupSubscription()

    return () => {
      clearTimeout(reconnectTimeoutId)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  // Fetch doctor availability with real-time sync
  const { 
    data: availability, 
    isLoading: isLoadingAvailability,
    error: availabilityQueryError,
    refetch: refetchAvailability 
  } = useQuery({
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

      if (error) {
        console.error('❌ Error fetching doctor availability:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }
      
      // Log availability data for debugging
      console.log('📅 Fetched availability for doctor:', selectedDoctor.id)
      console.log('Raw availability data:', data)
      console.log('Number of records:', data?.length || 0)
      
      if (!data || data.length === 0) {
        console.warn('⚠️ No availability records found for doctor:', selectedDoctor.id)
        console.log('This could mean:')
        console.log('1. Doctor has not set availability yet')
        console.log('2. All availability records are marked as inactive (active = false)')
        console.log('3. RLS policy is blocking the query')
        return []
      }
      
      // Ensure data format matches AvailabilitySlot interface
      const formattedData = (data || []).map((slot: any) => {
        const formatted = {
          day_of_week: slot.day_of_week,
          start_time: typeof slot.start_time === 'string' 
            ? slot.start_time.substring(0, 5) // Extract HH:MM from TIME format
            : slot.start_time,
          end_time: typeof slot.end_time === 'string'
            ? slot.end_time.substring(0, 5)
            : slot.end_time,
          active: slot.active,
        }
        console.log('Formatted slot:', formatted)
        return formatted
      }) as AvailabilitySlot[]
      
      console.log('✅ Formatted availability slots:', formattedData)
      console.log('Active slots:', formattedData.filter(s => s.active).length)
      
      return formattedData
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
    ? (() => {
        // Create date in local timezone to avoid UTC issues
        const [year, month, day] = selectedDate.split('-').map(Number)
        const dateObj = new Date(year, month - 1, day)
        const dayOfWeek = dateObj.getDay()
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        
        console.log('📅 Generating time slots for date:', selectedDate)
        console.log('   Selected date is:', dayNames[dayOfWeek], `(day_of_week: ${dayOfWeek})`)
        console.log('   Available slots in database:', availability.length)
        console.log('   Availability data:', availability)
        
        // Show which days have availability
        const availableDays = [...new Set(availability.map((slot: AvailabilitySlot) => slot.day_of_week))]
        console.log('   Doctor has availability on days:', availableDays.map(d => `${dayNames[d]} (${d})`).join(', '))
        
        // Check if selected day has availability
        const daySlots = availability.filter((slot: AvailabilitySlot) => 
          slot.day_of_week === dayOfWeek && slot.active
        )
        console.log('   Slots matching selected day:', daySlots.length)
        if (daySlots.length === 0) {
          console.warn('   ⚠️ No availability for', dayNames[dayOfWeek], '- Doctor only available on:', 
            availableDays.map(d => dayNames[d]).join(', '))
        }
        
        console.log('   Consultation duration:', consultationDuration, 'minutes')
        console.log('   Existing appointments:', existingAppointments?.length || 0)
        
        const slots = getAvailableTimeSlots(
          dateObj,
          availability,
          consultationDuration,
          existingAppointments || [],
          BUFFER_MINUTES
        )
        console.log('   ✅ Generated', slots.length, 'available time slots:', slots)
        return slots
      })()
    : []

  // Helper function to check if a date falls on a day the doctor is available
  const isDateAvailable = (date: Date) => {
    if (!availability || availability.length === 0) return false
    const dayOfWeek = date.getDay()
    return availability.some((slot: AvailabilitySlot) => 
      slot.day_of_week === dayOfWeek && slot.active
    )
  }

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

  // Log button disabled state when on Step 4
  useEffect(() => {
    if (step === 4) {
      const isDisabled = isProcessingPayment || !selectedDate || !selectedTime
      console.log('🔘 Payment button state (Step 4):', {
        isDisabled,
        reasons: {
          isProcessingPayment,
          missingDate: !selectedDate,
          missingTime: !selectedTime
        },
        selectedDate,
        selectedTime
      })
    }
  }, [step, isProcessingPayment, selectedDate, selectedTime])

  // Log form validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.error('❌ Form validation errors:', errors)
      console.error('Validation error details:', JSON.stringify(errors, null, 2))
    }
  }, [errors])

  // Wrap handleSubmit to log validation success/failure
  const handleFormSubmit = handleSubmit(
    (data) => {
      console.log('✅ Form validation passed, calling onSubmit')
      onSubmit(data)
    },
    (errors) => {
      console.error('❌ Form validation failed:', errors)
      console.error('Validation error details:', JSON.stringify(errors, null, 2))
      
      // Get all form values to debug
      const formValues = {
        doctor_id: watch('doctor_id'),
        scheduled_at: watch('scheduled_at'),
        symptoms_description: watch('symptoms_description'),
        amount: watch('amount')
      }
      console.error('Current form values:', formValues)
      console.error('Expected values:', {
        symptoms_description: 'should be string with min 5 chars',
        doctor_id: `should be UUID, currently: ${formValues.doctor_id || 'NOT SET'}`,
        scheduled_at: `should be string, currently: ${formValues.scheduled_at || 'NOT SET'}`,
        selectedDoctor: selectedDoctor?.id,
        selectedDate,
        selectedTime
      })
    }
  )

  // Step 1: Enter Details
  const handleStep1Next = () => {
    // Reset errors
    setGenderError('')
    setAgeError('')
    
    if (!symptomsDescription || symptomsDescription.length < 5) {
      return
    }
    
    // Validate gender
    if (!gender) {
      setGenderError('Gender is required')
      return
    }
    
    // Validate age
    if (!age || age.trim() === '') {
      setAgeError('Age is required')
      return
    }
    
    const ageNum = parseInt(age, 10)
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      setAgeError('Please enter a valid age (0-150)')
      return
    }
    
    setStep(2)
  }

  // Step 2: Select Doctor
  const handleDoctorSelect = (doctorId: string) => {
    console.log('👨‍⚕️ Doctor selected:', doctorId)
    // Fetch doctor details
    supabase
      .from('profiles')
      .select('id, full_name, specialty, consultation_fee')
      .eq('id', doctorId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Error fetching doctor details:', error)
          return
        }
        if (data && !error) {
          console.log('✅ Doctor details loaded:', {
            id: data.id,
            name: data.full_name,
            specialty: data.specialty
          })
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
          console.log('📍 Moved to step 3. Availability query should trigger for doctor:', data.id)
        }
      })
  }

  // Step 3: Date/Time Selection - Move to Step 4
  const handleStep3Next = () => {
    if (!selectedDate || !selectedTime || availableTimeSlots.length === 0 || availabilityError) {
      return
    }
    setStep(4)
  }

  // Step 4: Review & Payment
  const onSubmit = async (data: AppointmentFormData) => {
    console.log('📝 Form submitted - onSubmit called')
    console.log('Form data:', data)
    console.log('State values:', {
      selectedDoctor: selectedDoctor?.id,
      selectedDate,
      selectedTime,
      consultationPrice,
      consultationDuration
    })

    if (!selectedDoctor || !selectedDate || !selectedTime) {
      console.error('❌ Early return: Missing required fields', {
        hasDoctor: !!selectedDoctor,
        hasDate: !!selectedDate,
        hasTime: !!selectedTime
      })
      return
    }

    // Validate availability
    if (availability && availability.length > 0) {
      const scheduledDate = new Date(`${selectedDate}T${selectedTime}`)
      if (!isTimeAvailable(scheduledDate, selectedTime, availability)) {
        console.error('❌ Early return: Selected time is not available')
        setAvailabilityError('Selected time is not available. Please choose another time.')
        return
      }
    }

    // Check for conflicts with existing appointments
    if (existingAppointments && existingAppointments.length > 0) {
      const scheduledDate = new Date(`${selectedDate}T${selectedTime}`)
      const scheduledEnd = new Date(scheduledDate.getTime() + consultationDuration * 60000)
      
      const hasConflict = existingAppointments.some(apt => {
        const aptDate = new Date(apt.scheduled_at)
        const aptEnd = new Date(aptDate.getTime() + (apt.duration_minutes || consultationDuration) * 60000)
        return scheduledDate < aptEnd && scheduledEnd > aptDate
      })

      if (hasConflict) {
        console.error('❌ Early return: Time slot conflict detected')
        setAvailabilityError('This time slot is already booked. Please choose another time.')
        return
      }
    }

    setAvailabilityError(null)
    setIsProcessingPayment(true)
    console.log('✅ Validation passed, processing payment...')

    let appointmentId: string | null = null
    const isRetry = !!pendingAppointmentId

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('❌ Early return: No authenticated user')
        router.push('/auth/signin')
        return
      }

      const scheduledAt = new Date(`${selectedDate}T${selectedTime}`).toISOString()
      const appointmentAmount = consultationPrice

      if (pendingAppointmentId) {
        appointmentId = pendingAppointmentId
        console.log('💳 Retrying payment for existing appointment:', appointmentId)
      } else {
        const appointment = await createAppointment.mutateAsync({
          patient_id: user.id,
          doctor_id: data.doctor_id,
          chief_complaint: data.symptoms_description,
          symptoms_description: data.symptoms_description,
          scheduled_at: scheduledAt,
          duration_minutes: consultationDuration,
          amount: appointmentAmount,
          currency: 'NGN',
          status: 'scheduled',
          payment_status: 'pending',
        })
        appointmentId = appointment.id
        console.log('📅 Created appointment:', appointmentId)
      }

      const paymentResponse = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: appointmentAmount,
          appointmentId,
        }),
      })

      const paymentData = await paymentResponse.json().catch(() => ({}))
      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || `Payment failed (${paymentResponse.status}). Please try again.`)
      }
      if (!paymentData.authorization_url) {
        throw new Error(paymentData.error || 'Payment could not be started. Please try again.')
      }

      setPendingAppointmentId(null)
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(storageKey)
      }
      window.location.href = paymentData.authorization_url
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to book appointment. Please try again.'
      addToast({
        variant: 'destructive',
        title: 'Payment could not be started',
        description: `${errorMessage} Click "Proceed to Payment" again to retry.`,
      })
      if (!isRetry && appointmentId) {
        setPendingAppointmentId(appointmentId)
      }
      setIsProcessingPayment(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Progress Steps */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 sm:pb-0">
        <Button
          variant={step >= 1 ? 'default' : 'outline'}
          size="sm"
          className={cn(
            step >= 1 ? 'bg-teal-600' : '',
            'min-h-[44px] sm:min-h-0 text-xs sm:text-sm whitespace-nowrap'
          )}
          disabled
        >
          Step 1: Enter Details
        </Button>
        <Button
          variant={step >= 2 ? 'default' : 'outline'}
          size="sm"
          className={cn(
            step >= 2 ? 'bg-teal-600' : '',
            'min-h-[44px] sm:min-h-0 text-xs sm:text-sm whitespace-nowrap'
          )}
          disabled
        >
          Step 2: Match with Doctor
        </Button>
        <Button
          variant={step >= 3 ? 'default' : 'outline'}
          size="sm"
          className={cn(
            step >= 3 ? 'bg-teal-600' : '',
            'min-h-[44px] sm:min-h-0 text-xs sm:text-sm whitespace-nowrap'
          )}
          disabled
        >
          Step 3: Date & Time
        </Button>
        <Button
          variant={step >= 4 ? 'default' : 'outline'}
          size="sm"
          className={cn(
            step >= 4 ? 'bg-teal-600' : '',
            'min-h-[44px] sm:min-h-0 text-xs sm:text-sm whitespace-nowrap'
          )}
          disabled
        >
          Step 4: Review & Pay
        </Button>
      </div>

      {/* Back Button */}
      {step > 1 && (
        <Button
          variant="ghost"
          onClick={() => setStep(step - 1)}
          className="mb-4 min-h-[44px] sm:min-h-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-4 md:space-y-6">
        {/* Step 1: Enter Details */}
        {step === 1 && (
          <div className="space-y-4 md:space-y-6">
            <div>
              <Label htmlFor="symptoms_description">Complaints / Symptoms *</Label>
              <Textarea
                id="symptoms_description"
                {...register('symptoms_description')}
                rows={4}
                placeholder="Describe your symptoms or concerns..."
                className="min-h-[100px]"
              />
              {errors.symptoms_description && (
                <p className="mt-1 text-sm text-red-600">{errors.symptoms_description.message}</p>
              )}
            </div>

            <div>
              <Label>Chronic Conditions (Optional)</Label>
              <div className="mt-2 space-y-2 border rounded-lg p-3 md:p-4">
                {['Hypertension', 'Diabetes', 'Arthritis', 'Peptic Ulcer', 'Asthma', 'Sickle Cell'].map((condition) => (
                  <div key={condition} className="flex items-center space-x-2 min-h-[44px] sm:min-h-0">
                    <Checkbox
                      id={`condition-${condition}`}
                      checked={chronicConditions.includes(condition)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setChronicConditions([...chronicConditions, condition])
                        } else {
                          setChronicConditions(chronicConditions.filter(c => c !== condition))
                        }
                      }}
                    />
                    <Label
                      htmlFor={`condition-${condition}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {condition}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={gender} onValueChange={(value) => {
                  setGender(value)
                  if (genderError) setGenderError('')
                }} disabled={isGenderLocked}>
                  <SelectTrigger id="gender" className="min-h-[44px] sm:min-h-0" disabled={isGenderLocked}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {genderError && (
                  <p className="mt-1 text-sm text-red-600">{genderError}</p>
                )}
              </div>

              <div>
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  max="150"
                  value={age}
                  onChange={(e) => {
                    setAge(e.target.value)
                    if (ageError) setAgeError('')
                  }}
                  placeholder="Enter age"
                  className="min-h-[44px] sm:min-h-0"
                  disabled={isAgeLocked}
                />
                {ageError && (
                  <p className="mt-1 text-sm text-red-600">{ageError}</p>
                )}
              </div>
            </div>

            <Button
              type="button"
              onClick={handleStep1Next}
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 min-h-[44px] sm:min-h-0"
              disabled={!symptomsDescription || symptomsDescription.length < 5 || !gender || !age}
            >
              Next
            </Button>
          </div>
        )}

        {/* Step 2: Match with Doctor */}
        {step === 2 && (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Select a Doctor</h3>
              <DoctorList onSelectDoctor={handleDoctorSelect} />
            </div>
          </div>
        )}

        {/* Step 3: Date & Time Selection */}
        {step === 3 && selectedDoctor && (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Select Date & Time</h3>
              <p className="text-sm text-gray-600 mb-4 md:mb-6">
                Choose a convenient date and time for your consultation with {selectedDoctor.name}
              </p>
              {isLoadingAvailability && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <p className="text-sm text-blue-800">Loading doctor availability...</p>
                </div>
              )}
              {!isLoadingAvailability && availability && availability.length > 0 && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-1">Doctor Availability:</p>
                  <p className="text-sm text-green-700">
                    {(() => {
                      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                      const availableDays = [...new Set(availability.map((slot: AvailabilitySlot) => slot.day_of_week))]
                        .sort()
                        .map(d => dayNames[d])
                      return availableDays.join(', ')
                    })()}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Please select a date that falls on one of these days to see available time slots.
                  </p>
                </div>
              )}
            </div>

            <div className="border rounded-lg p-4 md:p-6 bg-gray-50">
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                {/* Date Selection */}
                <div>
                  <Label htmlFor="appointment_date">Select Date *</Label>
                  <div className="mt-2 w-full">
                    <div className="w-full md:w-auto md:max-w-md">
                      <Calendar
                        selected={selectedDate ? new Date(selectedDate + 'T00:00:00') : undefined}
                        onSelect={(date) => {
                          if (!date) return
                          // Format date as YYYY-MM-DD in local timezone to avoid UTC conversion issues
                          const year = date.getFullYear()
                          const month = String(date.getMonth() + 1).padStart(2, '0')
                          const day = String(date.getDate()).padStart(2, '0')
                          const formatted = `${year}-${month}-${day}`
                          setSelectedDate(formatted)
                          setSelectedTime('')
                          setAvailabilityError(null)
                        }}
                        minDate={new Date()}
                        disabled={(date) => !isDateAvailable(date)}
                        className="border rounded-lg w-full"
                      />
                    </div>
                  </div>
                  {!selectedDate && (
                    <p className="mt-2 text-sm text-red-600">Please select a date</p>
                  )}
                  {selectedDate && availability && availability.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">
                        Doctor is available on:{' '}
                        {(() => {
                          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                          const availableDays = [...new Set(availability.map((slot: AvailabilitySlot) => slot.day_of_week))]
                            .sort()
                            .map(d => dayNames[d])
                          return availableDays.join(', ')
                        })()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Available time slots will appear to the right after selecting a date
                      </p>
                    </div>
                  )}
                </div>

                {/* Time Selection */}
                <div>
                  <Label htmlFor="appointment_time">Select Time *</Label>
                  {isLoadingAvailability ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading availability...</span>
                    </div>
                  ) : availabilityQueryError ? (
                    <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Error loading availability
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          {(availabilityQueryError && typeof availabilityQueryError === 'object' && 'message' in availabilityQueryError)
                            ? String((availabilityQueryError as { message: unknown }).message)
                            : 'Failed to load doctor availability. Please try again.'}
                        </p>
                      </div>
                    </div>
                  ) : selectedDate && availability && availability.length > 0 ? (
                    <div className="mt-2">
                      {availableTimeSlots.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {availableTimeSlots.map((time) => {
                            const [hours, minutes] = time.split(':').map(Number)
                            const hour12 = hours % 12 || 12
                            const ampm = hours >= 12 ? 'PM' : 'AM'
                            const displayTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
                            const isSelected = selectedTime === time
                            
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => {
                                  setSelectedTime(time)
                                  if (selectedDate) {
                                    const dateTime = `${selectedDate}T${time}`
                                    setValue('scheduled_at', dateTime)
                                  }
                                  setAvailabilityError(null)
                                }}
                                className={cn(
                                  'p-2 md:p-2 text-sm rounded-lg border transition-colors min-h-[44px] sm:min-h-0',
                                  isSelected
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : 'bg-white hover:bg-teal-50 border-gray-200'
                                )}
                              >
                                {displayTime}
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800">
                              No available time slots
                            </p>
                            <p className="text-sm text-yellow-700 mt-1">
                              This doctor has no available time slots for the selected date.
                            </p>
                            {availability && availability.length > 0 && (
                              <p className="text-sm text-yellow-700 mt-1">
                                Doctor is available on:{' '}
                                {(() => {
                                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                                  const availableDays = [...new Set(availability.map((slot: AvailabilitySlot) => slot.day_of_week))]
                                    .sort()
                                    .map(d => dayNames[d])
                                  return availableDays.join(', ')
                                })()}
                              </p>
                            )}
                            <p className="text-sm text-yellow-700 mt-1">
                              Please select a date that matches one of the available days.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : selectedDate && availabilityQueryError ? (
                    <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Error loading availability
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          {(availabilityQueryError && typeof availabilityQueryError === 'object' && 'message' in availabilityQueryError)
                            ? String((availabilityQueryError as { message: unknown }).message)
                            : 'Failed to load doctor availability. Please try again or contact support.'}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          Check browser console for details.
                        </p>
                      </div>
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
                        <p className="text-xs text-yellow-600 mt-1">
                          If the doctor recently set availability, try refreshing the page.
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
              </div>

              <Button
                type="button"
                onClick={handleStep3Next}
                className="w-full bg-teal-600 hover:bg-teal-700 mt-4 md:mt-6 min-h-[44px] sm:min-h-0"
                disabled={
                  !selectedDate ||
                  !selectedTime ||
                  availableTimeSlots.length === 0 ||
                  !!availabilityError
                }
              >
                Next
              </Button>
              {availabilityError && (
                <p className="text-sm text-red-600 text-center mt-2">{availabilityError}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review & Payment */}
        {step === 4 && selectedDoctor && (
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Review Your Appointment</h3>
              <OrderSummaryCard
                doctorName={selectedDoctor.name}
                specialty={selectedDoctor.specialty}
                date={selectedDate}
                time={selectedTime}
                consultationFee={consultationPrice}
                currency="NGN"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 min-h-[44px] sm:min-h-0"
              disabled={
                isProcessingPayment ||
                !selectedDate ||
                !selectedTime
              }
              onClick={(e) => {
                console.log('🔘 Payment button clicked')
                console.log('Button disabled state:', {
                  isProcessingPayment,
                  hasDate: !!selectedDate,
                  hasTime: !!selectedTime,
                  disabled: isProcessingPayment || !selectedDate || !selectedTime
                })
                console.log('Form state:', {
                  selectedDoctor: selectedDoctor?.id,
                  selectedDate,
                  selectedTime,
                  consultationPrice
                })
                
                // Get current form values before submission
                const currentFormValues = {
                  doctor_id: watch('doctor_id'),
                  scheduled_at: watch('scheduled_at'),
                  symptoms_description: watch('symptoms_description'),
                  amount: watch('amount')
                }
                console.log('📋 Current form values before submission:', currentFormValues)
                
                // Ensure doctor_id and scheduled_at are set
                if (!currentFormValues.doctor_id && selectedDoctor?.id) {
                  console.log('⚠️ Setting doctor_id in form:', selectedDoctor.id)
                  setValue('doctor_id', selectedDoctor.id)
                }
                if (!currentFormValues.scheduled_at && selectedDate && selectedTime) {
                  const dateTime = `${selectedDate}T${selectedTime}`
                  console.log('⚠️ Setting scheduled_at in form:', dateTime)
                  setValue('scheduled_at', dateTime)
                }
                if (!currentFormValues.amount) {
                  console.log('⚠️ Setting amount in form:', consultationPrice)
                  setValue('amount', consultationPrice)
                }
                
                // Don't prevent default - let form submit naturally
              }}
            >
              {isProcessingPayment ? 'Processing Payment...' : 'Proceed to Payment'}
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
