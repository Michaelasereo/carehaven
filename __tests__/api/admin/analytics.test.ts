import { GET } from '@/app/api/admin/analytics/route'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('GET /api/admin/analytics', () => {
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
      data: { user: { id: 'test-admin-id' } },
      error: null,
    })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSingle.mockResolvedValue({ data: { role: 'admin' }, error: null })
    mockFrom.mockReturnValue({ select: mockSelect })
  })

  it('validates admin role', async () => {
    mockSingle.mockResolvedValue({ data: { role: 'patient' }, error: null })
    const request = new Request('http://localhost/api/admin/analytics')
    const response = await GET(request)
    expect(response.status).toBe(403)
  })

  it('returns analytics data', async () => {
    const request = new Request('http://localhost/api/admin/analytics')
    const response = await GET(request)
    expect(response.status).toBe(200)
  })
})
