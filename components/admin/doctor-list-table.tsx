'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { VerifyDoctorButton } from '@/components/admin/verify-doctor-button'
import Link from 'next/link'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  // Aggregated data
  patient_count?: number
  revenue?: number
}

interface DoctorListTableProps {
  doctors: Doctor[]
  onSort?: (field: string, direction: 'asc' | 'desc') => void
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  onBulkSelect?: (ids: string[]) => void
  selectedIds?: string[]
}

export function DoctorListTable({
  doctors,
  onSort,
  sortField,
  sortDirection,
  onBulkSelect,
  selectedIds = [],
}: DoctorListTableProps) {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds)
  const [userRole, setUserRole] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Fetch user role
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setUserRole(profile?.role || null)
      }
    }

    fetchUserRole()
  }, [supabase])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = doctors.map(d => d.id)
      setLocalSelected(allIds)
      onBulkSelect?.(allIds)
    } else {
      setLocalSelected([])
      onBulkSelect?.([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      const newSelected = [...localSelected, id]
      setLocalSelected(newSelected)
      onBulkSelect?.(newSelected)
    } else {
      const newSelected = localSelected.filter(selectedId => selectedId !== id)
      setLocalSelected(newSelected)
      onBulkSelect?.(newSelected)
    }
  }

  const handleSort = (field: string) => {
    if (onSort) {
      const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
      onSort(field, direction)
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null
    return <ArrowUpDown className="h-4 w-4 ml-1" />
  }

  return (
    <div className="space-y-4">
      <div className="md:hidden space-y-3">
        {doctors.map((doctor) => {
          const initials = doctor.full_name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase() || 'D'

          return (
            <Card key={doctor.id} className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={doctor.avatar_url || undefined} alt={doctor.full_name || 'Doctor'} />
                  <AvatarFallback className="bg-teal-100 text-teal-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link
                    href={`/admin/doctors/${doctor.id}`}
                    className="font-medium hover:text-teal-600"
                  >
                    {doctor.full_name || 'Unknown'}
                  </Link>
                  <p className="text-sm text-gray-500">{doctor.email}</p>
                  <p className="text-xs text-gray-500">{doctor.specialty || 'N/A'}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <Badge variant={doctor.license_verified ? 'default' : 'secondary'}>
                  {doctor.license_verified ? 'Verified' : 'Access Revoked'}
                </Badge>
                <span className="text-gray-600">Patients: {doctor.patient_count || 0}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/admin/doctors/${doctor.id}`}>
                  <Button size="sm" variant="outline">View Details</Button>
                </Link>
                <Link href={`/admin/appointments?doctor=${doctor.id}`}>
                  <Button size="sm" variant="outline">View Appointments</Button>
                </Link>
                <Link href={`/admin/doctors/${doctor.id}/availability`}>
                  <Button size="sm" variant="outline">Availability</Button>
                </Link>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="hidden md:block border rounded-lg">
        <Table>
        <TableHeader>
          <TableRow>
            {onBulkSelect && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={localSelected.length === doctors.length && doctors.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </TableHead>
            )}
            <TableHead>Doctor</TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('specialty')}
                className="flex items-center hover:text-gray-900"
              >
                Specialty
                {getSortIcon('specialty')}
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('license_verified')}
                className="flex items-center hover:text-gray-900"
              >
                Status
                {getSortIcon('license_verified')}
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('created_at')}
                className="flex items-center hover:text-gray-900"
              >
                Registered
                {getSortIcon('created_at')}
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('patient_count')}
                className="flex items-center hover:text-gray-900"
              >
                Patients
                {getSortIcon('patient_count')}
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('revenue')}
                className="flex items-center hover:text-gray-900"
              >
                Revenue
                {getSortIcon('revenue')}
              </button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {doctors.map((doctor) => {
            const initials = doctor.full_name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase() || 'DR'

            return (
              <TableRow key={doctor.id}>
                {onBulkSelect && (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={localSelected.includes(doctor.id)}
                      onChange={(e) => handleSelectOne(doctor.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={doctor.avatar_url || undefined} alt={doctor.full_name || 'Doctor'} />
                      <AvatarFallback className="bg-teal-100 text-teal-700">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/admin/doctors/${doctor.id}`}
                        className="font-medium hover:text-teal-600"
                      >
                        {doctor.full_name || 'Unknown'}
                      </Link>
                      <p className="text-sm text-gray-500">{doctor.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{doctor.specialty || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={doctor.license_verified ? 'default' : 'secondary'}>
                    {doctor.license_verified ? 'Verified' : 'Access Revoked'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {new Date(doctor.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>{doctor.patient_count || 0}</TableCell>
                <TableCell>
                  {doctor.revenue ? `₦${Math.round(doctor.revenue / 100).toLocaleString()}` : '₦0'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/doctors/${doctor.id}`} className="w-full">
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/appointments?doctor=${doctor.id}`} className="w-full">
                          View Appointments
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/doctors/${doctor.id}/availability`} className="w-full">
                          Manage Availability
                        </Link>
                      </DropdownMenuItem>
                      {userRole === 'super_admin' && (
                        <DropdownMenuItem 
                          onSelect={(e) => {
                            e.preventDefault()
                            // Button will handle dialog
                          }}
                          className="p-0"
                        >
                          <VerifyDoctorButton 
                            doctorId={doctor.id} 
                            currentVerificationStatus={doctor.license_verified || false}
                          />
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
    </div>
  )
}
