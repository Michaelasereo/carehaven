import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: Request) {
  try {
    const { userId, password } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    // Validate password requirements
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Update password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: password,
    })

    if (updateError) {
      console.error('❌ Error updating password:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to reset password' },
        { status: 500 }
      )
    }

    console.log(`✅ Password reset successfully for user ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    })
  } catch (error: any) {
    console.error('❌ Error in reset-password API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 }
    )
  }
}
