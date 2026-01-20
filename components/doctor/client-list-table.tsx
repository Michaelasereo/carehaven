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
import { ArrowUpDown, Eye } from 'lucide-react'
import { format } from 'date-fns'

interface Client {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  // Aggregated data
  appointment_count?: number
  last_visit?: string | null
  total_spent?: number
}

interface ClientListTableProps {
  clients: Client[]
  onSort?: (field: string, direction: 'asc' | 'desc') => void
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export function ClientListTable({
  clients,
  onSort,
  sortField,
  sortDirection,
}: ClientListTableProps) {
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
                onClick={() => handleSort('total_spent')}
                className="flex items-center hover:text-gray-900"
              >
                Total Spent
                {getSortIcon('total_spent')}
              </button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const initials = client.full_name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase() || 'P'

            return (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={client.avatar_url || undefined} alt={client.full_name || 'Patient'} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/doctor/sessions/${client.id}`}
                        className="font-medium hover:text-teal-600"
                      >
                        {client.full_name || 'Unknown'}
                      </Link>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{client.email || 'N/A'}</TableCell>
                <TableCell>{client.appointment_count || 0}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {client.last_visit ? format(new Date(client.last_visit), 'MMM d, yyyy') : 'Never'}
                </TableCell>
                <TableCell>
                  {client.total_spent ? `₦${Math.round(client.total_spent / 100).toLocaleString()}` : '₦0'}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/doctor/sessions/${client.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
