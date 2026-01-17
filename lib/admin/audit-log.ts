import { createClient } from '@/lib/supabase/server'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VERIFY'
  | 'SUSPEND'
  | 'REACTIVATE'
  | 'APPROVE'
  | 'REJECT'
  | 'VIEW'
  | 'EXPORT'

export type EntityType =
  | 'profile'
  | 'appointment'
  | 'prescription'
  | 'investigation'
  | 'consultation_notes'
  | 'notification'

export interface AuditLogData {
  action: AuditAction
  entityType: EntityType
  entityId?: string
  userId?: string
  adminId?: string
  description: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    const supabase = await createClient()
    
    // Get request headers for IP and user agent (if available)
    const ipAddress = data.ipAddress
    const userAgent = data.userAgent

    const { error } = await supabase.from('audit_logs').insert({
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId || null,
      user_id: data.userId || null,
      admin_id: data.adminId || null,
      description: data.description,
      metadata: data.metadata || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    })

    if (error) {
      console.error('Error creating audit log:', error)
      // Don't throw - audit logging should not break the main flow
    }
  } catch (error) {
    console.error('Unexpected error creating audit log:', error)
    // Don't throw - audit logging should not break the main flow
  }
}

// Helper function to log profile updates
export async function logProfileUpdate(
  profileId: string,
  adminId: string,
  changes: Record<string, { before: any; after: any }>,
  description?: string
): Promise<void> {
  await createAuditLog({
    action: 'UPDATE',
    entityType: 'profile',
    entityId: profileId,
    adminId,
    description: description || `Profile updated: ${Object.keys(changes).join(', ')}`,
    metadata: { changes },
  })
}

// Helper function to log verification actions
export async function logVerification(
  entityType: EntityType,
  entityId: string,
  adminId: string,
  verified: boolean,
  reason?: string
): Promise<void> {
  await createAuditLog({
    action: verified ? 'VERIFY' : 'REJECT',
    entityType,
    entityId,
    adminId,
    description: `${entityType} ${verified ? 'verified' : 'rejected'}${reason ? `: ${reason}` : ''}`,
    metadata: { verified, reason },
  })
}

// Helper function to log data access (for HIPAA compliance)
export async function logDataAccess(
  entityType: EntityType,
  entityId: string,
  adminId: string,
  description: string
): Promise<void> {
  await createAuditLog({
    action: 'VIEW',
    entityType,
    entityId,
    adminId,
    description,
    metadata: { accessType: 'admin_view' },
  })
}
