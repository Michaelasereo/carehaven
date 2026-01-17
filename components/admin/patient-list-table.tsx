'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'

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
  // Aggregated data
  appointment_count?: number
  last_visit?: string | null
}

interface PatientListTableProps {
  patients: Patient[]
  onSort?: (field: string, direction: 'asc' | 'desc') => void
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export function PatientListTable({
  patients,
  onSort,
  sortField,
  sortDirection,
}: PatientListTableProps) {
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
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('email')}
                className="flex items-center hover:text-gray-900"
              >
                Email
                {getSortIcon('email')}
              </button>
            </TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('appointment_count')}
                className="flex items-center hover:text-gray-900"
              >
                Appointments
                {getSortIcon('appointment_count')}
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('last_visit')}
                className="flex items-center hover:text-gray-900"
              >
                Last Visit
                {getSortIcon('last_visit')}
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('profile_completed')}
                className="flex items-center hover:text-gray-900"
              >
                Status
                {getSortIcon('profile_completed')}
              </button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => {
            const initials = patient.full_name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase() || 'P'

            const age = patient.date_of_birth
              ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
              : null

            return (
              <TableRow key={patient.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={patient.avatar_url || undefined} alt={patient.full_name || 'Patient'} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/admin/patients/${patient.id}`}
                        className="font-medium hover:text-blue-600"
                      >
                        {patient.full_name || 'Unknown'}
                      </Link>
                      {age && <p className="text-sm text-gray-500">{age} years, {patient.gender}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{patient.email || 'N/A'}</TableCell>
                <TableCell className="text-sm">{patient.phone || 'N/A'}</TableCell>
                <TableCell>{patient.appointment_count || 0}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {patient.last_visit ? format(new Date(patient.last_visit), 'MMM d, yyyy') : 'Never'}
                </TableCell>
                <TableCell>
                  <Badge variant={patient.profile_completed ? 'default' : 'secondary'}>
                    {patient.profile_completed ? 'Complete' : 'Incomplete'}
                  </Badge>
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
                        <Link href={`/admin/patients/${patient.id}`} className="w-full">
                          View Details
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
