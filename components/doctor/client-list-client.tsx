'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ClientListTable } from './client-list-table'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

interface Client {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  appointment_count?: number
  last_visit?: string | null
  total_spent?: number
}

interface ClientListClientProps {
  clients: Client[]
  currentPage: number
  totalPages: number
  searchParams: Record<string, string | undefined>
}

export function ClientListClient({
  clients,
  currentPage,
  totalPages,
  searchParams,
}: ClientListClientProps) {
  const router = useRouter()
  const params = useSearchParams()
  const [search, setSearch] = useState(searchParams.search || '')

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    const newParams = new URLSearchParams(params.toString())
    newParams.set('sort', field)
    newParams.set('order', direction)
    router.push(`/doctor/sessions?${newParams.toString()}`)
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
    router.push(`/doctor/sessions?${newParams.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(params.toString())
    newParams.set('page', newPage.toString())
    router.push(`/doctor/sessions?${newParams.toString()}`)
  }

  const handleRefresh = () => {
    router.refresh()
  }

  if (clients.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-600">No clients found</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            title="Refresh client list"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </form>
      </Card>

      <ClientListTable
        clients={clients}
        onSort={handleSort}
        sortField={searchParams.sort}
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
