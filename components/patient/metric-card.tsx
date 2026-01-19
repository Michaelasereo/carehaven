'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { TrendIndicator } from '@/components/doctor/trend-indicator'

interface MetricCardProps {
  icon: LucideIcon
  value: string | number
  label: string
  color?: string
  bgColor?: string
  trend?: {
    value: number
    period: string
  }
  realtimeTable?: 'appointments' | 'notifications' | 'investigations'
  realtimeFilter?: Record<string, any>
}

export function MetricCard({ 
  icon: Icon, 
  value: initialValue, 
  label,
  color = 'text-teal-600',
  bgColor = 'bg-teal-100',
  trend,
  realtimeTable,
  realtimeFilter,
}: MetricCardProps) {
  const [value, setValue] = useState(initialValue)
  const supabase = createClient()

  useEffect(() => {
    if (!realtimeTable) return

    let timeoutId: NodeJS.Timeout
    let reconnectTimeoutId: NodeJS.Timeout
    let isSubscribed = false

    const setupSubscription = () => {
      const channel = supabase
        .channel(`patient-metrics-${label.toLowerCase().replace(/\s+/g, '-')}`)
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
              try {
                if (realtimeTable === 'appointments') {
                  const { count, error } = await supabase
                    .from('appointments')
                    .select('*', { count: 'exact', head: true })
                    .match(realtimeFilter || {})
                  if (error) {
                    console.error(`Error fetching ${realtimeTable} count:`, error)
                    return
                  }
                  if (count !== null) setValue(count)
                } else if (realtimeTable === 'notifications') {
                  const { count, error } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .match(realtimeFilter || {})
                  if (error) {
                    console.error(`Error fetching ${realtimeTable} count:`, error)
                    return
                  }
                  if (count !== null) setValue(count)
                } else if (realtimeTable === 'investigations') {
                  const { count, error } = await supabase
                    .from('investigations')
                    .select('*', { count: 'exact', head: true })
                    .match(realtimeFilter || {})
                  if (error) {
                    console.error(`Error fetching ${realtimeTable} count:`, error)
                    return
                  }
                  if (count !== null) setValue(count)
                }
              } catch (error) {
                console.error(`Error updating ${realtimeTable} metric:`, error)
              }
            }, 500)
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isSubscribed = true
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`Realtime subscription error for ${realtimeTable}:`, status)
            isSubscribed = false
            // Attempt reconnection after 5 seconds
            reconnectTimeoutId = setTimeout(() => {
              if (!isSubscribed) {
                setupSubscription()
              }
            }, 5000)
          }
        })

      return channel
    }

    const channel = setupSubscription()

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(reconnectTimeoutId)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [realtimeTable, realtimeFilter, label, supabase])

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-3 md:gap-4">
        <div className={`p-2 md:p-3 rounded-lg ${bgColor} flex-shrink-0`}>
          <Icon className={`h-5 w-5 md:h-6 md:w-6 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
          <div className="text-2xl md:text-3xl font-bold text-gray-900">{value}</div>
            {trend && <TrendIndicator value={trend.value} period={trend.period} />}
          </div>
          <div className="text-xs md:text-sm text-gray-600">{label}</div>
        </div>
      </div>
    </Card>
  )
}

