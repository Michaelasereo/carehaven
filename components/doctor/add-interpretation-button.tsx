'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { AddInterpretationDialog } from './add-interpretation-dialog'

interface AddInterpretationButtonProps {
  investigationId: string
  currentInterpretation?: string | null
  investigationStatus: string
}

export function AddInterpretationButton({
  investigationId,
  currentInterpretation,
  investigationStatus,
}: AddInterpretationButtonProps) {
  const [showDialog, setShowDialog] = useState(false)

  // Only show button if investigation has results (completed status or has results_text/results_url)
  const hasResults = investigationStatus === 'completed' || investigationStatus === 'in_progress'

  if (!hasResults) {
    return null
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        size="sm"
        className="mt-2"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        {currentInterpretation ? 'Edit Interpretation' : 'Add Interpretation'}
      </Button>
      {showDialog && (
        <AddInterpretationDialog
          investigationId={investigationId}
          currentInterpretation={currentInterpretation}
          open={showDialog}
          onOpenChange={setShowDialog}
          onSuccess={() => {
            setShowDialog(false)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}
