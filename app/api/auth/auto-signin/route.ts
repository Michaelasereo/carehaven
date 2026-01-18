import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * Auto-sign-in route for verified users
 * This creates a session for users who have verified their email but haven't signed in yet
 * Used after email verification in enrollment flow
 */
export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      )
    }

    // Get user to verify they exist and email is confirmed
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    const user = users?.find(u => u.id === userId && u.email === email)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Email not verified' },
        { status: 400 }
      )
    }

    // Generate a magic link that will create a session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${appUrl}/auth/callback`,
      },
    })

    if (linkError || !linkData) {
      console.error('❌ Error generating magic link:', linkError)
      return NextResponse.json(
        { error: 'Failed to create sign-in link' },
        { status: 500 }
      )
    }

    // Return the magic link URL
    return NextResponse.json({
      success: true,
      magicLink: linkData.properties.action_link,
    })
  } catch (error: any) {
    console.error('❌ Error in auto-signin API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to auto-sign-in' },
      { status: 500 }
    )
  }
}
