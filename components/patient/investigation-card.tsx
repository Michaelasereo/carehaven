'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileSearch } from 'lucide-react'
import { UploadInvestigationDialog } from './upload-investigation-dialog'
import { ViewResultsLink } from '@/components/investigations/view-results-link'

interface InvestigationCardProps {
  investigation: any
  showUpload?: boolean
}

export function InvestigationCard({ investigation, showUpload }: InvestigationCardProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const doctorName = investigation.profiles?.full_name || 'Dr. Unknown'

  return (
    <>
      <Card className="p-4 bg-gray-50">
        <div className="flex items-start gap-3">
          <FileSearch className="h-6 w-6 text-gray-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{investigation.test_name}</h3>
            <p className="text-sm text-gray-600 mt-1">{doctorName}</p>
            {showUpload && investigation.status === 'requested' && (
              <Button 
                className="mt-2" 
                size="sm" 
                variant="outline"
                onClick={() => setUploadDialogOpen(true)}
              >
                Upload Results
              </Button>
            )}
            {investigation.results_url && (
              <div className="mt-2">
                <ViewResultsLink filePath={investigation.results_url} label="View Results" />
              </div>
            )}
          </div>
        </div>
      </Card>

      {showUpload && (
        <UploadInvestigationDialog
          investigationId={investigation.id}
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onSuccess={() => window.location.reload()}
        />
      )}
    </>
  )
}

