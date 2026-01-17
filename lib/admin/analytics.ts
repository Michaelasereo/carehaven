import { createClient } from '@/lib/supabase/server'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'

export interface TimeRange {
  start: Date
  end: Date
  label: string
}

export function getTimeRange(range: 'today' | '7d' | '30d' | '90d' | 'all'): TimeRange {
  const now = new Date()
  
  switch (range) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        label: 'Today',
      }
    case '7d':
      return {
        start: startOfDay(subDays(now, 7)),
        end: endOfDay(now),
        label: 'Last 7 days',
      }
    case '30d':
      return {
        start: startOfDay(subDays(now, 30)),
        end: endOfDay(now),
        label: 'Last 30 days',
      }
    case '90d':
      return {
        start: startOfDay(subDays(now, 90)),
        end: endOfDay(now),
        label: 'Last 90 days',
      }
    case 'all':
      return {
        start: new Date(0),
        end: endOfDay(now),
        label: 'All time',
      }
    default:
      return getTimeRange('30d')
  }
}

export async function calculateTrend(
  currentCount: number,
  previousCount: number
): Promise<number> {
  if (previousCount === 0) return currentCount > 0 ? 100 : 0
  return Math.round(((currentCount - previousCount) / previousCount) * 100)
}

export async function getActiveUsers(days: number = 7): Promise<number> {
  const supabase = await createClient()
  const cutoffDate = subDays(new Date(), days).toISOString()
  
  // Note: This assumes we track last_login_at in profiles
  // For now, we'll use updated_at as a proxy
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('updated_at', cutoffDate)
  
  return count || 0
}

export async function calculateARPU(totalRevenue: number, totalUsers: number): Promise<number> {
  if (totalUsers === 0) return 0
  return totalRevenue / totalUsers
}

export async function getConversionRate(
  completed: number,
  started: number
): Promise<number> {
  if (started === 0) return 0
  return Math.round((completed / started) * 100)
}

export async function getRevenueByPeriod(
  startDate: Date,
  endDate: Date
): Promise<{ date: string; revenue: number }[]> {
  const supabase = await createClient()
  
  const { data: appointments } = await supabase
    .from('appointments')
    .select('amount, scheduled_at, payment_status')
    .eq('payment_status', 'paid')
    .gte('scheduled_at', startDate.toISOString())
    .lte('scheduled_at', endDate.toISOString())
  
  if (!appointments) return []
  
  const revenueMap = new Map<string, number>()
  
  appointments.forEach((apt) => {
    const date = format(new Date(apt.scheduled_at), 'yyyy-MM-dd')
    const current = revenueMap.get(date) || 0
    revenueMap.set(date, current + Number(apt.amount || 0))
  })
  
  return Array.from(revenueMap.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
