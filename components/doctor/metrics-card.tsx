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

  // Fetch initial value and set up real-time subscription
  useEffect(() => {
    if (!realtimeTable) return

    // Ensure Supabase client is ready
    if (!supabase) {
      console.error(`[${title}] Supabase client not available`)
      return
    }

    // Helper function to build and execute query
    const executeQuery = async (useDynamicDateRange = false) => {
      if (realtimeTable !== 'appointments') return null

      // Start building query with the appropriate select based on query type
      // Supabase requires .select() to be called before filter methods
      let query;
      
      if (realtimeQueryType === 'sum' && realtimeQueryConfig?.sumField) {
        query = supabase.from('appointments').select(realtimeQueryConfig.sumField)
      } else if (realtimeQueryType === 'unique' && realtimeQueryConfig?.uniqueField) {
        query = supabase.from('appointments').select(realtimeQueryConfig.uniqueField)
      } else {
        query = supabase.from('appointments').select('*', { count: 'exact', head: true })
      }
      
      // Apply base filters from realtimeFilter
      if (realtimeFilter) {
        Object.entries(realtimeFilter).forEach(([key, val]) => {
          query = query.eq(key, val)
        })
      }
      
      // Apply date range if provided (recalculate dynamically if needed)
      if (realtimeQueryConfig?.dateRange) {
        if (useDynamicDateRange) {
          // Recalculate date range dynamically to match server-side calculation
          // Use startOfDay and endOfDay to match getTimeRange('30d') behavior
          const now = new Date()
          const endOfToday = new Date(now)
          endOfToday.setHours(23, 59, 59, 999)
          
          const startOf30DaysAgo = new Date(now)
          startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30)
          startOf30DaysAgo.setHours(0, 0, 0, 0)
          
          query = query
            .gte('scheduled_at', startOf30DaysAgo.toISOString())
            .lte('scheduled_at', endOfToday.toISOString())
        } else {
          query = query
            .gte('scheduled_at', realtimeQueryConfig.dateRange.start)
            .lte('scheduled_at', realtimeQueryConfig.dateRange.end)
        }
      }
      
      // Apply date filter (gte) if provided - always use current time for dynamic updates
      if (realtimeQueryConfig?.dateFilter?.gte) {
        const gteDate = useDynamicDateRange ? new Date().toISOString() : realtimeQueryConfig.dateFilter.gte
        query = query.gte('scheduled_at', gteDate)
      }
      
      // Apply date filter (lte) if provided
      if (realtimeQueryConfig?.dateFilter?.lte) {
        query = query.lte('scheduled_at', realtimeQueryConfig.dateFilter.lte)
      }
      
      // Apply status filter if provided
      if (realtimeQueryConfig?.statusFilter && realtimeQueryConfig.statusFilter.length > 0) {
        query = query.in('status', realtimeQueryConfig.statusFilter)
      }
      
      // Handle different query types - execute the query
      if (realtimeQueryType === 'sum' && realtimeQueryConfig?.sumField) {
        const { data, error } = await query
        if (error) {
          console.error(`Error in sum query for ${title}:`, error)
          throw error
        }
        const sum = data?.reduce((acc: number, item: any) => {
          const val = Number(item[realtimeQueryConfig.sumField!]) || 0
          return acc + val
        }, 0) || 0
        const formatted = `₦${Math.round(sum / 100).toLocaleString()}`
        if (process.env.NODE_ENV === 'development') {
          console.log(`[${title}] Sum query result:`, { sum, formatted, dataCount: data?.length })
        }
        return formatted
      } else if (realtimeQueryType === 'unique' && realtimeQueryConfig?.uniqueField) {
        const { data, error } = await query
        if (error) {
          console.error(`Error in unique query for ${title}:`, error)
          throw error
        }
        const uniqueValues = new Set(
          data?.map((item: any) => item[realtimeQueryConfig.uniqueField!]).filter(Boolean)
        )
        const count = uniqueValues.size
        if (process.env.NODE_ENV === 'development') {
          console.log(`[${title}] Unique query result:`, { count, dataCount: data?.length })
        }
        return count
      } else {
        const { count, error } = await query
        if (error) {
          console.error(`Error in count query for ${title}:`, error)
          throw error
        }
        if (process.env.NODE_ENV === 'development') {
          console.log(`[${title}] Count query result:`, count)
        }
        return count
      }
    }

    // Don't fetch initial value - trust the server-rendered value
    // Only update on real-time events

    let timeoutId: NodeJS.Timeout
    let reconnectTimeoutId: NodeJS.Timeout
    let isSubscribed = false

    const setupSubscription = () => {
      // Build filter string for postgres_changes - use doctor_id as primary filter
      // This ensures we catch all appointment changes for this doctor, including status transitions
      let filterString: string | undefined = undefined
      if (realtimeFilter && realtimeFilter.doctor_id) {
        // Always filter by doctor_id to catch all relevant changes
        filterString = `doctor_id=eq.${realtimeFilter.doctor_id}`
      } else if (realtimeFilter && Object.keys(realtimeFilter).length > 0) {
        // Fallback to first filter if no doctor_id
        const entries = Object.entries(realtimeFilter)
        const [key, val] = entries[0]
        filterString = `${key}=eq.${val}`
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
            // Check if this change is relevant to our metric
            // For appointments, we want to update if status changes affect our count
            if (realtimeTable === 'appointments' && realtimeFilter) {
              const newStatus = (payload.new as any)?.status
              const oldStatus = (payload.old as any)?.status
              
              // Check doctor_id matches
              if (realtimeFilter.doctor_id) {
                const doctorId = (payload.new as any)?.doctor_id || (payload.old as any)?.doctor_id
                if (doctorId !== realtimeFilter.doctor_id) return
              }
              
              // If we're tracking completed appointments, update when status becomes 'completed'
              // or when a completed appointment is modified
              if (realtimeFilter.status === 'completed') {
                const isRelevant = newStatus === 'completed' || oldStatus === 'completed'
                if (!isRelevant) return
              }
              
              // If we're tracking upcoming appointments with status filter, check if status change is relevant
              if (realtimeQueryConfig?.statusFilter && realtimeQueryConfig.statusFilter.length > 0) {
                const isRelevant = 
                  (newStatus && realtimeQueryConfig.statusFilter.includes(newStatus)) ||
                  (oldStatus && realtimeQueryConfig.statusFilter.includes(oldStatus))
                if (!isRelevant) return
              }
              
              // For sum queries (Revenue), check if payment_status changed
              if (realtimeQueryType === 'sum' && realtimeFilter.payment_status) {
                const newPaymentStatus = (payload.new as any)?.payment_status
                const oldPaymentStatus = (payload.old as any)?.payment_status
                const isRelevant = 
                  newPaymentStatus === realtimeFilter.payment_status ||
                  oldPaymentStatus === realtimeFilter.payment_status
                if (!isRelevant) return
              }
              
              // For unique queries (Total Patients), any appointment change is relevant
              // (no additional filtering needed)
            }

            // Debounce updates (500ms)
            clearTimeout(timeoutId)
            timeoutId = setTimeout(async () => {
              try {
                if (realtimeTable === 'appointments') {
                  // Use dynamic date range for real-time updates
                  const result = await executeQuery(true)
                  if (result !== null) {
                    setValue(result)
                  }
                } else if (realtimeTable === 'notifications') {
                  // Use explicit .eq() filters for notifications too
                  let query = supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                  
                  if (realtimeFilter) {
                    Object.entries(realtimeFilter).forEach(([key, val]) => {
                      query = query.eq(key, val)
                    })
                  }
                  
                  const { count, error } = await query
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
  }, [realtimeTable, realtimeFilter, realtimeQueryType, realtimeQueryConfig, title, supabase, initialValue])

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
