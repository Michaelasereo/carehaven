import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { startOfDay, endOfDay, subDays } from 'date-fns'
import { resolve } from 'path'

// Load environment variables from .env.local first, then .env
const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')

// Try .env.local first, then .env
const result = dotenv.config({ path: envLocalPath })
if (result.error) {
  dotenv.config({ path: envPath })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error(`  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}`)
  console.error(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✓' : '✗'}`)
  console.error('\nPlease ensure these are set in .env.local or .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Replicate getTimeRange function from lib/doctor/analytics.ts
function getTimeRange(range: 'today' | '7d' | '30d' | '90d' | 'all') {
  const now = new Date()
  
  switch (range) {
    case '30d':
      return {
        start: startOfDay(subDays(now, 30)),
        end: endOfDay(now),
        label: 'Last 30 days',
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

async function checkDashboardMetrics() {
  console.log('\n=== Dashboard Metrics Diagnostic ===\n')

  // Get the first doctor to test with
  const { data: doctors, error: doctorError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'doctor')
    .limit(1)

  if (doctorError || !doctors || doctors.length === 0) {
    console.error('Error fetching doctor or no doctors found:', doctorError)
    return
  }

  const doctor = doctors[0]
  const doctorId = doctor.id

  console.log(`Testing with Doctor: ${doctor.full_name} (${doctor.email})`)
  console.log(`Doctor ID: ${doctorId}\n`)

  // Calculate date ranges
  const timeRange = getTimeRange('30d')
  const now = new Date()
  
  // Client-side date range calculation (from MetricsCard)
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)
  const startOf30DaysAgo = new Date(now)
  startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30)
  startOf30DaysAgo.setHours(0, 0, 0, 0)

  console.log('=== Date Range Comparison ===\n')
  console.log('Server-side (getTimeRange):')
  console.log(`  Start: ${timeRange.start.toISOString()}`)
  console.log(`  End: ${timeRange.end.toISOString()}`)
  console.log('\nClient-side (MetricsCard dynamic):')
  console.log(`  Start: ${startOf30DaysAgo.toISOString()}`)
  console.log(`  End: ${endOfToday.toISOString()}`)
  console.log(`\nDate ranges match: ${timeRange.start.getTime() === startOf30DaysAgo.getTime() && timeRange.end.getTime() === endOfToday.getTime()}`)

  // Query 1: Total Consultations (Server-side query)
  console.log('\n=== Total Consultations Query ===\n')
  
  const { count: serverConsultations, error: serverConsultationsError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorId)
    .eq('status', 'completed')
    .gte('scheduled_at', timeRange.start.toISOString())
    .lte('scheduled_at', timeRange.end.toISOString())

  if (serverConsultationsError) {
    console.error('Server-side query error:', serverConsultationsError)
  } else {
    console.log(`Server-side result: ${serverConsultations || 0} consultations`)
  }

  // Query 2: Total Consultations (Client-side query simulation)
  const { count: clientConsultations, error: clientConsultationsError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorId)
    .eq('status', 'completed')
    .gte('scheduled_at', startOf30DaysAgo.toISOString())
    .lte('scheduled_at', endOfToday.toISOString())

  if (clientConsultationsError) {
    console.error('Client-side query error:', clientConsultationsError)
  } else {
    console.log(`Client-side result: ${clientConsultations || 0} consultations`)
  }

  // Query 3: All-time consultations (for comparison)
  const { count: allTimeConsultations, error: allTimeError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorId)
    .eq('status', 'completed')

  if (allTimeError) {
    console.error('All-time query error:', allTimeError)
  } else {
    console.log(`All-time result: ${allTimeConsultations || 0} consultations`)
  }

  // Query 4: Total Revenue (Server-side query)
  console.log('\n=== Total Revenue Query ===\n')
  
  const { data: serverPaidAppointments, error: serverRevenueError } = await supabase
    .from('appointments')
    .select('amount')
    .eq('doctor_id', doctorId)
    .eq('payment_status', 'paid')
    .gte('scheduled_at', timeRange.start.toISOString())
    .lte('scheduled_at', timeRange.end.toISOString())

  if (serverRevenueError) {
    console.error('Server-side revenue query error:', serverRevenueError)
  } else {
    const serverRevenue = serverPaidAppointments?.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0
    console.log(`Server-side result: ${serverPaidAppointments?.length || 0} paid appointments`)
    console.log(`Server-side revenue (raw): ${serverRevenue}`)
    console.log(`Server-side revenue (formatted): ₦${Math.round(serverRevenue / 100).toLocaleString()}`)
  }

  // Query 5: Total Revenue (Client-side query simulation)
  const { data: clientPaidAppointments, error: clientRevenueError } = await supabase
    .from('appointments')
    .select('amount')
    .eq('doctor_id', doctorId)
    .eq('payment_status', 'paid')
    .gte('scheduled_at', startOf30DaysAgo.toISOString())
    .lte('scheduled_at', endOfToday.toISOString())

  if (clientRevenueError) {
    console.error('Client-side revenue query error:', clientRevenueError)
  } else {
    const clientRevenue = clientPaidAppointments?.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0
    console.log(`Client-side result: ${clientPaidAppointments?.length || 0} paid appointments`)
    console.log(`Client-side revenue (raw): ${clientRevenue}`)
    console.log(`Client-side revenue (formatted): ₦${Math.round(clientRevenue / 100).toLocaleString()}`)
  }

  // Query 6: All-time revenue (for comparison)
  const { data: allTimePaidAppointments, error: allTimeRevenueError } = await supabase
    .from('appointments')
    .select('amount')
    .eq('doctor_id', doctorId)
    .eq('payment_status', 'paid')

  if (allTimeRevenueError) {
    console.error('All-time revenue query error:', allTimeRevenueError)
  } else {
    const allTimeRevenue = allTimePaidAppointments?.reduce((sum, apt) => sum + (Number(apt.amount) || 0), 0) || 0
    console.log(`All-time result: ${allTimePaidAppointments?.length || 0} paid appointments`)
    console.log(`All-time revenue (raw): ${allTimeRevenue}`)
    console.log(`All-time revenue (formatted): ₦${Math.round(allTimeRevenue / 100).toLocaleString()}`)
  }

  // Query 7: Sample appointments for inspection
  console.log('\n=== Sample Appointments (Last 5) ===\n')
  
  const { data: sampleAppointments, error: sampleError } = await supabase
    .from('appointments')
    .select('id, status, payment_status, amount, scheduled_at')
    .eq('doctor_id', doctorId)
    .order('scheduled_at', { ascending: false })
    .limit(5)

  if (sampleError) {
    console.error('Error fetching sample appointments:', sampleError)
  } else if (sampleAppointments) {
    sampleAppointments.forEach((apt: any, index: number) => {
      console.log(`Appointment ${index + 1}:`)
      console.log(`  ID: ${apt.id}`)
      console.log(`  Status: ${apt.status}`)
      console.log(`  Payment Status: ${apt.payment_status || 'null/undefined'}`)
      console.log(`  Amount: ${apt.amount || 'null/undefined'}`)
      console.log(`  Scheduled At: ${apt.scheduled_at}`)
      console.log(`  In last 30 days: ${new Date(apt.scheduled_at) >= timeRange.start ? 'YES' : 'NO'}`)
      console.log('')
    })
  }

  // Query 8: Status breakdown
  console.log('\n=== Appointment Status Breakdown ===\n')
  
  const { data: allAppointments, error: statusError } = await supabase
    .from('appointments')
    .select('status, payment_status, scheduled_at, amount')
    .eq('doctor_id', doctorId)

  if (statusError) {
    console.error('Error fetching status breakdown:', statusError)
  } else if (allAppointments) {
    const breakdown: Record<string, { total: number; inRange: number; paid: number; paidInRange: number; totalRevenue: number; revenueInRange: number }> = {}
    
    allAppointments.forEach((apt: any) => {
      const status = apt.status || 'unknown'
      const scheduledAt = new Date(apt.scheduled_at)
      const inRange = scheduledAt >= timeRange.start && scheduledAt <= timeRange.end
      const isPaid = apt.payment_status === 'paid'
      const amount = Number(apt.amount) || 0

      if (!breakdown[status]) {
        breakdown[status] = { total: 0, inRange: 0, paid: 0, paidInRange: 0, totalRevenue: 0, revenueInRange: 0 }
      }
      
      breakdown[status].total++
      if (inRange) breakdown[status].inRange++
      if (isPaid) {
        breakdown[status].paid++
        breakdown[status].totalRevenue += amount
        if (inRange) {
          breakdown[status].paidInRange++
          breakdown[status].revenueInRange += amount
        }
      }
    })
    
    console.log('Status Breakdown:')
    Object.entries(breakdown).forEach(([status, counts]) => {
      console.log(`  ${status}:`)
      console.log(`    Total: ${counts.total}`)
      console.log(`    In last 30 days: ${counts.inRange}`)
      console.log(`    Paid (all-time): ${counts.paid}`)
      console.log(`    Paid (in range): ${counts.paidInRange}`)
      console.log(`    Revenue (all-time): ₦${Math.round(counts.totalRevenue / 100).toLocaleString()}`)
      console.log(`    Revenue (in range): ₦${Math.round(counts.revenueInRange / 100).toLocaleString()}`)
      console.log('')
    })
  }

  console.log('\n=== Diagnostic Complete ===\n')
}

checkDashboardMetrics().catch(console.error)
