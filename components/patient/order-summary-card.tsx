'use client'

import { Calendar, Clock, User, CreditCard } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

interface OrderSummaryCardProps {
  doctorName: string
  specialty?: string | null
  date?: string | null
  time?: string | null
  consultationFee: number
  currency?: string
  className?: string
}

export function OrderSummaryCard({
  doctorName,
  specialty,
  date,
  time,
  consultationFee,
  currency = 'NGN',
  className,
}: OrderSummaryCardProps) {
  const formatDateTime = () => {
    if (!date) return 'Not selected'
    if (time) {
      try {
        const dateTime = new Date(`${date}T${time}`)
        return format(dateTime, 'EEEE, MMMM d, yyyy') + ' at ' + format(dateTime, 'h:mm a')
      } catch {
        return `${date} at ${time}`
      }
    }
    return date
  }

  return (
    <Card className={`p-6 bg-gray-50 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
      
      <div className="space-y-4">
        {/* Doctor Info */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-teal-50 rounded-lg">
            <User className="h-5 w-5 text-teal-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{doctorName}</p>
            {specialty && (
              <p className="text-sm text-gray-600">{specialty}</p>
            )}
          </div>
        </div>

        {/* Date and Time */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-teal-50 rounded-lg">
            <Calendar className="h-5 w-5 text-teal-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">Appointment Date & Time</p>
            <p className="font-medium text-gray-900">{formatDateTime()}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Consultation Fee</span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(consultationFee, currency)}
            </span>
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-gray-300 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-teal-600">
              {formatCurrency(consultationFee, currency)}
            </span>
          </div>
        </div>

        {/* Payment method hint */}
        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
          <CreditCard className="h-4 w-4" />
          <span>Payment will be processed securely via Paystack</span>
        </div>
      </div>
    </Card>
  )
}
