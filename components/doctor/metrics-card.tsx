'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { TrendIndicator } from '@/components/doctor/trend-indicator'

interface MetricsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  color: string
  bgColor: string
  trend?: {
    value: number
    period: string
  }
  realtimeTable?: 'appointments' | 'notifications'
  realtimeFilter?: Record<string, any>
}

export function MetricsCard({
  title,
  value: initialValue,
  icon: Icon,
  color,
  bgColor,
  trend,
  realtimeTable,
  realtimeFilter,
}: MetricsCardProps) {
  const [value, setValue] = useState(initialValue)
  const supabase = createClient()

  useEffect(() => {
    if (!realtimeTable) return

    let timeoutId: NodeJS.Timeout

    const channel = supabase
      .channel(`doctor-metrics-${title.toLowerCase().replace(/\s+/g, '-')}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: realtimeTable,
          filter: realtimeFilter ? Object.entries(realtimeFilter).map(([key, val]) => `${key}=eq.${val}`).join(',') : undefined,
        },
        () => {
          // Debounce updates (500ms)
          clearTimeout(timeoutId)
          timeoutId = setTimeout(async () => {
            if (realtimeTable === 'appointments') {
              const { count } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .match(realtimeFilter || {})
              if (count !== null) setValue(count)
            } else if (realtimeTable === 'notifications') {
              const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .match(realtimeFilter || {})
              if (count !== null) setValue(count)
            }
          }, 500)
        }
      )
      .subscribe()

    return () => {
      clearTimeout(timeoutId)
      supabase.removeChannel(channel)
    }
  }, [realtimeTable, realtimeFilter, title, supabase])

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-bold">{value}</p>
            {trend && <TrendIndicator value={trend.value} period={trend.period} />}
          </div>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </Card>
  )
}
