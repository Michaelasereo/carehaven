// Store response data for assertions
let lastResponseData: any = null
let lastResponseStatus: number = 200

// Mock NextResponse to capture the response data
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: { status?: number }) => {
      lastResponseData = data
      lastResponseStatus = init?.status || 200
      return {
        status: lastResponseStatus,
        json: async () => data,
        headers: new Map(),
      }
    },
  },
}))

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn().mockImplementation(() => ({
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'patient' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'auto_signin_tokens') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'token-row-id',
                    token: 'test-token',
                    user_id: 'test-user-id',
                    email: 'test@example.com',
                    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
                    used: false,
                    created_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        return {}
      }),
      auth: {
        admin: {
          updateUserById: jest.fn().mockResolvedValue({ error: null }),
        },
      },
    })),
  }
})

// Mock verification code functions
jest.mock('@/lib/auth/verification-code', () => ({
  verifyCode: jest.fn(),
  markCodeAsUsed: jest.fn(),
}))

import { POST } from '@/app/api/auth/verify-code/route'
import { verifyCode, markCodeAsUsed } from '@/lib/auth/verification-code'

describe('POST /api/auth/verify-code', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastResponseData = null
    lastResponseStatus = 200

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  })

  it('validates code is required', async () => {
    const request = new Request('http://localhost/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    await POST(request)

    expect(lastResponseStatus).toBe(400)
    expect(lastResponseData.error).toBe('Verification code is required')
  })

  it('validates email is required', async () => {
    const request = new Request('http://localhost/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '123456' }),
    })

    await POST(request)

    expect(lastResponseStatus).toBe(400)
    expect(lastResponseData.error).toBe('Email is required')
  })

  it('handles invalid verification code', async () => {
    ;(verifyCode as jest.Mock).mockResolvedValue(null)

    const request = new Request('http://localhost/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '000000', email: 'test@example.com' }),
    })

    await POST(request)

    expect(lastResponseStatus).toBe(400)
    expect(lastResponseData.error).toBe('Invalid or expired verification code')
    expect(markCodeAsUsed).not.toHaveBeenCalled()
  })

  it('verifies code successfully and returns auto-signin url', async () => {
    const userId = 'test-user-id'
    const email = 'test@example.com'
    const code = '123456'

    ;(verifyCode as jest.Mock).mockResolvedValue({
      userId,
      email,
    })

    const request = new Request('http://localhost/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, email }),
    })

    await POST(request)

    expect(lastResponseStatus).toBe(200)
    expect(lastResponseData.success).toBe(true)
    expect(lastResponseData.message).toBe('Email verified successfully')
    expect(lastResponseData.redirectPath).toBe('/patient')
    expect(lastResponseData.autoSigninUrl).toContain('/api/auth/auto-signin?token=')
    expect(verifyCode).toHaveBeenCalledWith(code, email)
    expect(markCodeAsUsed).toHaveBeenCalledWith(code, email)
  })

  it('handles both code and email missing', async () => {
    const request = new Request('http://localhost/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    await POST(request)

    expect(lastResponseStatus).toBe(400)
    expect(lastResponseData.error).toBeDefined()
  })

  it('auto-signin URL contains redirect path', async () => {
    const userId = 'test-user-id'
    const email = 'test@example.com'
    const code = '654321'

    ;(verifyCode as jest.Mock).mockResolvedValue({
      userId,
      email,
    })

    const request = new Request('http://localhost/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, email }),
    })

    await POST(request)

    expect(lastResponseStatus).toBe(200)
    expect(lastResponseData.autoSigninUrl).toContain('redirect=')
    // Encoded /patient
    expect(lastResponseData.autoSigninUrl).toContain('%2Fpatient')
  })
})
