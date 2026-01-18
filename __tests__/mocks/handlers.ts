import { http, HttpResponse } from 'msw'

// Mock Supabase Auth API
export const supabaseAuthHandlers = [
  // Sign up
  http.post('https://*.supabase.co/auth/v1/signup', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: body.email,
        email_confirmed_at: null,
        created_at: new Date().toISOString(),
      },
      session: null,
    })
  }),

  // Sign in with password
  http.post('https://*.supabase.co/auth/v1/token', async ({ request }) => {
    const body = await request.formData()
    const email = body.get('email')
    const password = body.get('password')

    if (email === 'test@example.com' && password === 'Test123!@#') {
      return HttpResponse.json({
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'test-user-id',
          email: email as string,
          email_confirmed_at: new Date().toISOString(),
        },
      })
    }

    return HttpResponse.json(
      { error: 'Invalid login credentials' },
      { status: 400 }
    )
  }),

  // Get user
  http.get('https://*.supabase.co/auth/v1/user', () => {
    return HttpResponse.json({
      id: 'test-user-id',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
    })
  }),

  // Reset password
  http.post('https://*.supabase.co/auth/v1/recover', () => {
    return HttpResponse.json({ message: 'Password reset email sent' })
  }),
]

// Mock Supabase Database API
export const supabaseDatabaseHandlers = [
  // Profiles
  http.get('https://*.supabase.co/rest/v1/profiles', () => {
    return HttpResponse.json([
      {
        id: 'test-user-id',
        role: 'patient',
        email: 'test@example.com',
        full_name: 'Test User',
        profile_completed: true,
      },
    ])
  }),

  http.post('https://*.supabase.co/rest/v1/profiles', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 'test-user-id',
      ...body,
      created_at: new Date().toISOString(),
    })
  }),

  http.patch('https://*.supabase.co/rest/v1/profiles', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 'test-user-id',
      ...body,
      updated_at: new Date().toISOString(),
    })
  }),

  // Appointments
  http.get('https://*.supabase.co/rest/v1/appointments', () => {
    return HttpResponse.json([
      {
        id: 'test-appointment-id',
        patient_id: 'test-patient-id',
        doctor_id: 'test-doctor-id',
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'scheduled',
        payment_status: 'paid',
      },
    ])
  }),

  http.post('https://*.supabase.co/rest/v1/appointments', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 'test-appointment-id',
      ...body,
      created_at: new Date().toISOString(),
    })
  }),

  // Notifications
  http.get('https://*.supabase.co/rest/v1/notifications', () => {
    return HttpResponse.json([])
  }),

  http.post('https://*.supabase.co/rest/v1/notifications', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 'test-notification-id',
      ...body,
      created_at: new Date().toISOString(),
    })
  }),
]

// Mock Paystack API
export const paystackHandlers = [
  http.post('https://api.paystack.co/transaction/initialize', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      status: true,
      message: 'Authorization URL created',
      data: {
        authorization_url: 'https://paystack.com/pay/test-reference',
        access_code: 'test-access-code',
        reference: body.reference || 'test-reference',
      },
    })
  }),

  http.get('https://api.paystack.co/transaction/verify/:reference', ({ params }) => {
    return HttpResponse.json({
      status: true,
      message: 'Verification successful',
      data: {
        status: 'success',
        reference: params.reference,
        amount: 2000000, // 20000 NGN in kobo
        currency: 'NGN',
      },
    })
  }),
]

// Mock Daily.co API
export const dailyHandlers = [
  http.post('https://api.daily.co/v1/rooms', () => {
    return HttpResponse.json({
      id: 'test-room-id',
      name: 'appointment-test-appointment-id',
      url: 'https://test.daily.co/appointment-test-appointment-id',
      config: {
        enable_recording: 'cloud',
        enable_chat: true,
        enable_screenshare: true,
        hipaa_compliant: true,
      },
    })
  }),

  http.post('https://api.daily.co/v1/meeting-tokens', () => {
    return HttpResponse.json({
      token: 'mock-daily-token',
    })
  }),
]

// Mock Brevo (Email) API
export const brevoHandlers = [
  http.post('https://api.brevo.com/v3/smtp/email', () => {
    return HttpResponse.json({
      messageId: 'test-message-id',
    })
  }),
]

// Mock Twilio (SMS) API
export const twilioHandlers = [
  http.post('https://api.twilio.com/2010-04-01/Accounts/:accountSid/Messages.json', () => {
    return HttpResponse.json({
      sid: 'test-message-sid',
      status: 'queued',
    })
  }),
]

// Combine all handlers
export const handlers = [
  ...supabaseAuthHandlers,
  ...supabaseDatabaseHandlers,
  ...paystackHandlers,
  ...dailyHandlers,
  ...brevoHandlers,
  ...twilioHandlers,
]
