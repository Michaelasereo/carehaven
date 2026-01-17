'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface DoctorSearchFormProps {
  specialties: string[]
  currentFilter?: string
  currentSearch?: string
  currentSpecialty?: string
}

export function DoctorSearchForm({
  specialties,
  currentFilter,
  currentSearch,
  currentSpecialty,
}: DoctorSearchFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch || '')
  const [specialty, setSpecialty] = useState(currentSpecialty || 'all')
  const [filter, setFilter] = useState(currentFilter || 'all')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (specialty && specialty !== 'all') params.set('specialty', specialty)
    if (filter && filter !== 'all') params.set('filter', filter)
    router.push(`/admin/doctors?${params.toString()}`)
  }

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors..."
            className="pl-10"
          />
        </div>
        
        <Select value={specialty} onValueChange={setSpecialty}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Specialties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {specialties.map((spec) => (
              <SelectItem key={spec} value={spec}>
                {spec}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={filter === 'all' || !filter ? 'default' : 'outline'}
            onClick={() => {
              setFilter('all')
              const params = new URLSearchParams(searchParams.toString())
              params.delete('filter')
              router.push(`/admin/doctors?${params.toString()}`)
            }}
          >
            All
          </Button>
          <Button
            type="button"
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => {
              setFilter('pending')
              const params = new URLSearchParams(searchParams.toString())
              params.set('filter', 'pending')
              router.push(`/admin/doctors?${params.toString()}`)
            }}
          >
            Pending Verification
          </Button>
          <Button
            type="button"
            variant={filter === 'verified' ? 'default' : 'outline'}
            onClick={() => {
              setFilter('verified')
              const params = new URLSearchParams(searchParams.toString())
              params.set('filter', 'verified')
              router.push(`/admin/doctors?${params.toString()}`)
            }}
          >
            Verified
          </Button>
        </div>

        <Button type="submit">Search</Button>
      </form>
    </Card>
  )
}
