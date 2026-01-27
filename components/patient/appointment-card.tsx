'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Calendar, Clock, RotateCcw, X } from 'lucide-react'
import { formatLagosTime } from '@/lib/utils/timezone'
import { RescheduleAppointmentDialog } from './reschedule-appointment-dialog'
import { JoinConsultationButton } from './join-consultation-button'
import { CancelAppointmentDialog } from './cancel-appointment-dialog'

interface AppointmentCardProps {
  appointment: any
  showActions?: boolean
}

export function AppointmentCard({ appointment, showActions = true }: AppointmentCardProps) {
  const [showReschedule, setShowReschedule] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const startTime = new Date(appointment.scheduled_at)
  const endTime = new Date(startTime.getTime() + (appointment.duration_minutes || 45) * 60000)
  
  const raw = appointment.profiles?.full_name?.trim()
  const doctorName = !raw
    ? 'Dr. Unknown'
    : raw.toLowerCase().startsWith('dr')
      ? raw
      : `Dr ${raw}`
  const canReschedule = ['scheduled', 'confirmed'].includes(appointment.status) && 
                        new Date(appointment.scheduled_at) > new Date()
  const canCancel = ['scheduled', 'confirmed'].includes(appointment.status) && 
                    new Date(appointment.scheduled_at) > new Date()
  const isUpcoming = new Date(appointment.scheduled_at) > new Date()
  const showJoin = ['scheduled', 'confirmed', 'in_progress'].includes(appointment.status) && isUpcoming
  
  // Payment status display
  const paymentStatusMap: Record<string, string> = {
    'paid': 'Paid',
    'waived': 'Waived',
    'pending': 'Pending',
    'failed': 'Failed',
    'refunded': 'Refunded',
  }
  const paymentLabel = paymentStatusMap[appointment.payment_status] || 'Unknown'
  const paymentBadgeVariant = 
    ['paid', 'waived'].includes(appointment.payment_status) ? 'default' :
    appointment.payment_status === 'pending' ? 'secondary' :
    'destructive'

  return (
    <>
      <Card className="p-3 md:p-4 border-l-4 border-l-teal-600">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate">Consultation with {doctorName}</h3>
              <Badge variant={appointment.status === 'confirmed' || appointment.status === 'in_progress' ? 'default' : 'secondary'} className="text-xs whitespace-nowrap">
                {appointment.status}
              </Badge>
              {['scheduled', 'confirmed', 'in_progress'].includes(appointment.status) && (
                <Badge variant={paymentBadgeVariant} className="text-xs whitespace-nowrap">
                  {paymentLabel}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600 mt-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span>{formatLagosTime(appointment.scheduled_at, 'date')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span>{formatLagosTime(appointment.scheduled_at, 'time')} – {formatLagosTime(endTime, 'time')}</span>
              </div>
            </div>
            {appointment.chief_complaint && (
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{appointment.chief_complaint}</p>
            )}
          </div>
          {showActions && (
            <div className="flex flex-col gap-2 ml-2 md:ml-4 flex-shrink-0">
              {showJoin && (
                <JoinConsultationButton appointmentId={appointment.id} />
              )}
              {canReschedule && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReschedule(true)}
                  className="text-xs min-h-[44px] md:min-h-0 px-3 md:px-4"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reschedule
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancel(true)}
                  className="text-xs text-red-600 hover:text-red-700 min-h-[44px] md:min-h-0 px-3 md:px-4"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              )}
              <Button variant="ghost" size="icon" className="rounded-full min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0">
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {showReschedule && (
        <RescheduleAppointmentDialog
          appointment={appointment}
          onClose={() => setShowReschedule(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {showCancel && (
        <CancelAppointmentDialog
          appointment={appointment}
          onClose={() => setShowCancel(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </>
  )
}

