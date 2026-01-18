// Email sending using Brevo SMTP via API
// Note: This client is for general emails (notifications, alerts, verification codes, etc.)
// Brevo SMTP is also configured in Supabase dashboard for auth emails

/**
 * Send email using Brevo API
 * 
 * Environment Variables:
 * - BREVO_API_KEY: Your Brevo API key (required)
 * 
 * This is used for all general emails including:
 * - Notification emails
 * - Verification code emails
 * - System alerts
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string
) {
  const brevoApiKey = process.env.BREVO_API_KEY

  if (!brevoApiKey) {
    throw new Error('BREVO_API_KEY is not configured. Please set it in your environment variables.')
  }

  try {
    console.log('📧 Sending email via Brevo...')
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Michael from Carehaven',
          email: 'mycarehaven@carehaven.app',
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
    console.log('✅ Email sent successfully via Brevo')
    return result
  } catch (error) {
    console.error('❌ Error sending email via Brevo:', error)
    throw error
  }
}

