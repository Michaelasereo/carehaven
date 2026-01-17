/**
 * Resend Email Client
 * 
 * Primary email service using Resend with Gmail sender.
 * 
 * Environment Variables:
 * - RESEND_API_KEY: Your Resend API key (starts with 're_')
 *   Get it from: https://resend.com/api-keys
 * 
 * Note: Brevo is kept as a fallback in lib/email/client.ts
 * If RESEND_API_KEY is not set, the system will automatically fallback to Brevo.
 */
import { Resend } from 'resend';

// Lazy initialization to avoid errors when API key is not set
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = 'Care Haven <asereopeyemimichael@gmail.com>',
  cc,
  bcc,
}: SendEmailOptions) {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Email failed: ${error.message}`);
    }

    console.log('✅ Email sent via Resend:', data?.id);
    return data;
  } catch (error) {
    console.error('Failed to send email via Resend:', error);
    throw error;
  }
}
