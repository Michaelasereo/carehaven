'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TestTube } from 'lucide-react'
import { RequestInvestigationDialog } from './request-investigation-dialog'

interface RequestInvestigationButtonProps {
  appointmentId: string
}

export function RequestInvestigationButton({ appointmentId }: RequestInvestigationButtonProps) {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="bg-teal-600 hover:bg-teal-700"
        size="sm"
      >
        <TestTube className="h-4 w-4 mr-2" />
        Request Investigation
      </Button>
      {showDialog && (
        <RequestInvestigationDialog
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
