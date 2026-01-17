/**
 * Test Prisma Connection
 * 
 * This script tests the Prisma client connection to the database
 * Run with: npx tsx scripts/test-prisma.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

import { prisma } from '../lib/prisma/client'

async function main() {
  console.log('Testing Prisma connection...\n')

  try {
    // Test 1: Count profiles
    const profileCount = await prisma.profile.count()
    console.log(`✅ Profile count: ${profileCount}`)

    // Test 2: Fetch first 5 profiles
    const profiles = await prisma.profile.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
      },
    })
    console.log(`✅ Fetched ${profiles.length} profiles:`)
    profiles.forEach((profile) => {
      console.log(`   - ${profile.email} (${profile.role})`)
    })

    // Test 3: Count appointments
    const appointmentCount = await prisma.appointment.count()
    console.log(`\n✅ Appointment count: ${appointmentCount}`)

    // Test 4: Test relations (if data exists)
    const profileWithAppointments = await prisma.profile.findFirst({
      where: {
        role: 'patient',
      },
      include: {
        patientAppointments: {
          take: 1,
        },
      },
    })

    if (profileWithAppointments) {
      console.log(
        `✅ Found patient with ${profileWithAppointments.patientAppointments.length} appointment(s)`
      )
    }

    console.log('\n✅ All Prisma tests passed!')
  } catch (error) {
    console.error('❌ Prisma connection test failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
