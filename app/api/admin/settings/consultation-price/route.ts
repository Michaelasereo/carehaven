import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getSystemSettings, updateConsultationPrice } from '@/lib/admin/system-settings'

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
      consultation_price: Number(settings.consultation_price),
      currency: settings.currency,
      updated_at: settings.updated_at,
    })
  } catch (error) {
    console.error('Error fetching consultation price:', error)
    return NextResponse.json({ error: 'Failed to fetch consultation price' }, { status: 500 })
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

    const { consultation_price } = await request.json()

    // Validate input
    if (typeof consultation_price !== 'number' || consultation_price < 0) {
      return NextResponse.json(
        { error: 'Invalid consultation price. Must be a positive number.' },
        { status: 400 }
      )
    }

    // Update price
    const result = await updateConsultationPrice(consultation_price, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update price' }, { status: 500 })
    }

    // Return updated settings
    const settings = await getSystemSettings()

    return NextResponse.json({
      success: true,
      consultation_price: Number(settings?.consultation_price),
      currency: settings?.currency,
      updated_at: settings?.updated_at,
    })
  } catch (error) {
    console.error('Error updating consultation price:', error)
    return NextResponse.json({ error: 'Failed to update consultation price' }, { status: 500 })
  }
}
