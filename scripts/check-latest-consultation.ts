import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function checkLatestConsultation() {
  console.log('\n=== Checking Latest Consultation ===\n')

  // Get the latest appointment (any status) - prioritize completed, then in_progress, then others
  const { data: latestAppointment, error: appointmentError } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:profiles!appointments_patient_id_fkey(id, full_name, email, phone),
      doctor:profiles!appointments_doctor_id_fkey(id, full_name, email)
    `)
    .order('scheduled_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (appointmentError) {
    console.error('Error fetching latest appointment:', appointmentError)
    return
  }

  if (!latestAppointment) {
    console.log('No appointments found')
    return
  }

  console.log('Latest Appointment:')
  console.log(`  ID: ${latestAppointment.id}`)
  console.log(`  Patient ID: ${latestAppointment.patient_id}`)
  console.log(`  Patient Name: ${latestAppointment.patient?.full_name || 'N/A'}`)
  console.log(`  Patient Email: ${latestAppointment.patient?.email || 'N/A'}`)
  console.log(`  Doctor ID: ${latestAppointment.doctor_id}`)
  console.log(`  Doctor Name: ${latestAppointment.doctor?.full_name || 'N/A'}`)
  console.log(`  Status: ${latestAppointment.status}`)
  console.log(`  Payment Status: ${latestAppointment.payment_status || 'null/undefined'}`)
  console.log(`  Scheduled At: ${latestAppointment.scheduled_at}`)
  console.log(`  Created At: ${latestAppointment.created_at}`)
  console.log(`  Updated At: ${latestAppointment.updated_at}`)

  // Check if patient appears in clients list for this doctor
  console.log('\n=== Checking if Patient Appears in Clients List ===\n')
  
  const { data: allAppointments, error: allAppointmentsError } = await supabase
    .from('appointments')
    .select('patient_id')
    .eq('doctor_id', latestAppointment.doctor_id)

  if (allAppointmentsError) {
    console.error('Error fetching all appointments:', allAppointmentsError)
    return
  }

  const uniquePatientIds = new Set(
    (allAppointments || [])
      .map(apt => apt.patient_id)
      .filter((id): id is string => !!id)
  )

  console.log(`Total unique patients for doctor: ${uniquePatientIds.size}`)
  console.log(`Patient IDs: ${Array.from(uniquePatientIds).join(', ')}`)
  console.log(`Latest appointment patient ID in list: ${uniquePatientIds.has(latestAppointment.patient_id) ? 'YES' : 'NO'}`)

  // Check patient profile
  const { data: patientProfile, error: patientError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', latestAppointment.patient_id)
    .single()

  if (patientError) {
    console.error('Error fetching patient profile:', patientError)
  } else {
    console.log('\n=== Patient Profile ===')
    console.log(`  ID: ${patientProfile.id}`)
    console.log(`  Name: ${patientProfile.full_name || 'N/A'}`)
    console.log(`  Email: ${patientProfile.email || 'N/A'}`)
    console.log(`  Role: ${patientProfile.role || 'N/A'}`)
  }

  // Check all appointments for this doctor with status breakdown
  console.log('\n=== Appointment Status Breakdown ===\n')
  const { data: allDoctorAppointments, error: statusError } = await supabase
    .from('appointments')
    .select('status, payment_status')
    .eq('doctor_id', latestAppointment.doctor_id)

  if (statusError) {
    console.error('Error fetching appointment breakdown:', statusError)
  } else if (allDoctorAppointments) {
    const breakdown: Record<string, { total: number; pending: number; paid: number; nullPayment: number }> = {}
    allDoctorAppointments.forEach((apt: any) => {
      const status = apt.status || 'unknown'
      if (!breakdown[status]) {
        breakdown[status] = { total: 0, pending: 0, paid: 0, nullPayment: 0 }
      }
      breakdown[status].total++
      if (apt.payment_status === 'pending') breakdown[status].pending++
      else if (apt.payment_status === 'paid') breakdown[status].paid++
      else breakdown[status].nullPayment++
    })
    
    console.log('Status Breakdown:')
    Object.entries(breakdown).forEach(([status, counts]) => {
      console.log(`  ${status}: ${counts.total} total (${counts.pending} pending, ${counts.paid} paid, ${counts.nullPayment} null/undefined)`)
    })
  }
}

checkLatestConsultation().catch(console.error)
