'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const soapSchema = z.object({
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  diagnosis: z.string().optional(),
})

type SOAPFormData = z.infer<typeof soapSchema>

interface SOAPFormProps {
  appointmentId: string
  doctorId: string
}

export function SOAPForm({ appointmentId, doctorId }: SOAPFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SOAPFormData>({
    resolver: zodResolver(soapSchema),
  })

  const onSubmit = async (data: SOAPFormData) => {
    try {
      const { error } = await supabase
        .from('consultation_notes')
        .upsert({
          appointment_id: appointmentId,
          doctor_id: doctorId,
          ...data,
        })

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Error saving SOAP notes:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label>Presenting Complaint</Label>
          <Textarea {...register('subjective')} rows={4} />
        </div>
        <div>
          <Label>History of Presenting Complaint</Label>
          <Textarea {...register('subjective')} rows={4} />
        </div>
        <div>
          <Label>Past Medical & Surgical History</Label>
          <Textarea {...register('subjective')} rows={4} />
        </div>
        <div>
          <Label>Family History</Label>
          <Textarea {...register('subjective')} rows={4} />
        </div>
        <div>
          <Label>Drug and Social History</Label>
          <Textarea {...register('subjective')} rows={4} />
        </div>
        <div>
          <Label>Any Vital Signs</Label>
          <Textarea {...register('objective')} rows={4} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label>Diagnosis</Label>
          <Textarea {...register('diagnosis')} rows={3} />
        </div>
        <div>
          <Label>Management Plan</Label>
          <Textarea {...register('plan')} rows={3} />
        </div>
        <div className="col-span-2">
          <Label>Drug Prescription</Label>
          <Textarea {...register('plan')} rows={3} />
        </div>
      </div>

      <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
        Save Changes
      </Button>
    </form>
  )
}

