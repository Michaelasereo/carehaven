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
      const errorText = await response.text()
      let errorMessage = `Brevo API error: ${errorText}`
      let errorDetails: any = {
        status: response.status,
        statusText: response.statusText,
        rawError: errorText,
      }
      
      // Provide more specific error messages
      if (response.status === 401 || response.status === 403) {
        // Try to parse the error to get more details
        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson.message) {
            errorMessage = `Brevo API authentication error: ${errorJson.message}`
          } else {
            errorMessage = 'Invalid Brevo API key. Please check BREVO_API_KEY environment variable.'
          }
          errorDetails.brevoError = errorJson
        } catch {
          errorMessage = `Invalid Brevo API key (HTTP ${response.status}). Please check BREVO_API_KEY environment variable.`
        }
        errorDetails.suggestion = 'Verify BREVO_API_KEY is set correctly in Netlify environment variables. Get your API key from: https://app.brevo.com/settings/keys/api'
      } else if (response.status === 400) {
        // Parse error if it's JSON
        try {
          const errorJson = JSON.parse(errorText)
          errorDetails.parsedError = errorJson
          if (errorJson.message) {
            errorMessage = `Brevo API error: ${errorJson.message}`
            // Check for specific issues
            if (errorJson.message.includes('sender') || errorJson.message.includes('unverified')) {
              errorMessage = 'Sender email not verified. Please verify mycarehaven@carehaven.app in Brevo dashboard.'
              errorDetails.suggestion = 'Go to Brevo Dashboard → Settings → Senders → Verify mycarehaven@carehaven.app'
            }
          }
          if (errorJson.code) {
            errorDetails.errorCode = errorJson.code
          }
        } catch {
          // Not JSON, use raw error
          if (errorText.includes('sender') || errorText.includes('unverified')) {
            errorMessage = 'Sender email not verified. Please verify mycarehaven@carehaven.app in Brevo dashboard.'
            errorDetails.suggestion = 'Go to Brevo Dashboard → Settings → Senders → Verify mycarehaven@carehaven.app'
          }
        }
      } else if (response.status === 429) {
        errorMessage = 'Brevo rate limit exceeded. Please try again later.'
        errorDetails.suggestion = 'Wait a few minutes before sending more emails'
      } else if (response.status >= 500) {
        errorMessage = 'Brevo server error. Please try again later.'
        errorDetails.suggestion = 'Check Brevo service status or try again in a few minutes'
      }
      
      console.error(`❌ Brevo API error (status ${response.status}):`, JSON.stringify(errorDetails, null, 2))
      throw new Error(errorMessage)
    }

    const result = await response.json()
    console.log('✅ Email sent successfully via Brevo')
    return result
  } catch (error) {
    console.error('❌ Error sending email via Brevo:', error)
    throw error
  }
}

