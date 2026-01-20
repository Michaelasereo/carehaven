import { GET } from '@/app/api/auth/session/route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('GET /api/auth/session', () => {
  const mockGetSession = jest.fn()
  const mockSupabaseClient = {
    auth: {
      getSession: mockGetSession,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
  })

  it('returns session tokens when user is authenticated', async () => {
    const mockSession = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'patient',
      },
    }

    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.access_token).toBe('test-access-token')
    expect(data.refresh_token).toBe('test-refresh-token')
    expect(data.expires_at).toBe(mockSession.expires_at)
    expect(data.user.id).toBe('test-user-id')
    expect(data.user.email).toBe('test@example.com')
  })

  it('returns null session when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.session).toBeNull()
    expect(data.access_token).toBeUndefined()
  })

  it('handles session errors gracefully', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Session expired' },
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.session).toBeNull()
    expect(data.error).toBe('Session expired')
  })

  it('handles unexpected errors', async () => {
    mockGetSession.mockRejectedValue(new Error('Database connection failed'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.session).toBeNull()
    expect(data.error).toBe('Internal server error')
  })

  it('only returns necessary user fields for security', async () => {
    const mockSession = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'patient',
        // These should NOT be returned
        phone: '+1234567890',
        created_at: '2024-01-01',
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: 'Test User' },
      },
    }

    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toEqual({
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'patient',
    })
    // Sensitive fields should not be present
    expect(data.user.phone).toBeUndefined()
    expect(data.user.app_metadata).toBeUndefined()
    expect(data.user.user_metadata).toBeUndefined()
  })
})
