// Email sending with Resend (primary), Supabase (fallback), and Brevo (final fallback)
import { sendEmail as sendEmailResend } from './resend-client'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * Send email using Resend (primary), Supabase (fallback), or Brevo (final fallback)
 * Maintains backward compatibility with existing code
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string
) {
  const resendApiKey = process.env.RESEND_API_KEY
  const brevoApiKey = process.env.BREVO_API_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Try Resend first if API key is configured
  if (resendApiKey) {
    try {
      console.log('📧 Attempting to send email via Resend...')
      const result = await sendEmailResend({
        to,
        subject,
        html: htmlContent,
      })
      console.log('✅ Email sent successfully via Resend')
      return result
    } catch (error: any) {
      console.warn('⚠️  Resend failed, falling back to Supabase:', error.message)
      // Continue to Supabase fallback
    }
  } else {
    console.log('📧 RESEND_API_KEY not set, trying Supabase...')
  }

  // Fallback to Supabase (uses SMTP configured in Supabase dashboard)
  if (supabaseUrl && supabaseServiceKey) {
    try {
      console.log('📧 Attempting to send email via Supabase...')
      
      // Check if user exists in Supabase
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existingUser = users?.find(u => u.email === to)

      if (existingUser && !existingUser.email_confirmed_at) {
        // User exists but not verified - we can use auth.resend()
        // Note: This sends a verification email, not a custom email
        // For general emails, we'll fall through to Brevo
        console.log('⚠️  Supabase can only send auth emails, falling back to Brevo for general emails')
        throw new Error('Supabase limited to auth emails')
      } else {
        // For general emails or non-users, Supabase can't send them
        // Fall through to Brevo
        console.log('⚠️  Supabase cannot send general emails, falling back to Brevo')
        throw new Error('Supabase cannot send general emails')
      }
    } catch (error: any) {
      if (!error.message?.includes('Supabase')) {
        console.warn('⚠️  Supabase failed, falling back to Brevo:', error.message)
      }
      // Continue to Brevo fallback
    }
  } else {
    console.log('📧 Supabase not configured, using Brevo...')
  }

  // Final fallback to Brevo
  if (!brevoApiKey) {
    throw new Error('No email service configured. Set RESEND_API_KEY, Supabase credentials, or BREVO_API_KEY')
  }

  try {
    console.log('📧 Sending email via Brevo (final fallback)...')
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Care Haven',
          email: 'mycarehaven@gmail.com',
        },
        to: [
          {
            email: to,
          },
        ],
        subject: subject,
        htmlContent: htmlContent,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Brevo API error: ${error}`)
    }

    const result = await response.json()
    console.log('✅ Email sent successfully via Brevo (final fallback)')
    return result
  } catch (error) {
    console.error('❌ Error sending email via Brevo:', error)
    throw error
  }
}

