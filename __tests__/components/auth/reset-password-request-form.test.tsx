import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResetPasswordRequestForm } from '@/components/auth/reset-password-request-form'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

describe('ResetPasswordRequestForm', () => {
  const mockResetPasswordForEmail = jest.fn()
  const mockSupabaseClient = {
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    ;(window.location as any).origin = 'http://localhost:3000'
  })

  it('renders reset password request form', () => {
    render(<ResetPasswordRequestForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordRequestForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('sends reset password email', async () => {
    const user = userEvent.setup()
    mockResetPasswordForEmail.mockResolvedValue({ error: null })

    render(<ResetPasswordRequestForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/reset-password/confirm'),
        })
      )
    })
  })

  it('shows success message after sending email', async () => {
    const user = userEvent.setup()
    mockResetPasswordForEmail.mockResolvedValue({ error: null })

    render(<ResetPasswordRequestForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password reset email sent/i)).toBeInTheDocument()
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument()
    })
  })

  it('handles invalid email errors', async () => {
    const user = userEvent.setup()
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: 'User not found' },
    })

    render(<ResetPasswordRequestForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /send reset link/i })

    await user.type(emailInput, 'nonexistent@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument()
    })
  })
})
