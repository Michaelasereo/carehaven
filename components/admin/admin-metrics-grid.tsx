'use client'

import { Users, Calendar, DollarSign, Stethoscope, UserCheck } from 'lucide-react'
import { MetricsCard } from './metrics-card'

interface AdminMetricsGridProps {
  stats: Array<{
    title: string
    value: number | string
    iconName: 'Users' | 'Calendar' | 'DollarSign' | 'Stethoscope' | 'UserCheck'
    color: string
    bgColor: string
    trend?: {
      value: number
      period: string
    }
    realtimeTable?: 'profiles' | 'appointments'
    realtimeFilter?: Record<string, any>
  }>
}

const iconMap = {
  Users,
  Calendar,
  DollarSign,
  Stethoscope,
  UserCheck,
}

export function AdminMetricsGrid({ stats }: AdminMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => {
        const Icon = iconMap[stat.iconName]
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
          />
        )
      })}
    </div>
  )
}
