'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DoctorListTable } from './doctor-list-table'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Doctor {
  id: string
  full_name: string | null
  email: string | null
  specialty: string | null
  license_number: string | null
  license_verified: boolean
  years_experience: number | null
  consultation_fee: number | null
  created_at: string
  avatar_url: string | null
  patient_count?: number
  revenue?: number
}

interface DoctorListClientProps {
  doctors: Doctor[]
  currentPage: number
  totalPages: number
  searchParams: Record<string, string | undefined>
}

export function DoctorListClient({
  doctors,
  currentPage,
  totalPages,
  searchParams,
}: DoctorListClientProps) {
  const router = useRouter()
  const params = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    const newParams = new URLSearchParams(params.toString())
    newParams.set('sort', field)
    newParams.set('order', direction)
    router.push(`/admin/doctors?${newParams.toString()}`)
  }

  const handleBulkSelect = (ids: string[]) => {
    setSelectedIds(ids)
  }

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(params.toString())
    newParams.set('page', newPage.toString())
    router.push(`/admin/doctors?${newParams.toString()}`)
  }

  if (doctors.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-600">No doctors found</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <Card className="p-4 bg-blue-50">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">
              {selectedIds.length} doctor(s) selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Bulk Verify
              </Button>
              <Button variant="outline" size="sm">
                Export Selected
              </Button>
            </div>
          </div>
        </Card>
      )}

      <DoctorListTable
        doctors={doctors}
        onSort={handleSort}
        sortField={searchParams.sort}
        sortDirection={searchParams.order as 'asc' | 'desc'}
        onBulkSelect={handleBulkSelect}
        selectedIds={selectedIds}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
