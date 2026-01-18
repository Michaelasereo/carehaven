import { NextResponse } from 'next/server'
import { getActiveFAQs } from '@/lib/admin/faqs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    // Validate limit
    if (limit !== undefined && (isNaN(limit) || limit < 1)) {
      return NextResponse.json(
        { error: 'Invalid limit parameter' },
        { status: 400 }
      )
    }

    const faqs = await getActiveFAQs(limit)

    return NextResponse.json({ faqs })
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 })
  }
}
