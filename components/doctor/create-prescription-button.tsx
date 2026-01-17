'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pill } from 'lucide-react'
import { CreatePrescriptionDialog } from './create-prescription-dialog'

interface CreatePrescriptionButtonProps {
  appointmentId: string
}

export function CreatePrescriptionButton({ appointmentId }: CreatePrescriptionButtonProps) {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="bg-teal-600 hover:bg-teal-700"
        size="sm"
      >
        <Pill className="h-4 w-4 mr-2" />
        Create Prescription
      </Button>
      {showDialog && (
        <CreatePrescriptionDialog
          appointmentId={appointmentId}
          onClose={() => setShowDialog(false)}
          onSuccess={() => {
            setShowDialog(false)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}
