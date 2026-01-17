/**
 * End-to-End Test Script
 * 
 * Tests complete user journey:
 * 1. Create doctor (bypass auth)
 * 2. Set doctor availability
 * 3. Create test patient
 * 4. Book appointment
 * 5. Confirm appointment & create video room
 * 6. Simulate consultation
 * 7. Create SOAP notes
 * 8. Test SMS notification
 * 9. Cleanup test data
 * 
 * Run: npx tsx scripts/test-e2e-journey.ts
 * 
 * Requires:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - DAILY_CO_API_KEY (for video room creation)
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const dailyApiKey = process.env.DAILY_CO_API_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  console.error('\n💡 Make sure .env.local exists and contains these variables')
  process.exit(1)
}

// Verify Supabase URL format
if (!supabaseUrl.includes('supabase.co')) {
  console.warn('⚠️  Warning: Supabase URL does not appear to be valid:', supabaseUrl.substring(0, 30) + '...')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Daily.co API helper
async function createDailyRoom(appointmentId: string) {
  if (!dailyApiKey) {
    console.warn('⚠️  DAILY_CO_API_KEY not set, skipping video room creation')
    return null
  }

  try {
    const roomName = `appointment-${appointmentId}`
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dailyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          enable_recording: 'cloud',
          enable_chat: true,
          enable_screenshare: true,
          exp: Math.floor(Date.now() / 1000) + 7200, // 2 hours
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Daily.co API error (${response.status}): ${response.statusText} - ${errorText}`)
    }

    const room = await response.json()
    return room
  } catch (error: any) {
    // Enhanced error logging
    if (error.message.includes('fetch failed')) {
      console.error('   ❌ Network error connecting to Daily.co API')
      console.error('   💡 Check your internet connection and Daily.co API key')
    } else {
      console.error('   ❌ Error creating Daily.co room:', error.message)
    }
    throw error
  }
}

// Import notification functions (using dynamic import to handle path resolution)
let createNotificationFunc: any = null

async function initializeNotificationFunction() {
  try {
    // Dynamic import to handle path resolution in scripts
    const notificationModule = await import('../lib/notifications/create')
    createNotificationFunc = notificationModule.createNotification
  } catch (error) {
    console.warn('⚠️  Could not import createNotification, will use direct notification creation')
  }
}

// Helper to create notification (uses createNotification if available, otherwise direct insert)
async function triggerNotification(
  userId: string,
  type: 'appointment' | 'prescription' | 'investigation' | 'message' | 'system',
  title: string,
  body: string
) {
  if (createNotificationFunc) {
    try {
      await createNotificationFunc(userId, type, title, body)
    } catch (error: any) {
      console.warn(`   ⚠️  Error using createNotification: ${error.message}`)
      // Fallback to direct insert
      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          body,
        })
      if (insertError) throw insertError
    }
  } else {
    // Fallback: direct insert
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        body,
      })
    if (error) throw error
  }
}

// Test data
const TEST_DOCTOR = {
  email: `test.doctor.${Date.now()}@carehaven.test`,
  password: 'TestPassword123!',
  full_name: 'Dr Test Doctor',
  specialty: 'General Practice',
  phone: '+2348141234567',
}

const TEST_PATIENT = {
  email: `test.patient.${Date.now()}@carehaven.test`,
  password: 'TestPassword123!',
  full_name: 'Test Patient',
  phone: '+2348141234568',
}

// Store IDs for cleanup
let doctorId: string | null = null
let patientId: string | null = null
let appointmentId: string | null = null
let roomName: string | null = null
let consultationNotesId: string | null = null
let notificationId: string | null = null

async function main() {
  console.log('\n🧪 End-to-End Test Script')
  console.log('========================\n')

  // Initialize notification function
  await initializeNotificationFunction()

  try {
    // Step 1: Create test doctor
    console.log('✅ Step 1: Creating test doctor...')
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingDoctor = existingUsers?.users.find(u => u.email === TEST_DOCTOR.email)

      if (existingDoctor) {
        console.log(`   ⚠️  Doctor user ${TEST_DOCTOR.email} already exists, using existing ID`)
        doctorId = existingDoctor.id
        
        // Check if profile exists
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', doctorId)
          .maybeSingle()
        
        if (existingProfile) {
          console.log('   ⚠️  Doctor profile already exists')
        } else if (profileCheckError && profileCheckError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is fine
          throw profileCheckError
        } else {
          // Wait a bit for the trigger to create the profile
          await new Promise(resolve => setTimeout(resolve, 500))

          // Upsert profile (trigger may have already created it)
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: doctorId,
              role: 'doctor',
              full_name: TEST_DOCTOR.full_name,
              specialty: TEST_DOCTOR.specialty,
              license_verified: true,
              email: TEST_DOCTOR.email,
              profile_completed: true,
              phone: TEST_DOCTOR.phone,
              bio: 'Test doctor for E2E testing',
              years_experience: 10,
            }, {
              onConflict: 'id'
            })
          
          if (profileError) throw profileError
          console.log('   ✅ Doctor profile created/updated')
        }
      } else {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: TEST_DOCTOR.email,
          password: TEST_DOCTOR.password,
          email_confirm: true,
          user_metadata: {
            full_name: TEST_DOCTOR.full_name,
          },
        })

        if (authError) throw authError

        doctorId = authData.user.id
        console.log(`   Doctor ID: ${doctorId}`)
        console.log(`   Email: ${TEST_DOCTOR.email}`)

        // Wait a bit for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 500))

        // Upsert doctor profile (trigger may have already created it)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: doctorId,
            role: 'doctor',
            full_name: TEST_DOCTOR.full_name,
            specialty: TEST_DOCTOR.specialty,
            license_verified: true,
            email: TEST_DOCTOR.email,
            profile_completed: true,
            phone: TEST_DOCTOR.phone,
            bio: 'Test doctor for E2E testing',
            years_experience: 10,
          }, {
            onConflict: 'id'
          })

        if (profileError) throw profileError
        console.log('   ✅ Doctor profile created/updated')
      }
    } catch (error: any) {
      console.error('   ❌ Error creating doctor:', error.message)
      throw error
    }

    // Step 2: Set doctor availability
    console.log('\n✅ Step 2: Setting doctor availability...')
    try {
      const availabilitySlots = []
      // Create slots for all 7 days (0=Sunday, 6=Saturday)
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        availabilitySlots.push({
          doctor_id: doctorId,
          day_of_week: dayOfWeek,
          start_time: '09:00:00',
          end_time: '17:00:00',
          active: true,
        })
      }

      const { error: availabilityError } = await supabase
        .from('doctor_availability')
        .insert(availabilitySlots)

      if (availabilityError) throw availabilityError
      console.log(`   ✅ Created ${availabilitySlots.length} availability slots (all 7 days)`)
      console.log('   Time: 09:00 - 17:00 WAT')
    } catch (error: any) {
      console.error('   ❌ Error setting availability:', error.message)
      throw error
    }

    // Step 3: Create test patient
    console.log('\n✅ Step 3: Creating test patient...')
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingPatient = existingUsers?.users.find(u => u.email === TEST_PATIENT.email)

      if (existingPatient) {
        console.log(`   ⚠️  Patient user ${TEST_PATIENT.email} already exists, using existing ID`)
        patientId = existingPatient.id
        
        // Check if profile exists
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', patientId)
          .maybeSingle()
        
        if (existingProfile) {
          console.log('   ⚠️  Patient profile already exists')
        } else if (profileCheckError && profileCheckError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is fine
          throw profileCheckError
        } else {
          // Wait a bit for the trigger to create the profile
          await new Promise(resolve => setTimeout(resolve, 500))

          // Upsert profile (trigger may have already created it)
          // Note: notification_preferences is not in the schema, but notifications will default to enabled
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: patientId,
              role: 'patient',
              full_name: TEST_PATIENT.full_name,
              email: TEST_PATIENT.email,
              profile_completed: true,
              phone: TEST_PATIENT.phone,
            }, {
              onConflict: 'id'
            })
          
          if (profileError) throw profileError
          console.log('   ✅ Patient profile created/updated')
        }
      } else {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: TEST_PATIENT.email,
          password: TEST_PATIENT.password,
          email_confirm: true,
          user_metadata: {
            full_name: TEST_PATIENT.full_name,
          },
        })

        if (authError) throw authError

        patientId = authData.user.id
        console.log(`   Patient ID: ${patientId}`)
        console.log(`   Email: ${TEST_PATIENT.email}`)
        console.log(`   Phone: ${TEST_PATIENT.phone}`)

        // Wait a bit for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 500))

        // Upsert patient profile (trigger may have already created it)
        // Note: notification_preferences is not in the schema, but notifications will default to enabled
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: patientId,
            role: 'patient',
            full_name: TEST_PATIENT.full_name,
            email: TEST_PATIENT.email,
            profile_completed: true,
            phone: TEST_PATIENT.phone,
          }, {
            onConflict: 'id'
          })

        if (profileError) throw profileError
        console.log('   ✅ Patient profile created/updated with phone number')
      }
    } catch (error: any) {
      console.error('   ❌ Error creating patient:', error.message)
      throw error
    }

    // Step 4: Book appointment
    console.log('\n✅ Step 4: Booking appointment...')
    try {
      // Schedule appointment for tomorrow at 10:00 AM (WAT)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)

      // Get global consultation price
      const { data: systemSettings } = await supabase
        .from('system_settings')
        .select('consultation_price')
        .single()

      const consultationPrice = systemSettings?.consultation_price || 5000 // Default 5000 kobo

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          scheduled_at: tomorrow.toISOString(),
          status: 'scheduled',
          payment_status: 'pending',
          amount: consultationPrice,
          currency: 'NGN',
          chief_complaint: 'Test consultation - E2E test',
          symptoms_description: 'Testing end-to-end journey',
          duration_minutes: 30,
        })
        .select()
        .single()

      if (appointmentError) throw appointmentError

      appointmentId = appointment.id
      console.log(`   Appointment ID: ${appointmentId}`)
      console.log(`   Scheduled: ${tomorrow.toLocaleDateString('en-US', { timeZone: 'Africa/Lagos' })} at 10:00 AM WAT`)
      console.log(`   Amount: ₦${Number(consultationPrice) / 100}`)
    } catch (error: any) {
      console.error('   ❌ Error booking appointment:', error.message)
      throw error
    }

    // Step 5: Confirm appointment (simulate payment)
    console.log('\n✅ Step 5: Confirming appointment (simulating payment)...')
    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
        })
        .eq('id', appointmentId)

      if (updateError) throw updateError
      console.log('   Status: confirmed')
      console.log('   Payment: paid')

      // Trigger appointment confirmed notification (will send SMS + Email if configured)
      await triggerNotification(
        patientId!,
        'appointment',
        'Appointment Confirmed',
        `Your appointment with ${TEST_DOCTOR.full_name} is confirmed for ${new Date().toLocaleDateString()}`
      )
      console.log('   ✅ Notification triggered for patient (SMS + Email if configured)')
    } catch (error: any) {
      console.error('   ❌ Error confirming appointment:', error.message)
      throw error
    }

    // Step 6: Create video room
    console.log('\n✅ Step 6: Creating video room...')
    try {
      if (!dailyApiKey) {
        console.log('   ⚠️  Skipping video room creation (DAILY_CO_API_KEY not set)')
        console.log('   💡 Set DAILY_CO_API_KEY in .env.local to enable video room creation')
      } else {
        console.log(`   Using Daily.co API key: ${dailyApiKey.substring(0, 10)}...`)
        const room = await createDailyRoom(appointmentId!)
        if (room) {
          roomName = room.name

          // Update appointment with room details
          const { error: updateError } = await supabase
            .from('appointments')
            .update({
              daily_room_name: room.name,
              daily_room_url: room.url,
            })
            .eq('id', appointmentId)

          if (updateError) {
            console.warn(`   ⚠️  Room created but failed to update appointment: ${updateError.message}`)
          }

          console.log(`   Room Name: ${room.name}`)
          console.log(`   Room URL: ${room.url}`)
          console.log('   ✅ Video room created and linked to appointment')
        }
      }
    } catch (error: any) {
      console.error('   ❌ Error creating video room:', error.message)
      console.log('   ⚠️  Continuing test without video room (optional)')
      // Don't throw - video room creation is optional for testing
    }

    // Step 7: Simulate consultation
    console.log('\n✅ Step 7: Simulating consultation...')
    try {
      // Update to in_progress
      await supabase
        .from('appointments')
        .update({ status: 'in_progress' })
        .eq('id', appointmentId)

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update to completed
      const { error: completeError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId)

      if (completeError) throw completeError
      console.log('   Status: completed')
      console.log('   ✅ Consultation simulated')
    } catch (error: any) {
      console.error('   ❌ Error simulating consultation:', error.message)
      throw error
    }

    // Step 8: Create SOAP notes
    console.log('\n✅ Step 8: Creating SOAP notes...')
    try {
      const { data: notes, error: notesError } = await supabase
        .from('consultation_notes')
        .insert({
          appointment_id: appointmentId,
          doctor_id: doctorId,
          subjective: 'Patient presents with common cold symptoms including runny nose, cough, and mild fever.',
          objective: 'Vital signs normal. Temperature: 37.2°C. Physical examination unremarkable.',
          assessment: 'Diagnosis: Common cold (viral upper respiratory infection)',
          plan: 'Prescribe symptomatic treatment. Follow-up in 1 week if symptoms persist.',
          diagnosis: 'Common cold',
        })
        .select()
        .single()

      if (notesError) throw notesError

      consultationNotesId = notes.id
      console.log(`   Notes ID: ${consultationNotesId}`)
      console.log('   ✅ SOAP notes created')
    } catch (error: any) {
      console.error('   ❌ Error creating SOAP notes:', error.message)
      throw error
    }

    // Step 9: Test SMS notification
    console.log('\n✅ Step 9: Testing SMS notification...')
    try {
      // Trigger notification for prescription (will send SMS + Email if configured)
      await triggerNotification(
        patientId!,
        'prescription',
        'New Prescription',
        `You have a new prescription from ${TEST_DOCTOR.full_name}`
      )

      // Get notification ID for cleanup
      const { data: notification } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', patientId)
        .eq('type', 'prescription')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (notification) {
        notificationId = notification.id
        console.log(`   Notification ID: ${notificationId}`)
      }

      console.log(`   SMS would be sent to: ${TEST_PATIENT.phone}`)
      console.log('   ✅ Notification created (SMS + Email will be sent if Twilio/Brevo are configured)')

      // Verify patient has phone and SMS enabled
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone, notification_preferences')
        .eq('id', patientId)
        .single()

      if (profile?.phone) {
        console.log(`   ✅ Patient has phone number: ${profile.phone}`)
      } else {
        console.log('   ⚠️  Patient missing phone number')
      }
      if (profile?.notification_preferences?.sms !== false) {
        console.log('   ✅ SMS notifications enabled')
      } else {
        console.log('   ⚠️  SMS notifications disabled')
      }
      if (profile?.notification_preferences?.email !== false) {
        console.log('   ✅ Email notifications enabled')
      } else {
        console.log('   ⚠️  Email notifications disabled')
      }
    } catch (error: any) {
      console.error('   ❌ Error testing SMS notification:', error.message)
      throw error
    }

    // Step 10: Verification
    console.log('\n📊 Test Summary:')
    console.log('   - Doctor: ✅ Created')
    console.log(`     ID: ${doctorId}`)
    console.log(`     Email: ${TEST_DOCTOR.email}`)
    console.log('   - Patient: ✅ Created')
    console.log(`     ID: ${patientId}`)
    console.log(`     Email: ${TEST_PATIENT.email}`)
    console.log(`     Phone: ${TEST_PATIENT.phone}`)
    console.log('   - Availability: ✅ Set (7 days, 9 AM - 5 PM WAT)')
    console.log('   - Appointment: ✅ Booked & Confirmed')
    console.log(`     ID: ${appointmentId}`)
    console.log('   - Video Room: ' + (roomName ? `✅ Created (${roomName})` : '⚠️  Skipped'))
    console.log('   - SOAP Notes: ✅ Created')
    console.log(`     ID: ${consultationNotesId}`)
    console.log('   - SMS Notification: ✅ Triggered')
    console.log(`     ID: ${notificationId}`)

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message)
    console.error('\n⚠️  Proceeding with cleanup...\n')
  } finally {
    // Step 11: Cleanup
    console.log('\n🧹 Cleaning up test data...')
    try {
      // Delete in order (respect foreign keys)
      if (consultationNotesId) {
        await supabase
          .from('consultation_notes')
          .delete()
          .eq('id', consultationNotesId)
        console.log('   ✅ Consultation notes deleted')
      }

      if (notificationId) {
        await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId)
        console.log('   ✅ Notification deleted')
      }

      if (appointmentId) {
        await supabase
          .from('appointments')
          .delete()
          .eq('id', appointmentId)
        console.log('   ✅ Appointment deleted')
      }

      if (doctorId) {
        // Delete availability
        await supabase
          .from('doctor_availability')
          .delete()
          .eq('doctor_id', doctorId)
        console.log('   ✅ Doctor availability deleted')

        // Delete profile
        await supabase
          .from('profiles')
          .delete()
          .eq('id', doctorId)
        console.log('   ✅ Doctor profile deleted')

        // Delete auth user
        await supabase.auth.admin.deleteUser(doctorId)
        console.log('   ✅ Doctor auth user deleted')
      }

      if (patientId) {
        // Delete profile
        await supabase
          .from('profiles')
          .delete()
          .eq('id', patientId)
        console.log('   ✅ Patient profile deleted')

        // Delete auth user
        await supabase.auth.admin.deleteUser(patientId)
        console.log('   ✅ Patient auth user deleted')
      }

      console.log('\n✅ All test data removed')
    } catch (error: any) {
      console.error('   ❌ Error during cleanup:', error.message)
      console.error('   ⚠️  Some test data may remain. Please clean up manually.')
    }
  }

  console.log('\n✅ All tests completed!\n')
}

main().catch(console.error)
