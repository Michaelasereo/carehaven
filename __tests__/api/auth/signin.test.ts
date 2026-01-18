import { POST } from '@/app/api/auth/signin/route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('POST /api/auth/signin', () => {
  const mockSignInWithPassword = jest.fn()
  const mockSupabaseClient = {
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  })

  it('handles email/password authentication', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            email_confirmed_at: new Date().toISOString(),
          },
        },
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
      error: null,
    })

    const request = new Request('http://localhost/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user.email).toBe('test@example.com')
  })

  it('validates email and password', async () => {
    const request = new Request('http://localhost/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        email: '',
        password: '',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('required')
  })

  it('handles authentication errors', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: {
        message: 'Invalid login credentials',
      },
    })

    const request = new Request('http://localhost/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid login credentials')
  })

  it('handles unverified email errors', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: {
        message: 'Email not confirmed',
      },
    })

    const request = new Request('http://localhost/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        email: 'unverified@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Email not confirmed')
  })

  it('validates request body', async () => {
    const request = new Request('http://localhost/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
  })

  it('sets cookies on successful signin', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
      error: null,
    })

    const request = new Request('http://localhost/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    // Check that cookies are set
    const setCookieHeader = response.headers.get('set-cookie')
    expect(setCookieHeader).toBeTruthy()
  })
})
