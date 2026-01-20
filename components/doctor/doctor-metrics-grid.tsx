'use client'

import { MetricsCard } from '@/components/doctor/metrics-card'
import { 
  Stethoscope, 
  Calendar, 
  DollarSign, 
  Users,
  LucideIcon
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  Stethoscope,
  Calendar,
  DollarSign,
  Users,
}

interface Stat {
  title: string
  value: number | string
  iconName: string
  color: string
  bgColor: string
  trend?: { value: number; period: string }
  realtimeTable?: 'appointments' | 'notifications'
  realtimeFilter?: Record<string, any>
  realtimeQueryType?: 'count' | 'sum' | 'unique'
  realtimeQueryConfig?: {
    sumField?: string
    uniqueField?: string
    dateRange?: { start: string; end: string }
    statusFilter?: string[]
    dateFilter?: { gte?: string; lte?: string }
  }
}

export function DoctorMetricsGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = iconMap[stat.iconName]
        if (!Icon) {
          console.warn(`Icon not found for: ${stat.iconName}`)
          return null
        }
        return (
          <MetricsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={Icon}
            color={stat.color}
            bgColor={stat.bgColor}
            trend={stat.trend}
            realtimeTable={stat.realtimeTable}
            realtimeFilter={stat.realtimeFilter}
            realtimeQueryType={stat.realtimeQueryType}
            realtimeQueryConfig={stat.realtimeQueryConfig}
          />
        )
      })}
    </div>
  )
}
