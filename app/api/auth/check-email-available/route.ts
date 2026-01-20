import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

/**
 * Check if an email address is available (not already registered)
 * 
 * GET /api/auth/check-email-available?email=user@example.com
 * 
 * Returns:
 * {
 *   available: boolean,
 *   exists: boolean,
 *   email: string
 * }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    // Validate email parameter
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          available: false,
          exists: false,
          email,
          error: 'Invalid email format'
        },
        { status: 400 }
      )
    }

    // Check if email exists in auth.users using Admin API
    try {
      const { data: { users }, error } = await supabase.auth.admin.listUsers()

      if (error) {
        console.error('Error listing users:', error)
        return NextResponse.json(
          { 
            available: false,
            exists: false,
            email,
            error: 'Failed to check email availability'
          },
          { status: 500 }
        )
      }

      // Check if email exists (case-insensitive)
      const normalizedEmail = email.trim().toLowerCase()
      const userExists = users.some(
        u => u.email?.toLowerCase() === normalizedEmail
      )

      return NextResponse.json({
        available: !userExists,
        exists: userExists,
        email: normalizedEmail,
      })
    } catch (error: any) {
      console.error('Error checking email availability:', error)
      return NextResponse.json(
        { 
          available: false,
          exists: false,
          email,
          error: 'Failed to check email availability'
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in check-email-available API:', error)
    return NextResponse.json(
      { 
        available: false,
        exists: false,
        error: error.message || 'Failed to check email availability'
      },
      { status: 500 }
    )
  }
}
