import { createClient } from '@/lib/supabase/server'
import { AuditLogsClient } from '@/components/admin/audit-logs-client'

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    action?: string
    entity_type?: string
    date_from?: string
    date_to?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query - simplified to handle different table schemas
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })

  // Apply filters
  if (params.action && params.action !== 'all') {
    query = query.eq('action', params.action)
  }

  if (params.entity_type && params.entity_type !== 'all') {
    query = query.eq('entity_type', params.entity_type)
  }

  if (params.search) {
    query = query.ilike('description', `%${params.search}%`)
  }

  if (params.date_from) {
    query = query.gte('created_at', new Date(params.date_from).toISOString())
  }

  if (params.date_to) {
    const dateTo = new Date(params.date_to)
    dateTo.setHours(23, 59, 59, 999)
    query = query.lte('created_at', dateTo.toISOString())
  }

  // Pagination
  const page = parseInt(params.page || '1')
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

  if (params.action && params.action !== 'all') {
    countQuery = countQuery.eq('action', params.action)
  }

  if (params.entity_type && params.entity_type !== 'all') {
    countQuery = countQuery.eq('entity_type', params.entity_type)
  }

  if (params.search) {
    countQuery = countQuery.ilike('description', `%${params.search}%`)
  }

  if (params.date_from) {
    countQuery = countQuery.gte('created_at', new Date(params.date_from).toISOString())
  }

  if (params.date_to) {
    const dateTo = new Date(params.date_to)
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 mt-1">Track system changes and user activities</p>
      </div>

      <AuditLogsClient
        auditLogs={auditLogs || []}
        currentPage={page}
        totalPages={totalPages}
        searchParams={params}
        actions={actions}
        entityTypes={entityTypes}
      />
    </div>
  )
}
