import { POST } from '@/app/api/daily/create-room/route'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/daily/client', () => ({
  createRoom: jest.fn(),
}))

describe('POST /api/daily/create-room', () => {
  const mockGetUser = jest.fn()
  const mockFrom = jest.fn()
  const mockSelect = jest.fn()
  const mockEq = jest.fn()
  const mockSingle = jest.fn()
  const mockUpdate = jest.fn()

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
    mockSingle.mockResolvedValue({
      data: { id: 'test-appointment-id' },
      error: null,
    })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate })
    const { createRoom } = require('@/lib/daily/client')
    createRoom.mockResolvedValue({
      name: 'appointment-test-appointment-id',
      url: 'https://test.daily.co/appointment-test-appointment-id',
    })
  })

  it('validates appointment ID', async () => {
    const request = new Request('http://localhost/api/daily/create-room', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('creates Daily.co room', async () => {
    const request = new Request('http://localhost/api/daily/create-room', {
      method: 'POST',
      body: JSON.stringify({ appointmentId: 'test-appointment-id' }),
    })
    const response = await POST(request)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.room).toBeDefined()
  })
})
