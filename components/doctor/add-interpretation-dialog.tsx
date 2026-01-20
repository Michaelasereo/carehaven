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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'

interface AddInterpretationDialogProps {
  investigationId: string
  currentInterpretation?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddInterpretationDialog({
  investigationId,
  currentInterpretation,
  open,
  onOpenChange,
  onSuccess,
}: AddInterpretationDialogProps) {
  const supabase = createClient()
  const { addToast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [interpretation, setInterpretation] = useState(currentInterpretation || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get investigation details to find patient
      const { data: investigation, error: invError } = await supabase
        .from('investigations')
        .select('patient_id, doctor_id, test_name')
        .eq('id', investigationId)
        .single()

      if (invError || !investigation) {
        throw new Error('Investigation not found')
      }

      // Verify the doctor owns this investigation
      if (investigation.doctor_id !== user.id) {
        throw new Error('Unauthorized: You can only add interpretations to your own investigations')
      }

      // Update investigation with interpretation
      const { error: updateError } = await supabase
        .from('investigations')
        .update({
          interpretation: interpretation.trim() || null,
        })
        .eq('id', investigationId)

      if (updateError) throw updateError

      // Create notification for patient
      try {
        const { data: doctor } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        await fetch('/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: investigation.patient_id,
            type: 'investigation',
            title: 'Investigation Interpretation Added',
            body: `${doctor?.full_name || 'Dr. Unknown'} has added an interpretation to your ${investigation.test_name} results`,
            data: { investigation_id: investigationId },
          }),
        })
      } catch (notifError) {
        console.error('Error creating notification:', notifError)
        // Don't fail if notification fails
      }

      addToast({
        variant: 'default',
        title: 'Success',
        description: 'Interpretation saved successfully',
      })

      onSuccess()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error adding interpretation:', error)
      addToast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save interpretation. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentInterpretation ? 'Edit Interpretation' : 'Add Interpretation'}
          </DialogTitle>
          <DialogDescription>
            Provide your interpretation of the investigation results. This will be visible to the patient.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="interpretation">Interpretation</Label>
            <Textarea
              id="interpretation"
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              placeholder="Enter your interpretation of the investigation results..."
              rows={6}
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : currentInterpretation ? 'Update Interpretation' : 'Add Interpretation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
