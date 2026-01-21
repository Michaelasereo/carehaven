'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

interface CreatePrescriptionDialogProps {
  appointmentId: string
  onClose: () => void
  onSuccess: () => void
}

export function CreatePrescriptionDialog({
  appointmentId,
  onClose,
  onSuccess,
}: CreatePrescriptionDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '', duration: '' }])
  const [instructions, setInstructions] = useState('')
  const [durationDays, setDurationDays] = useState('')

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }])
  }

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index))
  }

  const updateMedication = (index: number, field: string, value: string) => {
    const updated = [...medications]
    updated[index] = { ...updated[index], [field]: value }
    setMedications(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get appointment details
      const { data: appointment } = await supabase
        .from('appointments')
        .select('patient_id, doctor_id')
        .eq('id', appointmentId)
        .single()

      if (!appointment) throw new Error('Appointment not found')

      // Filter out empty medications
      const validMedications = medications.filter(m => m.name.trim() !== '')

      if (validMedications.length === 0) {
        addToast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Please add at least one medication',
        })
        return
      }

      const { data: prescription, error } = await supabase
        .from('prescriptions')
        .insert({
          appointment_id: appointmentId,
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          medications: validMedications,
          instructions: instructions || null,
          duration_days: durationDays ? parseInt(durationDays) : null,
          // Refills are not supported in MVP; default to 0
          refills_remaining: 0,
          status: 'active',
        })
        .select()
        .single()

      if (error) throw error

      // Create notification for patient (triggers SMS + Email via createNotification)
      try {
        const { data: doctor } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', appointment.doctor_id)
          .single()

        if (prescription) {
          // Use API route which calls createNotification (handles SMS + Email)
          await fetch('/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: appointment.patient_id,
              type: 'prescription',
              title: 'New Prescription',
              body: `You have a new prescription from ${doctor?.full_name || 'Dr. Unknown'}`,
              data: { prescription_id: prescription.id },
            }),
          })
        }
      } catch (notifError) {
        console.error('Error creating notification:', notifError)
        // Don't fail if notification fails
      }

      onSuccess()
    } catch (error) {
      console.error('Error creating prescription:', error)
      addToast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: 'Failed to create prescription. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Prescription</DialogTitle>
          <DialogDescription>
            Add medications and instructions for this prescription.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <Label>Medications</Label>
            <div className="space-y-4 mt-2">
              {medications.map((med, index) => (
                <div key={index} className="border rounded-lg p-3 md:p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Medication {index + 1}</span>
                    {medications.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedication(index)}
                        className="min-h-[44px] sm:min-h-0"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`med-name-${index}`}>Name *</Label>
                      <Input
                        id={`med-name-${index}`}
                        value={med.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        placeholder="e.g., Paracetamol"
                        required
                        className="min-h-[44px] sm:min-h-0"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`med-dosage-${index}`}>Dosage</Label>
                      <Input
                        id={`med-dosage-${index}`}
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        placeholder="e.g., 500mg"
                        className="min-h-[44px] sm:min-h-0"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`med-frequency-${index}`}>Frequency</Label>
                      <Input
                        id={`med-frequency-${index}`}
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        placeholder="e.g., Twice daily"
                        className="min-h-[44px] sm:min-h-0"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`med-duration-${index}`}>Duration</Label>
                      <Input
                        id={`med-duration-${index}`}
                        value={med.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        placeholder="e.g., 7 days"
                        className="min-h-[44px] sm:min-h-0"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addMedication} className="min-h-[44px] sm:min-h-0 w-full sm:w-auto">
                + Add Medication
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="Additional instructions for the patient..."
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration_days">Duration (Days)</Label>
              <Input
                id="duration_days"
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="e.g., 7"
                className="min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto min-h-[44px] sm:min-h-0" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Prescription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
