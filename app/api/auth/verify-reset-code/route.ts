import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCode, markCodeAsUsed } from '@/lib/auth/verification-code'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: Request) {
  try {
    const { code, email } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Reset code is required' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Verify the code
    const verificationResult = await verifyCode(code, email)

    if (!verificationResult) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code' },
        { status: 400 }
      )
    }

    const { userId } = verificationResult

    // Mark code as used
    await markCodeAsUsed(code, email)

    // Return success with userId (needed for password update)
    return NextResponse.json({
      success: true,
      message: 'Reset code verified successfully',
      userId,
    })
  } catch (error: any) {
    console.error('❌ Error in verify-reset-code API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify reset code' },
      { status: 500 }
    )
  }
}
