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

export async function getRevenueByPeriod(
  doctorId: string,
  startDate: Date,
  endDate: Date
): Promise<{ date: string; revenue: number }[]> {
  const supabase = await createClient()
  
  const { data: appointments } = await supabase
    .from('appointments')
    .select('amount, scheduled_at, payment_status')
    .eq('doctor_id', doctorId)
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

export async function getUniquePatients(doctorId: string): Promise<number> {
  const supabase = await createClient()
  
  const { data: appointments } = await supabase
    .from('appointments')
    .select('patient_id')
    .eq('doctor_id', doctorId)
  
  if (!appointments) return 0
  
  const uniquePatients = new Set(appointments.map(apt => apt.patient_id))
  return uniquePatients.size
}

export async function getRepeatVisitRate(doctorId: string): Promise<number> {
  const supabase = await createClient()
  
  const { data: appointments } = await supabase
    .from('appointments')
    .select('patient_id')
    .eq('doctor_id', doctorId)
  
  if (!appointments) return 0
  
  const patientVisitCounts = new Map<string, number>()
  appointments.forEach(apt => {
    const count = patientVisitCounts.get(apt.patient_id) || 0
    patientVisitCounts.set(apt.patient_id, count + 1)
  })
  
  const patientsWithMultipleVisits = Array.from(patientVisitCounts.values()).filter(count => count > 1).length
  const totalPatients = patientVisitCounts.size
  
  if (totalPatients === 0) return 0
  return Math.round((patientsWithMultipleVisits / totalPatients) * 100)
}

export async function getCompletionRate(doctorId: string, startDate: Date, endDate: Date): Promise<number> {
  const supabase = await createClient()
  
  const [
    { count: total },
    { count: completed },
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString()),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .eq('status', 'completed')
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString()),
  ])
  
  if (!total || total === 0) return 0
  return Math.round(((completed || 0) / total) * 100)
}

export async function getCancellationRate(doctorId: string, startDate: Date, endDate: Date): Promise<number> {
  const supabase = await createClient()
  
  const [
    { count: total },
    { count: cancelled },
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString()),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .eq('status', 'cancelled')
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString()),
  ])
  
  if (!total || total === 0) return 0
  return Math.round(((cancelled || 0) / total) * 100)
}
