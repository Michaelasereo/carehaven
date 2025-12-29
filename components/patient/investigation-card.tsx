import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileSearch } from 'lucide-react'

interface InvestigationCardProps {
  investigation: any
  showUpload?: boolean
}

export function InvestigationCard({ investigation, showUpload }: InvestigationCardProps) {
  const doctorName = investigation.profiles?.full_name || 'Dr. Unknown'

  return (
    <Card className="p-4 bg-gray-50">
      <div className="flex items-start gap-3">
        <FileSearch className="h-6 w-6 text-gray-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{investigation.test_name}</h3>
          <p className="text-sm text-gray-600 mt-1">{doctorName}</p>
          {showUpload && (
            <Button className="mt-2" size="sm" variant="outline">
              Upload
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

