// Store mock functions to be accessed in tests
let mockSingle = jest.fn()
let mockGenerateLink = jest.fn()
let mockUpdateEq = jest.fn()

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn().mockImplementation(() => ({
      from: jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: () => mockSingle(),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: () => mockUpdateEq(),
        }),
      })),
      auth: {
        admin: {
          generateLink: (...args: any[]) => mockGenerateLink(...args),
        },
      },
    })),
  }
})

// Mock the server createClient too
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

import { GET } from '@/app/api/auth/auto-signin/route'

describe('GET /api/auth/auto-signin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSingle = jest.fn()
    mockGenerateLink = jest.fn()
    mockUpdateEq = jest.fn().mockResolvedValue({ error: null })

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  })

  it('redirects to signin when token is missing', async () => {
    const request = new Request('http://localhost/api/auth/auto-signin')

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/auth/signin')
    expect(location).toContain('error=missing_token')
  })

  it('redirects to signin when token is invalid', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Token not found' },
    })

    const request = new Request('http://localhost/api/auth/auto-signin?token=invalid-token')

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/auth/signin')
    expect(location).toContain('error=invalid_token')
  })

  it('redirects to signin when token is already used', async () => {
    const token = 'used-token-123'
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    mockSingle.mockResolvedValue({
      data: {
        user_id: 'test-user-id',
        email: 'test@example.com',
        expires_at: expiresAt.toISOString(),
        used: true, // Token already used
      },
      error: null,
    })

    const request = new Request(`http://localhost/api/auth/auto-signin?token=${token}`)

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/auth/signin')
    expect(location).toContain('error=token_used')
  })

  it('redirects to signin when token is expired', async () => {
    const token = 'expired-token-123'
    const expiresAt = new Date(Date.now() - 1000) // Expired 1 second ago

    mockSingle.mockResolvedValue({
      data: {
        user_id: 'test-user-id',
        email: 'test@example.com',
        expires_at: expiresAt.toISOString(),
        used: false,
      },
      error: null,
    })

    const request = new Request(`http://localhost/api/auth/auto-signin?token=${token}`)

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/auth/signin')
    expect(location).toContain('error=token_expired')
  })

  it('successfully validates token and redirects to magic link', async () => {
    const token = 'valid-token-123'
    const userId = 'test-user-id'
    const email = 'test@example.com'
    const redirect = '/patient'
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    mockSingle.mockResolvedValue({
      data: {
        user_id: userId,
        email,
        expires_at: expiresAt.toISOString(),
        used: false,
      },
      error: null,
    })

    const magicLink = 'https://test.supabase.co/auth/v1/verify?token=magic-token'
    mockGenerateLink.mockResolvedValue({
      data: {
        properties: {
          action_link: magicLink,
        },
      },
      error: null,
    })

    const request = new Request(
      `http://localhost/api/auth/auto-signin?token=${token}&redirect=${encodeURIComponent(redirect)}`
    )

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(magicLink)
  })

  it('handles magic link generation failure with fallback to signin', async () => {
    const token = 'valid-token-123'
    const userId = 'test-user-id'
    const email = 'test@example.com'
    const redirect = '/patient'
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    mockSingle.mockResolvedValue({
      data: {
        user_id: userId,
        email,
        expires_at: expiresAt.toISOString(),
        used: false,
      },
      error: null,
    })

    mockGenerateLink.mockResolvedValue({
      data: null,
      error: { message: 'Failed to generate link' },
    })

    const request = new Request(
      `http://localhost/api/auth/auto-signin?token=${token}&redirect=${encodeURIComponent(redirect)}`
    )

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/auth/signin')
    expect(location).toContain('verified=true')
  })

  it('handles magic link failure with doctor redirect fallback', async () => {
    const token = 'valid-token-123'
    const userId = 'test-user-id'
    const email = 'doctor@example.com'
    const redirect = '/doctor/dashboard'
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    mockSingle.mockResolvedValue({
      data: {
        user_id: userId,
        email,
        expires_at: expiresAt.toISOString(),
        used: false,
      },
      error: null,
    })

    mockGenerateLink.mockResolvedValue({
      data: null,
      error: { message: 'Failed' },
    })

    const request = new Request(
      `http://localhost/api/auth/auto-signin?token=${token}&redirect=${encodeURIComponent(redirect)}`
    )

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/doctor/login')
    expect(location).toContain('verified=true')
  })

  it('handles magic link failure with admin redirect fallback', async () => {
    const token = 'valid-token-123'
    const userId = 'test-user-id'
    const email = 'admin@example.com'
    const redirect = '/admin/dashboard'
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    mockSingle.mockResolvedValue({
      data: {
        user_id: userId,
        email,
        expires_at: expiresAt.toISOString(),
        used: false,
      },
      error: null,
    })

    mockGenerateLink.mockResolvedValue({
      data: null,
      error: { message: 'Failed' },
    })

    const request = new Request(
      `http://localhost/api/auth/auto-signin?token=${token}&redirect=${encodeURIComponent(redirect)}`
    )

    const response = await GET(request)

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/admin/login')
    expect(location).toContain('verified=true')
  })
})
