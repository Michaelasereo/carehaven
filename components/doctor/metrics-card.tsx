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
    let reconnectTimeoutId: NodeJS.Timeout
    let isSubscribed = false

    const setupSubscription = () => {
      // Build filter string properly for postgres_changes
      let filterString: string | undefined = undefined
      if (realtimeFilter && Object.keys(realtimeFilter).length > 0) {
        // For multiple filters, use the first one (postgres_changes supports one filter at a time)
        // Or combine them if needed
        const entries = Object.entries(realtimeFilter)
        if (entries.length === 1) {
          const [key, val] = entries[0]
          filterString = `${key}=eq.${val}`
        } else {
          // Use the first filter as primary, postgres_changes typically supports one filter
          const [key, val] = entries[0]
          filterString = `${key}=eq.${val}`
          // Note: Multiple filters may need to be handled differently or in separate subscriptions
        }
      }

      const channel = supabase
        .channel(`doctor-metrics-${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: realtimeTable,
            filter: filterString,
          },
          (payload) => {
            // Only update if the change matches our filter (additional client-side check)
            if (realtimeFilter && Object.keys(realtimeFilter).length > 0) {
              const matches = Object.entries(realtimeFilter).every(([key, val]) => {
                const newValue = (payload.new as any)?.[key]
                return newValue === val || newValue === String(val)
              })
              if (!matches) return // Skip if doesn't match our filter
            }

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
                }
              } catch (error) {
                console.error(`Error updating ${realtimeTable} metric:`, error)
              }
            }, 500)
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            isSubscribed = true
            console.log(`✅ Realtime subscription active for ${realtimeTable}`)
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // Log but don't spam console - this might be due to realtime not being enabled
            if (process.env.NODE_ENV === 'development') {
              console.warn(`⚠️ Realtime subscription ${status} for ${realtimeTable}. This is non-critical - metrics will still update on page refresh.`)
              if (err) {
                console.warn('   Error details:', err)
              }
            }
            isSubscribed = false
            // Only attempt reconnection if it was previously subscribed (avoid infinite loops)
            // Wait longer before reconnection to avoid hammering the server
            reconnectTimeoutId = setTimeout(() => {
              if (!isSubscribed) {
                console.log(`🔄 Attempting to reconnect realtime subscription for ${realtimeTable}...`)
                setupSubscription()
              }
            }, 10000) // Wait 10 seconds before reconnection
          } else if (status === 'CLOSED') {
            isSubscribed = false
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
