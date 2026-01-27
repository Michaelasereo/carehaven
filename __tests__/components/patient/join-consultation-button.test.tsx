import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JoinConsultationButton } from '@/components/patient/join-consultation-button'
import { createClient } from '@/lib/supabase/client'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

// Mock timezone utility
jest.mock('@/lib/utils/timezone', () => ({
  isWithinJoinWindow: jest.fn(() => true),
}))

const mockAddToast = jest.fn()
jest.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('JoinConsultationButton', () => {
  const mockFrom = jest.fn()
  const mockSelect = jest.fn()
  const mockEq = jest.fn()
  const mockEqUpdate = jest.fn()
  const mockSingle = jest.fn()
  const mockUpdate = jest.fn()
  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
  }

  const mockSupabaseClient = {
    from: mockFrom,
    channel: jest.fn(() => mockChannel),
    removeChannel: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)

    mockSelect.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockReturnValue({
      single: mockSingle,
    })
    mockSingle.mockResolvedValue({
      data: {
        scheduled_at: new Date(Date.now() + 3600000).toISOString(),
        status: 'confirmed',
        payment_status: 'paid',
      },
      error: null,
    })

    mockUpdate.mockReturnValue({
      eq: mockEqUpdate,
    })
    mockEqUpdate.mockResolvedValue({ error: null })

    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        room: { name: 'test-room', url: 'https://test.daily.co/test-room' },
        token: 'test-token',
      }),
    })
  })

  it('checks appointment status', async () => {
    render(<JoinConsultationButton appointmentId="test-appointment-id" />)

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('appointments')
    })
  })

  it('creates Daily.co room if needed', async () => {
    const user = userEvent.setup()
    mockSingle.mockResolvedValueOnce({
      data: {
        scheduled_at: new Date(Date.now() + 3600000).toISOString(),
        status: 'confirmed',
        payment_status: 'paid',
        daily_room_name: null,
      },
      error: null,
    })

    render(<JoinConsultationButton appointmentId="test-appointment-id" />)

    await waitFor(() => {
      const joinButton = screen.getByText(/join consultation/i)
      expect(joinButton).toBeInTheDocument()
    })

    const joinButton = screen.getByText(/join consultation/i)
    await user.click(joinButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/daily/create-room',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ appointmentId: 'test-appointment-id' }),
        })
      )
    })
  })

  it('generates access token', async () => {
    const user = userEvent.setup()
    mockSingle.mockResolvedValueOnce({
      data: {
        scheduled_at: new Date(Date.now() + 3600000).toISOString(),
        status: 'confirmed',
        payment_status: 'paid',
        daily_room_name: 'existing-room',
        daily_room_url: 'https://test.daily.co/existing-room',
      },
      error: null,
    })

    render(<JoinConsultationButton appointmentId="test-appointment-id" />)

    await waitFor(() => {
      const joinButton = screen.getByText(/join consultation/i)
      expect(joinButton).toBeInTheDocument()
    })

    const joinButton = screen.getByText(/join consultation/i)
    await user.click(joinButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/daily/get-token',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  it('redirects to video interface', async () => {
    const user = userEvent.setup()
    mockSingle.mockResolvedValueOnce({
      data: {
        scheduled_at: new Date(Date.now() + 3600000).toISOString(),
        status: 'confirmed',
        payment_status: 'paid',
        daily_room_name: 'existing-room',
        daily_room_url: 'https://test.daily.co/existing-room',
      },
      error: null,
    })

    render(<JoinConsultationButton appointmentId="test-appointment-id" />)

    await waitFor(() => {
      const joinButton = screen.getByText(/join consultation/i)
      expect(joinButton).toBeInTheDocument()
    })

    const joinButton = screen.getByText(/join consultation/i)
    await user.click(joinButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/consultation/test-appointment-id')
      )
    })
  })

  it('updates appointment status to in_progress', async () => {
    const user = userEvent.setup()
    mockSingle.mockResolvedValueOnce({
      data: {
        scheduled_at: new Date(Date.now() + 3600000).toISOString(),
        status: 'confirmed',
        payment_status: 'paid',
        daily_room_name: null,
      },
      error: null,
    })

    render(<JoinConsultationButton appointmentId="test-appointment-id" />)

    await waitFor(() => {
      const joinButton = screen.getByText(/join consultation/i)
      expect(joinButton).toBeInTheDocument()
    })

    const joinButton = screen.getByText(/join consultation/i)
    await user.click(joinButton)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'in_progress',
        daily_room_name: 'test-room',
        daily_room_url: 'https://test.daily.co/test-room',
      })
    })
  })

  it('handles errors', async () => {
    const user = userEvent.setup()
    mockSingle
      .mockResolvedValueOnce({
        data: {
          scheduled_at: new Date(Date.now() + 3600000).toISOString(),
          status: 'confirmed',
          payment_status: 'paid',
        },
        error: null,
      })
      .mockRejectedValueOnce(new Error('Failed to fetch'))

    render(<JoinConsultationButton appointmentId="test-appointment-id" />)

    await waitFor(() => {
      const joinButton = screen.getByText(/join consultation/i)
      expect(joinButton).toBeInTheDocument()
    })

    const joinButton = screen.getByText(/join consultation/i)
    await user.click(joinButton)

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: expect.any(String),
          description: expect.any(String),
        })
      )
    })
  })
})
