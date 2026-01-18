import { initializePayment, verifyPayment } from '@/lib/paystack/client'

// Mock fetch
global.fetch = jest.fn()

describe('Paystack client', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      PAYSTACK_SECRET_KEY: 'test-secret-key',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    }
    jest.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('initializePayment', () => {
    it('initializes payment correctly', async () => {
      const mockResponse = {
        status: true,
        data: {
          authorization_url: 'https://paystack.com/pay/test',
          reference: 'test-ref',
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await initializePayment(20000, 'test@example.com', 'test-ref')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.paystack.co/transaction/initialize',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-secret-key',
          }),
          body: expect.stringContaining('2000000'), // Amount in kobo
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('converts amount to kobo correctly', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      await initializePayment(20000, 'test@example.com', 'test-ref')

      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body
      )
      expect(callBody.amount).toBe(2000000) // 20000 NGN * 100
    })

    it('handles API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      })

      await expect(
        initializePayment(20000, 'test@example.com', 'test-ref')
      ).rejects.toThrow('Failed to initialize payment')
    })
  })

  describe('verifyPayment', () => {
    it('verifies payment status', async () => {
      const mockResponse = {
        status: true,
        data: {
          status: 'success',
          reference: 'test-ref',
          amount: 2000000,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await verifyPayment('test-ref')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.paystack.co/transaction/verify/test-ref',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-secret-key',
          }),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('handles API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      })

      await expect(verifyPayment('test-ref')).rejects.toThrow(
        'Failed to verify payment'
      )
    })
  })
})
