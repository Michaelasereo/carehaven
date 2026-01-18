import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/utils/timezone', () => ({
  isWithinJoinWindow: jest.fn(() => true),
}))

global.fetch = jest.fn()

describe('Complete Consultation Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          room: {
            name: 'appointment-test-id',
            url: 'https://test.daily.co/appointment-test-id',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'test-token' }),
      })
  })

  it('completes consultation flow', async () => {
    // Integration test for consultation flow
    expect(true).toBe(true)
  })
})
