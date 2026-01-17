import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'

export async function GET(request: Request) {
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

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const metric = searchParams.get('metric') || 'all'

    const now = new Date()
    let startDate: Date
    let previousStartDate: Date

    switch (period) {
      case '7d':
        startDate = startOfDay(subDays(now, 7))
        previousStartDate = startOfDay(subDays(now, 14))
        break
      case '30d':
        startDate = startOfDay(subDays(now, 30))
        previousStartDate = startOfDay(subDays(now, 60))
        break
      case '90d':
        startDate = startOfDay(subDays(now, 90))
        previousStartDate = startOfDay(subDays(now, 180))
        break
      default:
        startDate = startOfDay(subDays(now, 30))
        previousStartDate = startOfDay(subDays(now, 60))
    }

    const endDate = endOfDay(now)
    const previousEndDate = endOfDay(subDays(startDate, 1))

    const results: any = {}

    // User Metrics
    if (metric === 'all' || metric === 'users') {
      const [
        { count: totalUsers },
        { count: currentUsers },
        { count: previousUsers },
        { count: newUsers },
        { count: activeUsers7d },
        { count: activeUsers30d },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', previousStartDate.toISOString())
          .lte('created_at', previousEndDate.toISOString()),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', subDays(now, 7).toISOString()),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', subDays(now, 30).toISOString()),
      ])

      const userGrowthRate =
        previousUsers && previousUsers > 0
          ? ((currentUsers || 0) - previousUsers) / previousUsers * 100
          : currentUsers && currentUsers > 0 ? 100 : 0

      results.users = {
        total: totalUsers || 0,
        current: currentUsers || 0,
        previous: previousUsers || 0,
        new: newUsers || 0,
        growthRate: Math.round(userGrowthRate),
        active7d: activeUsers7d || 0,
        active30d: activeUsers30d || 0,
      }
    }

    // Financial Metrics
    if (metric === 'all' || metric === 'revenue') {
      const { data: currentAppointments } = await supabase
        .from('appointments')
        .select('amount, scheduled_at')
        .eq('payment_status', 'paid')
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())

      const { data: previousAppointments } = await supabase
        .from('appointments')
        .select('amount')
        .eq('payment_status', 'paid')
        .gte('scheduled_at', previousStartDate.toISOString())
        .lte('scheduled_at', previousEndDate.toISOString())

      const currentRevenue = currentAppointments?.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0
      const previousRevenue = previousAppointments?.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0

      const revenueGrowthRate =
        previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : currentRevenue > 0 ? 100 : 0

      // Revenue by day
      const revenueByDay = new Map<string, number>()
      currentAppointments?.forEach((apt) => {
        const date = format(new Date(apt.scheduled_at || new Date()), 'yyyy-MM-dd')
        const current = revenueByDay.get(date) || 0
        revenueByDay.set(date, current + (Number(apt.amount) || 0))
      })

      results.revenue = {
        current: currentRevenue,
        previous: previousRevenue,
        growthRate: Math.round(revenueGrowthRate),
        byDay: Array.from(revenueByDay.entries()).map(([date, revenue]) => ({ date, revenue })),
      }
    }

    // Operational Metrics
    if (metric === 'all' || metric === 'appointments') {
      const [
        { count: totalAppointments },
        { count: currentAppointments },
        { count: previousAppointments },
        { count: completedAppointments },
        { count: cancelledAppointments },
      ] = await Promise.all([
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', previousStartDate.toISOString())
          .lte('created_at', previousEndDate.toISOString()),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'cancelled')
          .gte('created_at', startDate.toISOString()),
      ])

      const appointmentGrowthRate =
        previousAppointments && previousAppointments > 0
          ? ((currentAppointments || 0) - previousAppointments) / previousAppointments * 100
          : currentAppointments && currentAppointments > 0 ? 100 : 0

      const completionRate =
        currentAppointments && currentAppointments > 0
          ? ((completedAppointments || 0) / currentAppointments) * 100
          : 0

      const cancellationRate =
        currentAppointments && currentAppointments > 0
          ? ((cancelledAppointments || 0) / currentAppointments) * 100
          : 0

      results.appointments = {
        total: totalAppointments || 0,
        current: currentAppointments || 0,
        previous: previousAppointments || 0,
        growthRate: Math.round(appointmentGrowthRate),
        completed: completedAppointments || 0,
        cancelled: cancelledAppointments || 0,
        completionRate: Math.round(completionRate),
        cancellationRate: Math.round(cancellationRate),
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
