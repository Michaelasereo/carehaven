import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

interface AppointmentCardProps {
  appointment: any
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const startTime = new Date(appointment.scheduled_at)
  const endTime = new Date(startTime.getTime() + (appointment.duration_minutes || 30) * 60000)
  
  const doctorName = appointment.profiles?.full_name || 'Dr. Unknown'

  return (
    <Card className="p-4 border-l-4 border-l-teal-600">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Consultation with {doctorName}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Sign up in minutes to access our secure platform. Your personal information is protected with.........
          </p>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  )
}

