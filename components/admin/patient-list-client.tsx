'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { PatientListTable } from './patient-list-table'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Patient {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  date_of_birth: string | null
  gender: string | null
  profile_completed: boolean
  created_at: string
  avatar_url: string | null
  appointment_count?: number
  last_visit?: string | null
}

interface PatientListClientProps {
  patients: Patient[]
  currentPage: number
  totalPages: number
  searchParams: Record<string, string | undefined | null>
}

export function PatientListClient({
  patients,
  currentPage,
  totalPages,
  searchParams,
}: PatientListClientProps) {
  const router = useRouter()
  const params = useSearchParams()
  const [search, setSearch] = useState(searchParams.search || '')
  const [filter, setFilter] = useState(searchParams.filter || 'all')

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    const newParams = new URLSearchParams(params.toString())
    newParams.set('sort', field)
    newParams.set('order', direction)
    router.push(`/admin/patients?${newParams.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const newParams = new URLSearchParams(params.toString())
    if (search) {
      newParams.set('search', search)
    } else {
      newParams.delete('search')
    }
    newParams.delete('page') // Reset to page 1
    router.push(`/admin/patients?${newParams.toString()}`)
  }

  const handleFilterChange = (value: string) => {
    setFilter(value)
    const newParams = new URLSearchParams(params.toString())
    if (value !== 'all') {
      newParams.set('filter', value)
    } else {
      newParams.delete('filter')
    }
    newParams.delete('page') // Reset to page 1
    router.push(`/admin/patients?${newParams.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(params.toString())
    newParams.set('page', newPage.toString())
    router.push(`/admin/patients?${newParams.toString()}`)
  }

  if (patients.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-600">No patients found</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients..."
              className="pl-10"
            />
          </div>
          
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Patients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patients</SelectItem>
              <SelectItem value="complete">Profile Complete</SelectItem>
              <SelectItem value="incomplete">Profile Incomplete</SelectItem>
            </SelectContent>
          </Select>

          <Button type="submit">Search</Button>
        </form>
      </Card>

      <PatientListTable
        patients={patients}
        onSort={handleSort}
        sortField={searchParams.sort || undefined}
        sortDirection={searchParams.order as 'asc' | 'desc'}
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
