import { createRoom, generateToken } from '@/lib/daily/client'

// Mock fetch
global.fetch = jest.fn()

describe('Daily.co client', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      DAILY_CO_API_KEY: 'test-api-key',
    }
    jest.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('createRoom', () => {
    it('creates Daily.co room', async () => {
      const mockRoom = {
        id: 'test-room-id',
        name: 'appointment-test-id',
        url: 'https://test.daily.co/appointment-test-id',
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockRoom,
      })

      const result = await createRoom('test-id', 30)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.daily.co/v1/rooms',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
          body: expect.stringContaining('appointment-test-id'),
        })
      )
      expect(result).toEqual(mockRoom)
    })

    it('validates room configuration', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      await createRoom('test-id', 30)

      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body
      )
      expect(callBody.config.hipaa_compliant).toBe(true)
      expect(callBody.config.enable_recording).toBe('cloud')
    })

    it('sets correct expiry times', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      await createRoom('test-id', 45)

      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body
      )
      const expiry = callBody.config.exp
      const now = Math.floor(Date.now() / 1000)
      const expectedExpiry = now + 45 * 120 // duration * 120 seconds
      expect(expiry).toBeGreaterThanOrEqual(expectedExpiry - 5) // Allow 5 second variance
      expect(expiry).toBeLessThanOrEqual(expectedExpiry + 5)
    })

    it('handles API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      })

      await expect(createRoom('test-id')).rejects.toThrow('Daily.co API error')
    })
  })

  describe('generateToken', () => {
    it('generates access token', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'test-token' }),
      })

      const result = await generateToken('test-room', 'test-user-id')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.daily.co/v1/meeting-tokens',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      )
      expect(result).toBe('test-token')
    })

    it('handles API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Bad Request',
      })

      await expect(generateToken('test-room', 'test-user')).rejects.toThrow(
        'Daily.co API error'
      )
    })
  })
})
