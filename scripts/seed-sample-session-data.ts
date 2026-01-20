/**
 * Seed Sample Session Data (Consultation Notes, Prescriptions, Investigations)
 *
 * Purpose:
 * - Populate a completed appointment with realistic sample data so you can preview UI screens.
 *
 * Run:
 * - npx tsx scripts/seed-sample-session-data.ts
 *
 * Optional env:
 * - APPOINTMENT_ID=<uuid>   Seed a specific appointment
 *
 * Requires:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const appointmentIdFromEnv = process.env.APPOINTMENT_ID

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

function isoNowMinus(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

async function main() {
  console.log('\n🧪 Seeding sample session data...\n')

  // 1) Find target appointment
  let appointment: any | null = null

  if (appointmentIdFromEnv) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentIdFromEnv)
      .maybeSingle()

    if (error) throw error
    appointment = data
  } else {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    appointment = data
  }

  if (!appointment) {
    console.error('❌ No completed appointment found to seed.')
    console.error('   💡 Create/complete an appointment first, or pass APPOINTMENT_ID.')
    process.exit(1)
  }

  const appointmentId = appointment.id as string
  const patientId = appointment.patient_id as string
  const doctorId = appointment.doctor_id as string

  console.log('✅ Target appointment found:')
  console.log(`   appointmentId: ${appointmentId}`)
  console.log(`   patientId:     ${patientId}`)
  console.log(`   doctorId:      ${doctorId}\n`)

  // 2) Seed consultation notes (SOAP)
  // NOTE: `consultation_notes.appointment_id` is not UNIQUE in the DB schema,
  // so we cannot rely on ON CONFLICT upserts. Instead, we update if a row exists.
  const notePayload = {
    appointment_id: appointmentId,
    doctor_id: doctorId,
    subjective:
      'Presenting Complaint: Fever and sore throat for 3 days.\n\n' +
      'History of Presenting Complaint: Started with chills and malaise, worsening sore throat, no shortness of breath.\n\n' +
      'Past Medical & Surgical History: No known chronic illnesses.\n\n' +
      'Family History: Non-contributory.\n\n' +
      'Drug and Social History: No smoking, occasional alcohol. No known drug allergies.',
    objective:
      'Vitals: T 38.4°C, HR 102, BP 118/76, RR 18, SpO2 98%.\n' +
      'Exam: Erythematous pharynx with exudates. Tender anterior cervical lymphadenopathy.',
    assessment:
      'Likely acute bacterial pharyngitis. Differential includes viral pharyngitis and infectious mononucleosis.',
    plan:
      '1) Start antibiotics.\n2) Analgesia/antipyretics.\n3) Hydration and rest.\n4) Return if worsening or no improvement in 48–72 hours.',
    diagnosis: 'Acute pharyngitis (suspected bacterial)',
    prescription: {
      summary: 'Amoxicillin + Paracetamol',
      created_at: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  }

  const { data: existingNote, error: existingNoteError } = await supabase
    .from('consultation_notes')
    .select('id')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  if (existingNoteError) throw existingNoteError

  let noteId: string | null = null

  if (existingNote?.id) {
    const { data: updated, error: updateError } = await supabase
      .from('consultation_notes')
      .update(notePayload)
      .eq('id', existingNote.id)
      .select('id')
      .single()

    if (updateError) throw updateError
    noteId = updated?.id || existingNote.id
    console.log('✅ Consultation note updated:')
    console.log(`   noteId: ${noteId}\n`)
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('consultation_notes')
      .insert({
        ...notePayload,
        created_at: isoNowMinus(60),
      })
      .select('id')
      .single()

    if (insertError) throw insertError
    noteId = inserted?.id || null
    console.log('✅ Consultation note created:')
    console.log(`   noteId: ${noteId}\n`)
  }

  // 3) Seed a prescription
  const { data: prescription, error: prescriptionError } = await supabase
    .from('prescriptions')
    .insert({
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      medications: [
        { name: 'Amoxicillin', dosage: '500mg', frequency: 'TID', duration: '7 days' },
        { name: 'Paracetamol', dosage: '500mg', frequency: 'PRN', duration: '3 days' },
      ],
      instructions: 'Take Amoxicillin 500mg three times daily for 7 days. Paracetamol 500mg as needed for fever/pain.',
      duration_days: 7,
      refills_remaining: 0,
      status: 'active',
      created_at: isoNowMinus(55),
    })
    .select()
    .single()

  if (prescriptionError) throw prescriptionError

  console.log('✅ Prescription created:')
  console.log(`   prescriptionId: ${prescription?.id}\n`)

  // 4) Seed investigations (one requested + one completed)
  const { data: requestedInv, error: requestedError } = await supabase
    .from('investigations')
    .insert({
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      test_name: 'Complete Blood Count (CBC)',
      test_type: 'Blood Test',
      status: 'requested',
      created_at: isoNowMinus(50),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (requestedError) throw requestedError

  const { data: completedInv, error: completedError } = await supabase
    .from('investigations')
    .insert({
      appointment_id: appointmentId,
      patient_id: patientId,
      doctor_id: doctorId,
      test_name: 'Rapid Strep Test',
      test_type: 'Point of Care',
      status: 'completed',
      results_text: 'Positive for Group A Streptococcus.',
      interpretation: 'Consistent with bacterial pharyngitis.',
      created_at: isoNowMinus(49),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (completedError) throw completedError

  console.log('✅ Investigations created:')
  console.log(`   requestedInvestigationId: ${requestedInv?.id}`)
  console.log(`   completedInvestigationId: ${completedInv?.id}\n`)

  console.log('🔎 Preview in UI:')
  console.log(`- Patient sessions:       http://localhost:3000/patient/sessions/${appointmentId}`)
  console.log(`- Patient investigations: http://localhost:3000/patient/investigations`)
  console.log(`- Patient prescriptions:  http://localhost:3000/patient/prescriptions`)
  console.log(`- Doctor appointment:     http://localhost:3000/doctor/appointments/${appointmentId}`)
  console.log('\n✅ Done.\n')
}

main().catch((err) => {
  console.error('❌ Seed failed:', err?.message || err)
  process.exit(1)
})

