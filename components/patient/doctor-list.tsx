'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { DoctorCard } from './doctor-card'
import { Loader2 } from 'lucide-react'

export function DoctorList({ onSelectDoctor }: { onSelectDoctor?: (doctorId: string) => void }) {
  const supabase = createClient()

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

