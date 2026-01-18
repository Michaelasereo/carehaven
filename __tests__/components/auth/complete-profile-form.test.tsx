import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CompleteProfileForm } from '@/components/auth/complete-profile-form'
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

describe('CompleteProfileForm', () => {
  const mockGetUser = jest.fn()
  const mockFrom = jest.fn()
  const mockUpdate = jest.fn()
  const mockSelect = jest.fn()
  const mockEq = jest.fn()
  const mockSingle = jest.fn()

  const mockSupabaseClient = {
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
      error: null,
    })

    mockUpdate.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockResolvedValue({ error: null })

    mockSelect.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockResolvedValue({
      data: { role: 'patient' },
      error: null,
    })
    mockSingle.mockResolvedValue({
      data: { role: 'patient' },
      error: null,
    })

    mockFrom.mockReturnValue({
      update: mockUpdate,
      select: mockSelect,
    })
  })

  it('renders profile completion form', () => {
    render(<CompleteProfileForm />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/gender/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<CompleteProfileForm />)

    const submitButton = screen.getByRole('button', { name: /complete profile/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument()
    })
  })

  it('validates phone number format', async () => {
    const user = userEvent.setup()
    render(<CompleteProfileForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const phoneInput = screen.getByLabelText(/phone number/i)
    const submitButton = screen.getByRole('button', { name: /complete profile/i })

    await user.type(nameInput, 'John Doe')
    await user.type(phoneInput, 'invalid-phone')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument()
    })
  })

  it('handles form submission for patient', async () => {
    const user = userEvent.setup()
    mockEq.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({
      data: { role: 'patient' },
      error: null,
    })

    render(<CompleteProfileForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const phoneInput = screen.getByLabelText(/phone number/i)
    const submitButton = screen.getByRole('button', { name: /complete profile/i })

    await user.type(nameInput, 'John Doe')
    await user.type(phoneInput, '+2348012345678')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/patient')
    })
  })

  it('handles form submission for doctor', async () => {
    const user = userEvent.setup()
    mockEq.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({
      data: { role: 'doctor' },
      error: null,
    })

    render(<CompleteProfileForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const phoneInput = screen.getByLabelText(/phone number/i)
    const submitButton = screen.getByRole('button', { name: /complete profile/i })

    await user.type(nameInput, 'Dr. Jane Smith')
    await user.type(phoneInput, '+2348012345678')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/doctor/dashboard')
    })
  })

  it('updates profile_completed flag', async () => {
    const user = userEvent.setup()
    mockEq.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({
      data: { role: 'patient' },
      error: null,
    })

    render(<CompleteProfileForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const phoneInput = screen.getByLabelText(/phone number/i)
    const submitButton = screen.getByRole('button', { name: /complete profile/i })

    await user.type(nameInput, 'John Doe')
    await user.type(phoneInput, '+2348012345678')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          profile_completed: true,
        })
      )
    })
  })

  it('redirects to signin if user not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    render(<CompleteProfileForm />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/signin')
    })
  })

  it('handles errors during profile update', async () => {
    const user = userEvent.setup()
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    mockEq.mockResolvedValueOnce({
      error: { message: 'Update failed' },
    })

    render(<CompleteProfileForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const phoneInput = screen.getByLabelText(/phone number/i)
    const submitButton = screen.getByRole('button', { name: /complete profile/i })

    await user.type(nameInput, 'John Doe')
    await user.type(phoneInput, '+2348012345678')
    await user.click(submitButton)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to update profile. Please try again.')
    })

    alertSpy.mockRestore()
  })
})
