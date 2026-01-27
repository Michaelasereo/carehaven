import {
  initializePayment,
  verifyPayment,
  refundTransaction,
} from '@/lib/paystack/client'

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
          body: expect.stringContaining('20000'), // Amount in kobo (client receives kobo)
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('passes amount in kobo as-is', async () => {
      const mockResponse = {
        status: true,
        data: { authorization_url: 'https://paystack.com/pay/test', reference: 'test-ref' },
      }
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      await initializePayment(20000, 'test@example.com', 'test-ref')

      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body
      )
      expect(callBody.amount).toBe(20000)
    })

    it('handles API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Failed to initialize payment' }),
      })

      await expect(
        initializePayment(20000, 'test@example.com', 'test-ref')
      ).rejects.toThrow(/Failed to initialize payment|Payment could not be started|Paystack/)
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
        json: async () => ({ message: 'Failed to verify payment' }),
      })

      await expect(verifyPayment('test-ref')).rejects.toThrow(
        'Failed to verify payment'
      )
    })
  })

  describe('refundTransaction', () => {
    it('refunds by reference', async () => {
      const mockResponse = { status: true, data: { id: 1, status: 'pending' } }
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await refundTransaction('txn-ref')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.paystack.co/refund',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-secret-key',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ transaction: 'txn-ref' }),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('includes amount when provided', async () => {
      const mockResponse = { status: true, data: {} }
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      await refundTransaction('txn-ref', 5000)

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.transaction).toBe('txn-ref')
      expect(body.amount).toBe(5000)
    })
  })
})
