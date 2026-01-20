'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AvailabilityManager } from '@/components/doctor/availability-manager'

interface AvailabilityPageClientProps {
  doctorId: string
  initialLicenseVerified: boolean
  initialAvailability: any[]
}

export function AvailabilityPageClient({
  doctorId,
  initialLicenseVerified,
  initialAvailability,
}: AvailabilityPageClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [licenseVerified, setLicenseVerified] = useState(initialLicenseVerified)

  // Subscribe to real-time verification status changes
  useEffect(() => {
    const channel = supabase
      .channel(`availability-page-verification-${doctorId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${doctorId}`,
        },
        (payload) => {
          const newData = payload.new as any
          if (newData.license_verified !== undefined) {
            const newVerifiedStatus = newData.license_verified
            setLicenseVerified(newVerifiedStatus)
            // Refresh the page to update server-side data
            router.refresh()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [doctorId, supabase, router])

  // If not verified, show blocking message
  if (!licenseVerified) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Availability</h1>
          <p className="text-gray-600 mt-2">
            Set your available hours for each day of the week. Patients can only book appointments during these times.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">Access Revoked</h2>
          <p className="text-yellow-800">
            Your access has been revoked. Please contact the administrator to restore your access.
          </p>
          <p className="text-sm text-yellow-700 mt-2">
            Once your access is restored, you will be able to manage your availability and accept appointments.
          </p>
        </div>
      </div>
    )
  }

  // If verified, show availability manager
  return (
    <AvailabilityManager
      doctorId={doctorId}
      initialAvailability={initialAvailability}
      licenseVerified={licenseVerified}
    />
  )
}
