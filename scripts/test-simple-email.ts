// Simple email test
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const BREVO_API_KEY = process.env.BREVO_API_KEY

async function testSimple() {
  console.log('🧪 Testing Brevo API connection...')
  console.log(`API Key (first 10 chars): ${BREVO_API_KEY?.substring(0, 10)}...\n`)
  
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY || '',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'Care Haven',
        email: 'mycarehaven@gmail.com',
      },
      to: [
        {
          email: 'asereope@gmail.com',
        },
      ],
      subject: 'Simple Test',
      textContent: 'This is a simple test email.',
    }),
  })
  
  console.log('Status:', response.status)
  console.log('Status Text:', response.statusText)
  
  try {
    const body = await response.text()
    console.log('Response:', body)
  } catch (e) {
    console.log('Could not parse response as text')
  }
}

testSimple().catch(console.error)
