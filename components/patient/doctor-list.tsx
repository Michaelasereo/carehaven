'use client'

import { useQuery } from '@tanstack/react-query'
import { DoctorCard } from './doctor-card'
import { Loader2 } from 'lucide-react'

export function DoctorList({ onSelectDoctor }: { onSelectDoctor?: (doctorId: string) => void }) {
  const { data: doctors, isLoading, error } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await fetch('/api/doctors')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string })?.error || 'Failed to load doctors')
      }
      return (await res.json()) as unknown[]
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

  // Show empty state
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
      {doctors.map((doctor: { id: string }) => (
        <DoctorCard
          key={doctor.id}
          doctor={doctor}
          onSelect={onSelectDoctor}
        />
      ))}
    </div>
  )
}
