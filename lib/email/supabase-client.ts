/**
 * Supabase Email Client
 * 
 * Uses Supabase's built-in email sending (via SMTP configured in Supabase dashboard)
 * Note: Supabase email sending is primarily for auth emails, but can be used
 * as a fallback for general emails if configured properly.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via Supabase
 * Note: This uses Supabase's email service (configured SMTP in dashboard)
 * For general emails, we create a temporary user and use auth.resend()
 * This is a workaround since Supabase doesn't have a general email API
 */
export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions) {
  try {
    // Supabase doesn't have a general email API, but we can use auth.resend()
    // for verification-style emails. For general emails, we'll need to use
    // a different approach or fall back to Brevo.
    
    // Check if user exists
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const existingUser = users?.find(u => u.email === to)

    if (existingUser) {
      // User exists - we can use auth.resend() but it's limited to auth emails
      // For now, we'll throw an error to fall back to Brevo for general emails
      throw new Error('Supabase email sending is limited to auth emails. Use Brevo for general emails.')
    } else {
      // For general emails to non-users, Supabase can't send them
      // We need to fall back to Brevo
      throw new Error('Supabase cannot send emails to non-users. Use Brevo.')
    }
  } catch (error: any) {
    // If it's our intentional error, re-throw it
    if (error.message?.includes('Supabase email sending is limited')) {
      throw error
    }
    // Otherwise, log and re-throw
    console.error('Supabase email error:', error)
    throw error
  }
}

/**
 * Send verification email via Supabase (for auth flows)
 * This works well for verification emails
 */
export async function sendVerificationEmail(email: string) {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })

    if (error) {
      throw error
    }

    console.log('✅ Email sent via Supabase')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to send email via Supabase:', error)
    throw error
  }
}
