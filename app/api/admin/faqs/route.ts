import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getFAQs, createFAQ } from '@/lib/admin/faqs'

export async function GET() {
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

    const faqs = await getFAQs()

    return NextResponse.json({ faqs })
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 })
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

    const { question, answer, display_order } = await request.json()

    // Validate input
    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      )
    }

    // Get current max display_order to set default
    const currentFAQs = await getFAQs()
    const maxOrder = currentFAQs.length > 0 
      ? Math.max(...currentFAQs.map(f => f.display_order)) 
      : -1
    const newOrder = display_order !== undefined ? display_order : maxOrder + 1

    // Create FAQ
    const result = await createFAQ(question, answer, newOrder, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to create FAQ' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      faq: result.data,
    })
  } catch (error) {
    console.error('Error creating FAQ:', error)
    return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 })
  }
}
