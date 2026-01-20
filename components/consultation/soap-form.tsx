'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/toast'

const soapSchema = z.object({
  presenting_complaint: z.string().optional(),
  history_presenting_complaint: z.string().optional(),
  past_medical_history: z.string().optional(),
  family_history: z.string().optional(),
  drug_social_history: z.string().optional(),
  vital_signs: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  diagnosis: z.string().optional(),
  drug_prescription: z.string().optional(),
})

type SOAPFormData = z.infer<typeof soapSchema>

interface SOAPFormProps {
  appointmentId: string
  doctorId: string
  patientId: string
}

export function SOAPForm({ appointmentId, doctorId, patientId }: SOAPFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<SOAPFormData>({
    resolver: zodResolver(soapSchema),
  })

  const drugPrescription = watch('drug_prescription')

  // Load existing consultation notes
  useEffect(() => {
    const loadExistingNotes = async () => {
      try {
        const { data: notes, error } = await supabase
          .from('consultation_notes')
          .select('*')
          .eq('appointment_id', appointmentId)
          .single()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found" which is fine for new notes
          console.error('Error loading consultation notes:', error)
        }

        if (notes) {
          // Parse subjective field to extract individual components
          const subjective = notes.subjective || ''
          const presentingComplaintMatch = subjective.match(/Presenting Complaint:\s*(.+?)(?:\n\n|$)/s)
          const historyMatch = subjective.match(/History of Presenting Complaint:\s*(.+?)(?:\n\n|$)/s)
          const pastMedicalMatch = subjective.match(/Past Medical & Surgical History:\s*(.+?)(?:\n\n|$)/s)
          const familyHistoryMatch = subjective.match(/Family History:\s*(.+?)(?:\n\n|$)/s)
          const drugSocialMatch = subjective.match(/Drug and Social History:\s*(.+?)(?:\n\n|$)/s)

          // Extract prescription text if available
          const prescriptionText = notes.prescription?.text || ''

          // Populate form with existing data
          reset({
            presenting_complaint: presentingComplaintMatch?.[1]?.trim() || '',
            history_presenting_complaint: historyMatch?.[1]?.trim() || '',
            past_medical_history: pastMedicalMatch?.[1]?.trim() || '',
            family_history: familyHistoryMatch?.[1]?.trim() || '',
            drug_social_history: drugSocialMatch?.[1]?.trim() || '',
            vital_signs: notes.objective || '',
            assessment: notes.assessment || '',
            plan: notes.plan || '',
            diagnosis: notes.diagnosis || '',
            drug_prescription: prescriptionText,
          })
        }
      } catch (error) {
        console.error('Error loading notes:', error)
      } finally {
        setIsLoadingNotes(false)
      }
    }

    loadExistingNotes()
  }, [appointmentId, supabase, reset])

  const onSubmit = async (data: SOAPFormData) => {
    setIsLoading(true)
    try {
      // Combine all subjective fields into one
      const subjectiveParts = [
        data.presenting_complaint && `Presenting Complaint: ${data.presenting_complaint}`,
        data.history_presenting_complaint && `History of Presenting Complaint: ${data.history_presenting_complaint}`,
        data.past_medical_history && `Past Medical & Surgical History: ${data.past_medical_history}`,
        data.family_history && `Family History: ${data.family_history}`,
        data.drug_social_history && `Drug and Social History: ${data.drug_social_history}`,
      ].filter(Boolean)

      const subjective = subjectiveParts.length > 0 ? subjectiveParts.join('\n\n') : null

      // Save consultation notes
      const { error: notesError } = await supabase
        .from('consultation_notes')
        .upsert({
          appointment_id: appointmentId,
          doctor_id: doctorId,
          subjective: subjective || undefined,
          objective: data.vital_signs || undefined,
          assessment: data.assessment || undefined,
          plan: data.plan || undefined,
          diagnosis: data.diagnosis || undefined,
          prescription: data.drug_prescription ? { text: data.drug_prescription } : null,
        })

      if (notesError) throw notesError

      // Create prescription if drug prescription is provided
      if (data.drug_prescription && data.drug_prescription.trim()) {
        // Parse medication information from text (simple format: medication name, dosage, instructions)
        // In a more sophisticated implementation, you might want a structured medication form
        const medications = data.drug_prescription
          .split('\n')
          .filter(line => line.trim())
          .map(line => ({
            name: line.split(',')[0]?.trim() || line.trim(),
            dosage: line.split(',')[1]?.trim() || '',
            instructions: line.split(',')[2]?.trim() || '',
          }))

        const { error: prescriptionError } = await supabase
          .from('prescriptions')
          .insert({
            appointment_id: appointmentId,
            patient_id: patientId,
            doctor_id: doctorId,
            medications: medications,
            instructions: data.drug_prescription,
            status: 'active',
          })

        if (prescriptionError) {
          console.error('Error creating prescription:', prescriptionError)
          // Don't fail the whole submission if prescription creation fails
        }
      }

      router.refresh()
    } catch (error) {
      console.error('Error saving SOAP notes:', error)
      addToast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Failed to save consultation notes. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingNotes) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-600">Loading consultation notes...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label>Presenting Complaint</Label>
          <Textarea {...register('presenting_complaint')} rows={4} placeholder="Describe the patient's presenting complaint..." />
        </div>
        <div>
          <Label>History of Presenting Complaint</Label>
          <Textarea {...register('history_presenting_complaint')} rows={4} placeholder="History of the presenting complaint..." />
        </div>
        <div>
          <Label>Past Medical & Surgical History</Label>
          <Textarea {...register('past_medical_history')} rows={4} placeholder="Relevant medical and surgical history..." />
        </div>
        <div>
          <Label>Family History</Label>
          <Textarea {...register('family_history')} rows={4} placeholder="Relevant family medical history..." />
        </div>
        <div>
          <Label>Drug and Social History</Label>
          <Textarea {...register('drug_social_history')} rows={4} placeholder="Current medications and social history..." />
        </div>
        <div>
          <Label>Vital Signs / Physical Examination</Label>
          <Textarea {...register('vital_signs')} rows={4} placeholder="Record vital signs and physical examination findings..." />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label>Diagnosis</Label>
          <Textarea {...register('diagnosis')} rows={3} placeholder="Enter diagnosis..." />
        </div>
        <div>
          <Label>Management Plan</Label>
          <Textarea {...register('plan')} rows={3} placeholder="Enter management plan..." />
        </div>
        <div className="col-span-2">
          <Label>Drug Prescription</Label>
          <Textarea 
            {...register('drug_prescription')} 
            rows={4} 
            placeholder="Enter medications, dosage, and instructions (one per line or comma-separated)..." 
          />
          <p className="mt-1 text-xs text-gray-500">
            Format: Medication name, Dosage, Instructions (one per line)
          </p>
        </div>
      </div>

      <Button 
        type="submit" 
        className="bg-teal-600 hover:bg-teal-700"
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}

