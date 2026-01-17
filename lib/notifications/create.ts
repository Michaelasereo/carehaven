import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/client'
import { sendSMS } from '@/lib/sms/client'

// This should only be used server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * Create notification and send email/SMS based on user preferences
 */
export async function createNotification(
  userId: string,
  type: 'appointment' | 'prescription' | 'investigation' | 'message' | 'system',
  title: string,
  body?: string,
  data?: any
) {
  // First, create the in-app notification (always)
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      body,
      data,
    })

  if (error) {
    console.error('Error creating notification:', error)
    throw error
  }

  // Then, send email/SMS based on user preferences
  try {
    // Fetch user profile to get preferences and contact info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, phone, notification_preferences')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.warn('Could not fetch user profile for notifications:', profileError)
      return // Don't fail notification creation if we can't send email/SMS
    }

    const notificationBody = body || title
    const notificationText = `${title}${body ? `: ${body}` : ''}`

    // Get notification preferences (default to true if not set)
    const emailEnabled = profile.notification_preferences?.email ?? true
    const smsEnabled = profile.notification_preferences?.sms ?? true

    // Send email if enabled and email exists
    if (emailEnabled && profile.email) {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #0d9488;">${title}</h2>
                ${body ? `<p>${body}</p>` : ''}
                <p style="margin-top: 20px; font-size: 12px; color: #666;">
                  This is an automated notification from Care Haven.
                </p>
              </div>
            </body>
          </html>
        `
        await sendEmail(profile.email, title, emailHtml)
        console.log(`Email notification sent to ${profile.email}`)
      } catch (emailError) {
        console.error('Error sending email notification:', emailError)
        // Don't throw - email failure shouldn't break notification creation
      }
    }

    // Send SMS if enabled and phone exists
    if (smsEnabled && profile.phone) {
      try {
        // Ensure phone number is in E.164 format (Twilio requirement)
        let phoneNumber = profile.phone.trim()
        if (!phoneNumber.startsWith('+')) {
          // If no country code, assume Nigerian number (+234)
          if (phoneNumber.startsWith('0')) {
            phoneNumber = '+234' + phoneNumber.substring(1)
          } else {
            phoneNumber = '+234' + phoneNumber
          }
        }

        await sendSMS(phoneNumber, notificationText)
        console.log(`SMS notification sent to ${phoneNumber}`)
      } catch (smsError) {
        console.error('Error sending SMS notification:', smsError)
        // Don't throw - SMS failure shouldn't break notification creation
      }
    }
  } catch (error) {
    // Log error but don't fail notification creation
    console.error('Error sending email/SMS notifications:', error)
  }
}

