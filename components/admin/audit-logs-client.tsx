'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  user_id: string | null
  admin_id: string | null
  description: string
  metadata: any
  created_at: string
  user?: { full_name: string | null; email: string | null }
  admin?: { full_name: string | null; email: string | null }
}

interface AuditLogsClientProps {
  auditLogs: AuditLog[]
  currentPage: number
  totalPages: number
  searchParams: Record<string, string | undefined>
  actions: string[]
  entityTypes: string[]
}

export function AuditLogsClient({
  auditLogs,
  currentPage,
  totalPages,
  searchParams,
  actions,
  entityTypes,
}: AuditLogsClientProps) {
  const router = useRouter()
  const params = useSearchParams()
  const [search, setSearch] = useState(searchParams.search || '')

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(params.toString())
    if (value && value !== 'all') {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    newParams.delete('page') // Reset to page 1
    router.push(`/admin/audit-logs?${newParams.toString()}`)
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
    router.push(`/admin/audit-logs?${newParams.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(params.toString())
    newParams.set('page', newPage.toString())
    router.push(`/admin/audit-logs?${newParams.toString()}`)
  }

  const getActionBadge = (action: string) => {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive'> = {
      CREATE: 'default',
      UPDATE: 'secondary',
      DELETE: 'destructive',
      VERIFY: 'default',
      SUSPEND: 'destructive',
      REACTIVATE: 'default',
      APPROVE: 'default',
      REJECT: 'destructive',
      VIEW: 'secondary',
      EXPORT: 'secondary',
    }
    return <Badge variant={variantMap[action] || 'secondary'}>{action}</Badge>
  }

  if (auditLogs.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-600">No audit logs found</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="pl-10"
            />
          </div>

          <Select
            value={searchParams.action || 'all'}
            onValueChange={(value) => handleFilterChange('action', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={searchParams.entity_type || 'all'}
            onValueChange={(value) => handleFilterChange('entity_type', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={searchParams.date_from || ''}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            className="w-[180px]"
            placeholder="From Date"
          />

          <Input
            type="date"
            value={searchParams.date_to || ''}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
            className="w-[180px]"
            placeholder="To Date"
          />

          <Button type="submit">Search</Button>
        </form>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-gray-600">
                  {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{log.entity_type}</p>
                    {log.entity_id && (
                      <p className="text-xs text-gray-500">{log.entity_id.substring(0, 8)}...</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {log.user ? (
                    <div>
                      <p className="text-sm">{log.user.full_name || log.user.email || 'Unknown'}</p>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {log.admin ? (
                    <div>
                      <p className="text-sm">{log.admin.full_name || log.admin.email || 'Unknown'}</p>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">System</span>
                  )}
                </TableCell>
                <TableCell>
                  <p className="text-sm">{log.description}</p>
                  {log.metadata && (
                    <details className="mt-1">
                      <summary className="text-xs text-gray-500 cursor-pointer">View metadata</summary>
                      <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

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
