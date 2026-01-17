// Using Brevo API for email sending
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string
) {
  const apiKey = process.env.BREVO_API_KEY || ''
  
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not set')
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
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

    return await response.json()
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

