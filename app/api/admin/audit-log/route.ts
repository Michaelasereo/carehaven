import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createAuditLog, logVerification, type AuditAction, type EntityType } from '@/lib/admin/audit-log'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { type, ...data } = body

    // Handle different audit log types
    if (type === 'verification') {
      const { entityType, entityId, verified, reason } = data
      await logVerification(
        entityType as EntityType,
        entityId,
        user.id,
        verified,
        reason
      )
    } else if (type === 'custom') {
      const { action, entityType, entityId, userId, description, metadata } = data
      await createAuditLog({
        action: action as AuditAction,
        entityType: entityType as EntityType,
        entityId,
        userId,
        adminId: user.id,
        description,
        metadata,
      })
    } else {
      return NextResponse.json({ error: 'Invalid audit log type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}
