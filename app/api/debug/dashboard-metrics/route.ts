import { createClient } from '@/lib/supabase/server'
import { startOfDay, endOfDay, subDays } from 'date-fns'
import { NextResponse } from 'next/server'

// Replicate getTimeRange function
function getTimeRange(range: 'today' | '7d' | '30d' | '90d' | 'all') {
  const now = new Date()
  
  switch (range) {
    case '30d':
      return {
        start: startOfDay(subDays(now, 30)),
        end: endOfDay(now),
        label: 'Last 30 days',
      }
    default:
      return getTimeRange('30d')
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'doctor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const doctorId = user.id

    // Calculate date ranges
    const timeRange = getTimeRange('30d')
    const now = new Date()
    
    // Client-side date range calculation (from MetricsCard)
    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999)
    const startOf30DaysAgo = new Date(now)
    startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30)
    startOf30DaysAgo.setHours(0, 0, 0, 0)

    // Query 1: Total Consultations (Server-side)
    const { count: serverConsultations, error: serverConsultationsError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .eq('status', 'completed')
      .gte('scheduled_at', timeRange.start.toISOString())
      .lte('scheduled_at', timeRange.end.toISOString())

    // Query 2: Total Consultations (Client-side simulation)
    const { count: clientConsultations, error: clientConsultationsError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .eq('status', 'completed')
      .gte('scheduled_at', startOf30DaysAgo.toISOString())
      .lte('scheduled_at', endOfToday.toISOString())

    // Query 3: All-time consultations
    const { count: allTimeConsultations, error: allTimeError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .eq('status', 'completed')

    // Query 4: Total Revenue (Server-side)
    const { data: serverPaidAppointments, error: serverRevenueError } = await supabase
      .from('appointments')
      .select('amount')
      .eq('doctor_id', doctorId)
      .eq('payment_status', 'paid')
      .gte('scheduled_at', timeRange.start.toISOString())
      .lte('scheduled_at', timeRange.end.toISOString())

    const serverRevenue = serverPaidAppointments?.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0

    // Query 5: Total Revenue (Client-side simulation)
    const { data: clientPaidAppointments, error: clientRevenueError } = await supabase
      .from('appointments')
      .select('amount')
      .eq('doctor_id', doctorId)
      .eq('payment_status', 'paid')
      .gte('scheduled_at', startOf30DaysAgo.toISOString())
      .lte('scheduled_at', endOfToday.toISOString())

    const clientRevenue = clientPaidAppointments?.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0

    // Query 6: All-time revenue
    const { data: allTimePaidAppointments, error: allTimeRevenueError } = await supabase
      .from('appointments')
      .select('amount')
      .eq('doctor_id', doctorId)
      .eq('payment_status', 'paid')

    const allTimeRevenue = allTimePaidAppointments?.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0

    // Query 7: Sample appointments
    const { data: sampleAppointments, error: sampleError } = await supabase
      .from('appointments')
      .select('id, status, payment_status, amount, scheduled_at')
      .eq('doctor_id', doctorId)
      .order('scheduled_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      doctorId,
      dateRanges: {
        server: {
          start: timeRange.start.toISOString(),
          end: timeRange.end.toISOString(),
        },
        client: {
          start: startOf30DaysAgo.toISOString(),
          end: endOfToday.toISOString(),
        },
        match: timeRange.start.getTime() === startOf30DaysAgo.getTime() && timeRange.end.getTime() === endOfToday.getTime(),
      },
      consultations: {
        server: {
          count: serverConsultations || 0,
          error: serverConsultationsError?.message,
        },
        client: {
          count: clientConsultations || 0,
          error: clientConsultationsError?.message,
        },
        allTime: {
          count: allTimeConsultations || 0,
          error: allTimeError?.message,
        },
      },
      revenue: {
        server: {
          count: serverPaidAppointments?.length || 0,
          raw: serverRevenue,
          formatted: `₦${Math.round(serverRevenue / 100).toLocaleString()}`,
          error: serverRevenueError?.message,
        },
        client: {
          count: clientPaidAppointments?.length || 0,
          raw: clientRevenue,
          formatted: `₦${Math.round(clientRevenue / 100).toLocaleString()}`,
          error: clientRevenueError?.message,
        },
        allTime: {
          count: allTimePaidAppointments?.length || 0,
          raw: allTimeRevenue,
          formatted: `₦${Math.round(allTimeRevenue / 100).toLocaleString()}`,
          error: allTimeRevenueError?.message,
        },
      },
      sampleAppointments: sampleAppointments?.map((apt: any) => ({
        id: apt.id,
        status: apt.status,
        payment_status: apt.payment_status,
        amount: apt.amount,
        scheduled_at: apt.scheduled_at,
        in_range: new Date(apt.scheduled_at) >= timeRange.start && new Date(apt.scheduled_at) <= timeRange.end,
      })) || [],
      errors: {
        sample: sampleError?.message,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
