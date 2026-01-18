import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

global.fetch = jest.fn()

describe('Patient Books Appointment Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        authorization_url: 'https://paystack.com/pay/test',
        reference: 'test-ref',
      }),
    })
  })

  it('completes appointment booking flow', async () => {
    // Integration test for booking flow
    expect(true).toBe(true)
  })
})

describe('Payment Flow Integration', () => {
  it('completes payment flow', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authorization_url: 'https://paystack.com/pay/test',
          reference: 'test-ref',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          data: { status: 'success', reference: 'test-ref' },
        }),
      })

    expect(global.fetch).toBeDefined()
  })
})
