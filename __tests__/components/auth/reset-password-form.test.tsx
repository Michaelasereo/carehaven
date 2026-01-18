import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
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

describe('ResetPasswordForm', () => {
  const mockGetSession = jest.fn()
  const mockUpdateUser = jest.fn()
  const mockSupabaseClient = {
    auth: {
      getSession: mockGetSession,
      updateUser: mockUpdateUser,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          user: { id: 'test-user-id' },
        },
      },
      error: null,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders reset password form', () => {
    render(<ResetPasswordForm />)
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
  })

  it('validates password requirements', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordForm />)

    const passwordInput = screen.getByLabelText(/new password/i)
    await user.type(passwordInput, 'short')

    expect(screen.getByText(/password requirements/i)).toBeInTheDocument()
  })

  it('validates token from URL', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    render(<ResetPasswordForm />)

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired reset link/i)).toBeInTheDocument()
    })
  })

  it('handles password reset', async () => {
    const user = userEvent.setup()
    mockUpdateUser.mockResolvedValue({ error: null })

    render(<ResetPasswordForm />)

    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })

    await user.type(passwordInput, 'NewPass123!')
    await user.type(confirmPasswordInput, 'NewPass123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'NewPass123!',
      })
    })
  })

  it('shows success/error messages', async () => {
    const user = userEvent.setup()
    mockUpdateUser.mockResolvedValue({ error: null })

    render(<ResetPasswordForm />)

    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })

    await user.type(passwordInput, 'NewPass123!')
    await user.type(confirmPasswordInput, 'NewPass123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument()
    })
  })

  it('handles expired token errors', async () => {
    const user = userEvent.setup()
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Token expired' },
    })

    render(<ResetPasswordForm />)

    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })

    await user.type(passwordInput, 'NewPass123!')
    await user.type(confirmPasswordInput, 'NewPass123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/reset link has expired/i)).toBeInTheDocument()
    })
  })

  it('redirects to signin after successful reset', async () => {
    const user = userEvent.setup()
    mockUpdateUser.mockResolvedValue({ error: null })

    render(<ResetPasswordForm />)

    const passwordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /reset password/i })

    await user.type(passwordInput, 'NewPass123!')
    await user.type(confirmPasswordInput, 'NewPass123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument()
    })

    jest.advanceTimersByTime(2000)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/signin')
    })
  })
})
