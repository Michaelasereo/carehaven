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
}

export function AppointmentFilters({ statuses }: AppointmentFiltersProps) {
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
    router.push(`/doctor/appointments?${newParams.toString()}`)
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

        <Input
          type="date"
          value={params.get('date_from') || ''}
          onChange={(e) => handleFilterChange('date_from', e.target.value)}
          className="w-[180px]"
          placeholder="From Date"
        />

        <Input
          type="date"
          value={params.get('date_to') || ''}
          onChange={(e) => handleFilterChange('date_to', e.target.value)}
          className="w-[180px]"
          placeholder="To Date"
        />

        <Button
          variant="outline"
          onClick={() => router.push('/doctor/appointments')}
        >
          Clear Filters
        </Button>
      </div>
    </Card>
  )
}
