'use client'

import { Stethoscope, Calendar, FileText } from 'lucide-react'
import { MetricCard } from './metric-card'

interface PatientMetricsGridProps {
  metrics: Array<{
    iconName: 'Stethoscope' | 'Calendar' | 'FileText'
    value: number
    label: string
    color: string
    bgColor: string
    realtimeTable?: 'appointments' | 'investigations'
    realtimeFilter?: Record<string, any>
  }>
}

const iconMap = {
  Stethoscope,
  Calendar,
  FileText,
}

export function PatientMetricsGrid({ metrics }: PatientMetricsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {metrics.map((metric, index) => {
        const Icon = iconMap[metric.iconName]
        return (
          <MetricCard
            key={index}
            icon={Icon}
            value={metric.value}
            label={metric.label}
            color={metric.color}
            bgColor={metric.bgColor}
            realtimeTable={metric.realtimeTable}
            realtimeFilter={metric.realtimeFilter}
          />
        )
      })}
    </div>
  )
}
