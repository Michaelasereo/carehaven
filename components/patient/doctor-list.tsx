'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { DoctorCard } from './doctor-card'
import { Loader2 } from 'lucide-react'

export function DoctorList({ onSelectDoctor }: { onSelectDoctor?: (doctorId: string) => void }) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: doctors, isLoading, error } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor')
        .eq('license_verified', true)
        .order('full_name', { ascending: true })

      if (error) throw error
      return data || []
    },
  })

  // Subscribe to real-time profile updates (bio, avatar_url, and license_verified)
  // Also listen for INSERT events so newly enrolled doctors appear immediately
  useEffect(() => {
    const channel = supabase
      .channel('doctor-profiles-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE events
          schema: 'public',
          table: 'profiles',
          filter: 'role=eq.doctor',
        },
        (payload) => {
          // For INSERT events, new doctor was added - always invalidate
          // For UPDATE events, only invalidate if relevant fields changed
          // For DELETE events, invalidate to remove deleted doctors
          if (payload.eventType === 'INSERT') {
            // New doctor added - check if they're verified
            const newData = payload.new as any
            if (newData.license_verified === true) {
              queryClient.invalidateQueries({ queryKey: ['doctors'] })
            }
          } else if (payload.eventType === 'UPDATE') {
            const newData = payload.new as any
            // Invalidate and refetch doctors to get updated bio, avatar, or verification status
            // This ensures revoked doctors are immediately removed from the list
            // (since the query filters by license_verified: true)
            if (newData.bio !== undefined || newData.avatar_url !== undefined || newData.license_verified !== undefined) {
              queryClient.invalidateQueries({ queryKey: ['doctors'] })
            }
          } else if (payload.eventType === 'DELETE') {
            // Doctor deleted - refresh list
            queryClient.invalidateQueries({ queryKey: ['doctors'] })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, queryClient])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        Error loading doctors: {error.message}
      </div>
    )
  }

  if (!doctors || doctors.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center">
        <p className="text-gray-600">No verified doctors available at this time.</p>
        <p className="mt-2 text-sm text-gray-500">
          Please check back later or contact support.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {doctors.map((doctor) => (
        <DoctorCard
          key={doctor.id}
          doctor={doctor}
          onSelect={onSelectDoctor}
        />
      ))}
    </div>
  )
}

