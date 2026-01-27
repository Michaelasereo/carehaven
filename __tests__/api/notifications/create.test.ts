import { POST } from '@/app/api/notifications/create/route'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/notifications/create', () => ({
  createNotification: jest.fn(),
}))

describe('POST /api/notifications/create', () => {
  const mockGetUser = jest.fn()
  const mockFrom = jest.fn()
  const mockSelect = jest.fn()
  const mockEq = jest.fn()
  const mockSingle = jest.fn()

  const mockSupabaseClient = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSingle.mockResolvedValue({ data: { role: 'patient' }, error: null })
    mockFrom.mockReturnValue({ select: mockSelect })
    const { createNotification } = require('@/lib/notifications/create')
    createNotification.mockResolvedValue(undefined)
  })

  it('validates request', async () => {
    const request = new Request('http://localhost/api/notifications/create', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('creates notification', async () => {
    const request = new Request('http://localhost/api/notifications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user-id',
        type: 'appointment',
        title: 'Test',
        body: 'Test body',
      }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
