export async function initializePayment(amount: number, email: string, reference: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.warn('⚠️ NEXT_PUBLIC_APP_URL is not set. Falling back to http://localhost:3000 for Paystack callback_url.')
  }

  const callbackUrl = `${appUrl}/payment/callback`
  
  console.log('💳 Initializing Paystack payment:', {
    amount: amount * 100, // in kobo
    email,
    reference,
    callback_url: callbackUrl,
    hasSecretKey: !!process.env.PAYSTACK_SECRET_KEY,
    secretKeyPrefix: process.env.PAYSTACK_SECRET_KEY?.substring(0, 7)
  })
  
  const requestBody = {
    amount: amount * 100, // Convert to kobo
    email,
    reference,
    callback_url: callbackUrl,
  }
  
  console.log('📤 Paystack API request body:', requestBody)
  
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorData =
      typeof (response as any).json === 'function'
        ? await (response as any).json().catch(() => ({}))
        : {}
    console.error('❌ Paystack API error response:', {
      status: response.status,
      statusText: response.statusText,
      errorData
    })
    const errorMessage = errorData.message || 'Failed to initialize payment'
    throw new Error(errorMessage)
  }

  const responseData = await response.json()
  console.log('📥 Paystack API response:', {
    status: response.status,
    ok: response.ok,
    hasAuthorizationUrl: !!responseData?.data?.authorization_url,
    authorizationUrl: responseData?.data?.authorization_url
  })

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

