'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateAppointment } from '@/lib/react-query/mutations'
import { useRouter } from 'next/navigation'

const appointmentSchema = z.object({
  chief_complaint: z.string().min(5),
  symptoms_description: z.string().optional(),
  doctor_id: z.string().uuid(),
  scheduled_at: z.string(),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

export function BookAppointmentForm() {
  const router = useRouter()
  const createAppointment = useCreateAppointment()
  const [step, setStep] = useState(1)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  })

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      await createAppointment.mutateAsync({
        ...data,
        scheduled_at: new Date(data.scheduled_at).toISOString(),
      })
      router.push('/patient/appointments')
    } catch (error) {
      console.error('Error creating appointment:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label htmlFor="chief_complaint">Reason for Consultation</Label>
          <Input id="chief_complaint" {...register('chief_complaint')} />
          {errors.chief_complaint && (
            <p className="mt-1 text-sm text-red-600">{errors.chief_complaint.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="symptoms_description">Complaints</Label>
          <Textarea id="symptoms_description" {...register('symptoms_description')} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
          Book Appointment
        </Button>
      </div>
    </form>
  )
}

