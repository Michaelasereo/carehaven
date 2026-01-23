/**
 * Initialize Paystack payment.
 * @param amount - Amount in kobo (e.g. 5000 = ₦50). Paystack expects kobo.
 * @param email - Customer email
 * @param reference - Unique transaction reference
 */
export async function initializePayment(amount: number, email: string, reference: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://carehaven.app'
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.warn('⚠️ NEXT_PUBLIC_APP_URL is not set. Falling back to https://carehaven.app for Paystack callback_url.')
  }

  const callbackUrl = `${appUrl}/payment/callback`
  /** Amount is in kobo (e.g. 5000 = ₦50). Paystack expects kobo. */
  const amountKobo = amount

  console.log('💳 Initializing Paystack payment:', {
    amountKobo,
    email,
    reference,
    callback_url: callbackUrl,
    hasSecretKey: !!process.env.PAYSTACK_SECRET_KEY,
    secretKeyPrefix: process.env.PAYSTACK_SECRET_KEY?.substring(0, 7)
  })

  const requestBody = {
    amount: amountKobo,
    email,
    reference,
    callback_url: callbackUrl,
  }

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  const responseData = await response.json().catch(() => ({}))
  const paystackOk = responseData?.status === true && responseData?.data?.authorization_url

  if (!response.ok) {
    const err = responseData?.message || responseData?.error || `HTTP ${response.status}`
    console.error('❌ Paystack API error:', { status: response.status, errorData: responseData })
    throw new Error(err)
  }

  if (!paystackOk) {
    const err = responseData?.message || 'Paystack did not return a payment URL.'
    console.error('❌ Paystack response missing authorization_url:', responseData)
    throw new Error(err)
  }

  return responseData
}

export async function verifyPayment(reference: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to verify payment')
  }

  return response.json()
}

