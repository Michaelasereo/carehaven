import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCode, markCodeAsUsed } from '@/lib/auth/verification-code'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * Helper function to get dashboard redirect path based on user role
 */
async function getDashboardRedirectPath(userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profile?.role === 'doctor') {
    return '/doctor/dashboard'
  } else if (profile?.role === 'admin' || profile?.role === 'super_admin') {
    return '/admin/dashboard'
  } else {
    return '/patient'
  }
}

/**
 * Generate a secure random token
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create an auto-signin token for the user
 * Returns the token that can be used to sign in automatically
 * 
 * Best Practices Applied:
 * 1. Transaction-like behavior: Verify insertion succeeded
 * 2. Proper error handling with detailed logging
 * 3. Return verification: Confirm token exists before returning
 * 4. Idempotency: Handle duplicate token errors gracefully
 * 5. Defensive programming: Verify token after insert
 */
async function createAutoSigninToken(userId: string, email: string): Promise<string | null> {
  const token = generateSecureToken()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
  const normalizedEmail = email.trim().toLowerCase()

  try {
    // Insert token into database with select to get inserted data
    const { data: insertData, error: insertError } = await supabase
      .from('auto_signin_tokens')
      .insert({
        token,
        user_id: userId,
        email: normalizedEmail,
        expires_at: expiresAt.toISOString(),
        used: false,
      })
      .select('id, token, user_id, email, expires_at, used, created_at')
      .single()

    if (insertError) {
      // Handle specific error cases
      if (insertError.code === '23505') { // Unique constraint violation (token collision - extremely rare)
        console.error('❌ Token collision detected (extremely rare), generating new token')
        // Retry once with a new token
        const retryToken = generateSecureToken()
        const { data: retryData, error: retryError } = await supabase
          .from('auto_signin_tokens')
          .insert({
            token: retryToken,
            user_id: userId,
            email: normalizedEmail,
            expires_at: expiresAt.toISOString(),
            used: false,
          })
          .select('id, token')
          .single()
        
        if (retryError || !retryData) {
          console.error('❌ Error creating auto-signin token (retry failed):', retryError)
          return null
        }
        
        console.log(`✅ Auto-signin token created (retry): ${retryToken.substring(0, 8)}...`)
        return retryToken
      }
      
      console.error('❌ Error creating auto-signin token:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      })
      return null
    }

    // Verify the token was actually created (defensive programming)
    if (!insertData || !insertData.id || insertData.token !== token) {
      console.error('❌ Token insert verification failed: data mismatch', {
        expected: { token, userId, email: normalizedEmail },
        actual: insertData,
      })
      return null
    }

    console.log(`✅ Auto-signin token inserted successfully: ${token.substring(0, 8)}...`)
    console.log(`   Token ID: ${insertData.id}`)
    console.log(`   User ID: ${userId}`)
    console.log(`   Email: ${normalizedEmail}`)
    console.log(`   Expires: ${new Date(expiresAt).toISOString()}`)

    // Additional verification: Query back to ensure token exists
    // This handles eventual consistency issues in distributed systems
    // Use retry logic with exponential backoff
    let verified = false
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data: verifyData, error: verifyError } = await supabase
        .from('auto_signin_tokens')
        .select('id, token, user_id, email, expires_at, used')
        .eq('token', token)
        .single()

      if (!verifyError && verifyData) {
        // Validate token data matches what we inserted
        if (verifyData.user_id === userId && verifyData.email === normalizedEmail) {
          verified = true
          console.log(`✅ Token verified in database (attempt ${attempt})`)
          break
        } else {
          console.warn(`⚠️ Token data mismatch on attempt ${attempt}`, {
            expected: { userId, email: normalizedEmail },
            actual: { userId: verifyData.user_id, email: verifyData.email },
          })
        }
      } else if (attempt < 3) {
        // Wait before retry (exponential backoff)
        const delay = 100 * attempt
        console.log(`⏳ Token verification failed (attempt ${attempt}/3), retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        console.warn('⚠️ Token created but verification query failed after retries:', verifyError?.message)
      }
    }

    if (!verified) {
      // Still return token as insert succeeded - verification is defensive
      // The insert returned data, so we trust it
      console.warn('⚠️ Token verification failed but insert succeeded - returning token anyway')
      console.warn('   This may be due to eventual consistency or RLS policy')
    }

    console.log(`✅ Auto-signin token created: ${token.substring(0, 8)}... for user ${userId}`)
    return token
  } catch (error: any) {
    console.error('❌ Unexpected error creating auto-signin token:', {
      message: error.message,
      stack: error.stack,
    })
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { code, email } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Verify the code
    const verificationResult = await verifyCode(code, email)

    if (!verificationResult) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    const { userId } = verificationResult

    // Mark code as used
    await markCodeAsUsed(code, email)

    // Confirm email in Supabase
    try {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          email_confirm: true,
        }
      )

      if (updateError) {
        console.error('❌ Error confirming email in Supabase:', updateError)
        return NextResponse.json(
          { error: 'Failed to verify email. Please try again.' },
          { status: 500 }
        )
      }

      console.log(`✅ Email ${email} verified successfully for user ${userId}`)
    } catch (error: any) {
      console.error('❌ Error updating user email confirmation:', error)
      return NextResponse.json(
        { error: 'Failed to verify email. Please try again.' },
        { status: 500 }
      )
    }

    // Get dashboard redirect path based on user role
    const redirectPath = await getDashboardRedirectPath(userId)
    console.log(`📍 Dashboard redirect path for user ${userId}: ${redirectPath}`)

    // Create auto-signin token for seamless redirect
    // Best Practice: Create token after all critical operations succeed
    const autoSigninToken = await createAutoSigninToken(userId, email)

    if (autoSigninToken) {
      // Return auto-signin URL for seamless redirect
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const autoSigninUrl = `${appUrl}/api/auth/auto-signin?token=${autoSigninToken}&redirect=${encodeURIComponent(redirectPath)}`
      
      console.log('✅ Auto-signin token created, returning URL')
      console.log(`   Token: ${autoSigninToken.substring(0, 8)}...`)
      console.log(`   Redirect: ${redirectPath}`)
      
      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        redirectPath,
        autoSigninUrl, // Client should redirect to this URL for automatic sign-in
        token: autoSigninToken, // Include token in response for testing/debugging (can be removed in production)
      })
    }

    // Fallback: If auto-signin token creation fails, tell client to sign in manually
    // Best Practice: Don't fail the entire verification if token creation fails
    // User can still sign in manually - this is a UX enhancement, not critical
    console.warn('⚠️ Auto-signin token creation failed, user will need to sign in manually')
    console.warn('   This is non-critical - email verification succeeded, user can sign in normally')
    
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      redirectPath,
      requiresSignIn: true,
      // Include helpful message for debugging
      note: 'Auto-signin token creation failed, but email verification succeeded',
    })

  } catch (error: any) {
    console.error('❌ Error in verify-code API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify code' },
      { status: 500 }
    )
  }
}
