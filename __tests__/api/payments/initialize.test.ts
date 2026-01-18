import { POST } from '@/app/api/payments/initialize/route'
import { createClient } from '@/lib/supabase/server'
import { initializePayment } from '@/lib/paystack/client'

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/paystack/client', () => ({
  initializePayment: jest.fn(),
}))

describe('POST /api/payments/initialize', () => {
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
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSingle.mockResolvedValue({
      data: { id: 'test-appointment-id', amount: '20000.00' },
      error: null,
    })
    mockFrom.mockReturnValue({ select: mockSelect })
    ;(initializePayment as jest.Mock).mockResolvedValue({
      status: true,
      data: {
        authorization_url: 'https://paystack.com/pay/test',
        reference: 'test-ref',
      },
    })
  })

  it('validates request', async () => {
    const request = new Request('http://localhost/api/payments/initialize', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('initializes Paystack payment', async () => {
    const request = new Request('http://localhost/api/payments/initialize', {
      method: 'POST',
      body: JSON.stringify({ appointmentId: 'test-appointment-id', amount: 20000 }),
    })
    const response = await POST(request)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.authorization_url).toBeDefined()
  })
})
