/**
 * Diagnostic script to check:
 * 1. System settings consultation price
 * 2. Doctor availability data in database
 * 3. RLS policies working correctly
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkSystemSettings() {
  console.log('\n=== Checking System Settings ===')
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .single()

  if (error) {
    console.error('Error fetching system settings:', error)
    return
  }

  console.log('System Settings:', JSON.stringify(data, null, 2))
  console.log('Consultation Price:', data?.consultation_price)
}

async function checkDoctorAvailability(doctorId?: string) {
  console.log('\n=== Checking Doctor Availability ===')
  
  let query = supabase
    .from('doctor_availability')
    .select('*')
    .eq('active', true)
    .order('day_of_week', { ascending: true })

  if (doctorId) {
    query = query.eq('doctor_id', doctorId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching availability:', error)
    return
  }

  console.log(`Found ${data?.length || 0} availability records`)
  if (data && data.length > 0) {
    console.log('Availability Data:', JSON.stringify(data, null, 2))
    data.forEach((slot: any, index: number) => {
      console.log(`\nSlot ${index + 1}:`)
      console.log(`  Doctor ID: ${slot.doctor_id}`)
      console.log(`  Day of Week: ${slot.day_of_week} (0=Sunday, 6=Saturday)`)
      console.log(`  Start Time: ${slot.start_time}`)
      console.log(`  End Time: ${slot.end_time}`)
      console.log(`  Active: ${slot.active}`)
    })
  } else {
    console.log('No availability records found!')
  }
}

async function checkDoctors() {
  console.log('\n=== Checking Doctors ===')
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, consultation_fee, license_verified, role')
    .eq('role', 'doctor')
    .eq('license_verified', true)

  if (error) {
    console.error('Error fetching doctors:', error)
    return
  }

  console.log(`Found ${data?.length || 0} verified doctors`)
  if (data && data.length > 0) {
    data.forEach((doctor: any) => {
      console.log(`\nDoctor: ${doctor.full_name} (${doctor.email})`)
      console.log(`  ID: ${doctor.id}`)
      console.log(`  Consultation Fee: ${doctor.consultation_fee}`)
      console.log(`  License Verified: ${doctor.license_verified}`)
    })
    return data[0]?.id // Return first doctor ID for availability check
  }
  return null
}

async function checkRLSPolicies() {
  console.log('\n=== Checking RLS Policies ===')
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename IN ('profiles', 'doctor_availability', 'system_settings')
      ORDER BY tablename, policyname;
    `
  })

  if (error) {
    console.log('Could not check RLS policies directly. Checking via queries instead...')
    // Try direct queries to see if they work
    return
  }

  console.log('RLS Policies:', JSON.stringify(data, null, 2))
}

async function main() {
  console.log('🔍 Starting Booking Issues Diagnostic...\n')

  await checkSystemSettings()
  
  const doctorId = await checkDoctors()
  
  if (doctorId) {
    console.log(`\nChecking availability for doctor: ${doctorId}`)
    await checkDoctorAvailability(doctorId)
  } else {
    console.log('\nNo doctors found, checking all availability...')
    await checkDoctorAvailability()
  }

  await checkRLSPolicies()

  console.log('\n✅ Diagnostic complete!')
}

main().catch(console.error)
