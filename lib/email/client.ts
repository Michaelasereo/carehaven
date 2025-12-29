import * as brevo from '@getbrevo/brevo'

const apiInstance = new brevo.TransactionalEmailsApi()
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '')

export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string
) {
  const sendSmtpEmail = new brevo.SendSmtpEmail()
  sendSmtpEmail.subject = subject
  sendSmtpEmail.htmlContent = htmlContent
  sendSmtpEmail.sender = { name: 'Care Haven', email: 'noreply@carehaven.com' }
  sendSmtpEmail.to = [{ email: to }]

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail)
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

