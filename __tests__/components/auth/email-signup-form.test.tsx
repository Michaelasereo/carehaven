import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmailSignUpForm } from '@/components/auth/email-signup-form'
import { createClient } from '@/lib/supabase/client'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('EmailSignUpForm', () => {
  const mockPush = jest.fn()
  const mockSignUp = jest.fn()
  const mockSupabaseClient = {
    auth: {
      signUp: mockSignUp,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  })

  it('renders email signup form', () => {
    render(<EmailSignUpForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<EmailSignUpForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'ValidPass123!')
    await user.type(confirmPasswordInput, 'ValidPass123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('validates password requirements', async () => {
    const user = userEvent.setup()
    render(<EmailSignUpForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'short')

    // Check that password requirements are shown
    expect(screen.getByText(/password requirements/i)).toBeInTheDocument()
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
  })

  it('shows real-time password requirement feedback', async () => {
    const user = userEvent.setup()
    render(<EmailSignUpForm />)

    const passwordInput = screen.getByLabelText(/^password$/i)

    // Type password that meets all requirements
    await user.type(passwordInput, 'ValidPass123!')

    // Check all requirements are met (green checkmarks)
    const requirements = screen.getAllByText(/✓/)
    expect(requirements.length).toBeGreaterThan(0)
  })

  it('validates password confirmation match', async () => {
    const user = userEvent.setup()
    render(<EmailSignUpForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'ValidPass123!')
    await user.type(confirmPasswordInput, 'DifferentPass123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('disables submit until all validations pass', () => {
    render(<EmailSignUpForm />)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    expect(submitButton).toBeDisabled()
  })

  it('handles successful signup', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          email_confirmed_at: null,
        },
      },
      error: null,
    })

    render(<EmailSignUpForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'ValidPass123!')
    await user.type(confirmPasswordInput, 'ValidPass123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPass123!',
        options: {
          emailRedirectTo: undefined,
          data: {},
        },
      })
    })
  })

  it('handles duplicate email errors', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: {
        message: 'User already registered',
        status: 422,
      },
    })

    render(<EmailSignUpForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(emailInput, 'existing@example.com')
    await user.type(passwordInput, 'ValidPass123!')
    await user.type(confirmPasswordInput, 'ValidPass123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/account with this email already exists/i)).toBeInTheDocument()
    })
  })

  it('shows password visibility toggle', async () => {
    const user = userEvent.setup()
    render(<EmailSignUpForm />)

    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement
    const toggleButton = passwordInput.parentElement?.querySelector('button')

    expect(passwordInput.type).toBe('password')

    if (toggleButton) {
      await user.click(toggleButton)
      expect(passwordInput.type).toBe('text')
    }
  })

  it('redirects after successful signup', async () => {
    const user = userEvent.setup()
    const mockRouter = require('next/navigation')
    mockSignUp.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          email_confirmed_at: null,
        },
      },
      error: null,
    })

    render(<EmailSignUpForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'ValidPass123!')
    await user.type(confirmPasswordInput, 'ValidPass123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockRouter.useRouter().push).toHaveBeenCalledWith(
        expect.stringContaining('/auth/verify-email')
      )
    })
  })
})
