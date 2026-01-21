'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { TrendIndicator } from './trend-indicator'

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
  realtimeTable?: 'profiles' | 'appointments'
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

export function MetricsCard({
  title,
  value: initialValue,
  icon: Icon,
  color,
  bgColor,
  trend,
  realtimeTable,
  realtimeFilter,
  realtimeQueryType = 'count',
  realtimeQueryConfig,
}: MetricsCardProps) {
  const [value, setValue] = useState(initialValue)
  const supabase = createClient()

  // Sync value when initialValue changes from server
  // Always trust the server-rendered value - it's authoritative
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (!realtimeTable) return

    let timeoutId: NodeJS.Timeout
    let reconnectTimeoutId: NodeJS.Timeout
    let isSubscribed = false

    const setupSubscription = () => {
      const channel = supabase
        .channel(`metrics-${title.toLowerCase().replace(/\s+/g, '-')}`)
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
                if (realtimeTable === 'profiles') {
                  const { count, error } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .match(realtimeFilter || {})
                  if (error) {
                    console.error(`Error fetching ${realtimeTable} count:`, error)
                    return
                  }
                  if (count !== null) setValue(count)
                } else if (realtimeTable === 'appointments') {
                  // Build query based on query type
                  let query: any = supabase.from('appointments')
                  
                  if (realtimeQueryType === 'sum' && realtimeQueryConfig?.sumField) {
                    query = query.select(realtimeQueryConfig.sumField)
                  } else if (realtimeQueryType === 'unique' && realtimeQueryConfig?.uniqueField) {
                    query = query.select(realtimeQueryConfig.uniqueField)
                  } else {
                    query = query.select('*', { count: 'exact', head: true })
                  }
                  
                  // Apply filters
                  if (realtimeFilter) {
                    Object.entries(realtimeFilter).forEach(([key, val]) => {
                      query = query.eq(key, val)
                    })
                  }
                  
                  // Apply date range if provided
                  if (realtimeQueryConfig?.dateRange) {
                    query = query
                      .gte('scheduled_at', realtimeQueryConfig.dateRange.start)
                      .lte('scheduled_at', realtimeQueryConfig.dateRange.end)
                  }
                  
                  // Apply date filter (gte) if provided
                  if (realtimeQueryConfig?.dateFilter?.gte) {
                    query = query.gte('scheduled_at', realtimeQueryConfig.dateFilter.gte)
                  }
                  
                  // Apply date filter (lte) if provided
                  if (realtimeQueryConfig?.dateFilter?.lte) {
                    query = query.lte('scheduled_at', realtimeQueryConfig.dateFilter.lte)
                  }
                  
                  // Apply status filter if provided
                  if (realtimeQueryConfig?.statusFilter && realtimeQueryConfig.statusFilter.length > 0) {
                    query = query.in('status', realtimeQueryConfig.statusFilter)
                  }
                  
                  // Execute query based on type
                  if (realtimeQueryType === 'sum' && realtimeQueryConfig?.sumField) {
                    const { data, error } = await query
                    if (error) {
                      console.error(`Error in sum query for ${title}:`, error)
                      return
                    }
                    const sum = data?.reduce((acc: number, item: any) => {
                      const val = Number(item[realtimeQueryConfig.sumField!]) || 0
                      return acc + val
                    }, 0) || 0
                    setValue(`₦${Math.round(sum / 100).toLocaleString()}`)
                  } else if (realtimeQueryType === 'unique' && realtimeQueryConfig?.uniqueField) {
                    const { data, error } = await query
                    if (error) {
                      console.error(`Error in unique query for ${title}:`, error)
                      return
                    }
                    const uniqueValues = new Set(
                      data?.map((item: any) => item[realtimeQueryConfig.uniqueField!]).filter(Boolean)
                    )
                    setValue(uniqueValues.size)
                  } else {
                    const { count, error } = await query
                    if (error) {
                      console.error(`Error fetching ${realtimeTable} count:`, error)
                      return
                    }
                    if (count !== null) setValue(count)
                  }
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
  }, [realtimeTable, realtimeFilter, realtimeQueryType, realtimeQueryConfig, title, supabase])

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
