import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Download } from 'lucide-react'
import { format } from 'date-fns'
import { AuditLogsClient } from '@/components/admin/audit-logs-client'

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: {
    search?: string
    action?: string
    entity_type?: string
    date_from?: string
    date_to?: string
    page?: string
  }
}) {
  // Auth and role checks are handled by app/(dashboard)/layout.tsx
  const supabase = await createClient()

  // Build query - simplified to handle different table schemas
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })

  // Apply filters
  if (searchParams.action && searchParams.action !== 'all') {
    query = query.eq('action', searchParams.action)
  }

  // Only filter by entity_type if the column exists (check schema)
  // The table might have either entity_type (from 002) or table_name (from 004)
  if (searchParams.entity_type && searchParams.entity_type !== 'all') {
    // Try entity_type first (schema from 002_audit_logs.sql)
    query = query.eq('entity_type', searchParams.entity_type)
  }

  if (searchParams.search) {
    // Search in description field (simplified - Supabase .or() can be finicky)
    // If description doesn't exist, this will still work (Supabase ignores null fields)
    query = query.ilike('description', `%${searchParams.search}%`)
  }

  if (searchParams.date_from) {
    query = query.gte('created_at', new Date(searchParams.date_from).toISOString())
  }

  if (searchParams.date_to) {
    const dateTo = new Date(searchParams.date_to)
    dateTo.setHours(23, 59, 59, 999)
    query = query.lte('created_at', dateTo.toISOString())
  }

  // Pagination
  const page = parseInt(searchParams.page || '1')
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to)

  const { data: auditLogs, error } = await query

  if (error) {
    console.error('Error fetching audit logs:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })
  }

  // Get total count for pagination
  let countQuery = supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })

  if (searchParams.action && searchParams.action !== 'all') {
    countQuery = countQuery.eq('action', searchParams.action)
  }

  if (searchParams.entity_type && searchParams.entity_type !== 'all') {
    countQuery = countQuery.eq('entity_type', searchParams.entity_type)
  }

  if (searchParams.search) {
    // Search in description field
    countQuery = countQuery.ilike('description', `%${searchParams.search}%`)
  }

  if (searchParams.date_from) {
    countQuery = countQuery.gte('created_at', new Date(searchParams.date_from).toISOString())
  }

  if (searchParams.date_to) {
    const dateTo = new Date(searchParams.date_to)
    dateTo.setHours(23, 59, 59, 999)
    countQuery = countQuery.lte('created_at', dateTo.toISOString())
  }

  const { count: totalCount } = await countQuery

  const totalPages = Math.ceil((totalCount || 0) / pageSize)

  // Get unique actions and entity types for filters
  const { data: actionsData } = await supabase
    .from('audit_logs')
    .select('action')
    .limit(1000)

  const actions = Array.from(new Set(actionsData?.map(a => a.action).filter(Boolean) || []))

  const { data: entityTypesData } = await supabase
    .from('audit_logs')
    .select('entity_type')
    .limit(1000)

  const entityTypes = Array.from(new Set(entityTypesData?.map(e => e.entity_type).filter(Boolean) || []))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Track system changes and user activities</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <AuditLogsClient
        auditLogs={auditLogs || []}
        currentPage={page}
        totalPages={totalPages}
        searchParams={searchParams}
        actions={actions}
        entityTypes={entityTypes}
      />
    </div>
  )
}
