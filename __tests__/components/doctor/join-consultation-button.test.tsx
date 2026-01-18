import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JoinConsultationButton } from '@/components/doctor/join-consultation-button'
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

// Mock fetch
global.fetch = jest.fn()

describe('Doctor JoinConsultationButton', () => {
  const mockFrom = jest.fn()
  const mockSelect = jest.fn()
  const mockEq = jest.fn()
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
      },
      error: null,
    })

    mockUpdate.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockResolvedValue({ error: null })

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

  it('can start consultation before scheduled time with grace period', async () => {
    const user = userEvent.setup()
    // Mock that we're within grace period (15 minutes before)
    const { isWithinJoinWindow } = require('@/lib/utils/timezone')
    isWithinJoinWindow.mockReturnValue(true)

    render(<JoinConsultationButton appointmentId="test-appointment-id" />)

    await waitFor(() => {
      const joinButton = screen.getByText(/join consultation/i)
      expect(joinButton).toBeInTheDocument()
      expect(joinButton).not.toBeDisabled()
    })
  })

  it('shows rejoin button when consultation is in progress', async () => {
    mockSingle.mockResolvedValue({
      data: {
        scheduled_at: new Date().toISOString(),
        status: 'in_progress',
        daily_room_name: 'existing-room',
        daily_room_url: 'https://test.daily.co/existing-room',
      },
      error: null,
    })

    render(<JoinConsultationButton appointmentId="test-appointment-id" />)

    await waitFor(() => {
      expect(screen.getByText(/rejoin consultation/i)).toBeInTheDocument()
    })
  })
})
