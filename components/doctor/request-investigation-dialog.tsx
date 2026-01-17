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

interface RequestInvestigationDialogProps {
  appointmentId: string
  onClose: () => void
  onSuccess: () => void
}

export function RequestInvestigationDialog({
  appointmentId,
  onClose,
  onSuccess,
}: RequestInvestigationDialogProps) {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [testName, setTestName] = useState('')
  const [testType, setTestType] = useState('')

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

      if (!testName.trim()) {
        alert('Please enter a test name')
        return
      }

      const { data: investigation, error } = await supabase
        .from('investigations')
        .insert({
          appointment_id: appointmentId,
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          test_name: testName,
          test_type: testType || null,
          status: 'requested',
        })
        .select()
        .single()

      if (error) throw error

      // Create notification for patient via API
      try {
        const { data: doctor } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', appointment.doctor_id)
          .single()

        if (investigation) {
          await fetch('/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: appointment.patient_id,
              type: 'investigation',
              title: 'Investigation Requested',
              body: `${doctor?.full_name || 'Dr. Unknown'} has requested a ${testName} test for you`,
              data: { investigation_id: investigation.id },
            }),
          })
        }
      } catch (notifError) {
        console.error('Error creating notification:', notifError)
        // Don't fail if notification fails
      }

      onSuccess()
    } catch (error) {
      console.error('Error requesting investigation:', error)
      alert('Failed to request investigation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Investigation</DialogTitle>
          <DialogDescription>
            Request a lab test or investigation for this patient.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="test_name">Test Name *</Label>
            <Input
              id="test_name"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g., Complete Blood Count, X-Ray Chest"
              required
            />
          </div>

          <div>
            <Label htmlFor="test_type">Test Type</Label>
            <Input
              id="test_type"
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              placeholder="e.g., Blood Test, Imaging, Urine Analysis"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
              {isLoading ? 'Requesting...' : 'Request Investigation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
