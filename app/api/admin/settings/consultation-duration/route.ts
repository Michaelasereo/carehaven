import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getSystemSettings, updateConsultationDuration } from '@/lib/admin/system-settings'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getSystemSettings()
    
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    return NextResponse.json({
      consultation_duration: Number(settings.consultation_duration || 45),
      updated_at: settings.updated_at,
    })
  } catch (error) {
    console.error('Error fetching consultation duration:', error)
    return NextResponse.json({ error: 'Failed to fetch consultation duration' }, { status: 500 })
  }
}

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

    const { consultation_duration } = await request.json()

    // Validate input
    if (typeof consultation_duration !== 'number' || consultation_duration < 1) {
      return NextResponse.json(
        { error: 'Invalid consultation duration. Must be a positive integer (minimum 1 minute).' },
        { status: 400 }
      )
    }

    // Update duration
    const result = await updateConsultationDuration(consultation_duration, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update duration' }, { status: 500 })
    }

    // Return updated settings
    const settings = await getSystemSettings()

    return NextResponse.json({
      success: true,
      consultation_duration: Number(settings?.consultation_duration || 45),
      updated_at: settings?.updated_at,
    })
  } catch (error) {
    console.error('Error updating consultation duration:', error)
    return NextResponse.json({ error: 'Failed to update consultation duration' }, { status: 500 })
  }
}
