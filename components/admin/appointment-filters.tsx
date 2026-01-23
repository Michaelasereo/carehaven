'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AppointmentFiltersProps {
  statuses: string[]
  doctors: Array<{ id: string; full_name: string | null }>
}

export function AppointmentFilters({ statuses, doctors }: AppointmentFiltersProps) {
  const router = useRouter()
  const params = useSearchParams()

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(params.toString())
    if (value && value !== 'all') {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    newParams.delete('page') // Reset to page 1
    router.replace(`/admin/appointments?${newParams.toString()}`)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <Select
          value={params.get('status') || 'all'}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.get('doctor') || 'all'}
          onValueChange={(value) => handleFilterChange('doctor', value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Doctors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Doctors</SelectItem>
            {doctors.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id}>
                {doctor.full_name || 'Unknown'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.get('payment_status') || 'all'}
          onValueChange={(value) => handleFilterChange('payment_status', value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">From Date</span>
            <Input
              type="date"
              value={params.get('date_from') || ''}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-[180px]"
              placeholder="From Date"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">To Date</span>
            <Input
              type="date"
              value={params.get('date_to') || ''}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-[180px]"
              placeholder="To Date"
            />
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push('/admin/appointments')}
        >
          Clear Filters
        </Button>
      </div>
    </Card>
  )
}
