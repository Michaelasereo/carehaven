import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'

interface SessionCardProps {
  appointment: any
}

export function SessionCard({ appointment }: SessionCardProps) {
  const scheduledAt = new Date(appointment.scheduled_at)
  const doctorName = appointment.profiles?.full_name || 'Dr. Unknown'

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Consultation with {doctorName}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {format(scheduledAt, 'MMMM do, yyyy')}
          </p>
          <div className="mt-2">
            <Badge className="bg-teal-100 text-teal-800">Initial Consultation</Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">{format(scheduledAt, 'h:mma')}</p>
          <Link href={`/patient/sessions/${appointment.id}`}>
            <Button className="mt-2 bg-teal-600 hover:bg-teal-700">
              View Session Notes
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}

