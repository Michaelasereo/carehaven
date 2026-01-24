import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'doctor')
      .eq('license_verified', true)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('[api/doctors] Supabase error:', error)
      return NextResponse.json({ error: 'Failed to load doctors' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err) {
    console.error('[api/doctors] Unexpected error:', err)
    return NextResponse.json({ error: 'Failed to load doctors' }, { status: 500 })
  }
}
