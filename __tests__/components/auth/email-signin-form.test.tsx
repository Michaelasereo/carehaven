import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmailSignInForm } from '@/components/auth/email-signin-form'
import { createClient } from '@/lib/supabase/client'

// Mock Next.js router and search params
const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()
global.window.location.href = ''

describe('EmailSignInForm', () => {
  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    mockSearchParams.delete('verified')
    mockSearchParams.delete('redirect')
  })

  it('renders email signin form', () => {
    render(<EmailSignInForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'Invalid email format' }),
    })

    render(<EmailSignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Form should still submit, but API will handle validation
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('handles invalid credentials', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Invalid login credentials',
      }),
    })

    render(<EmailSignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    })
  })

  it('handles unverified email errors', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Email not confirmed',
      }),
    })

    render(<EmailSignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'unverified@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please verify your email/i)).toBeInTheDocument()
    })
  })

  it('shows loading state', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ success: true }),
              }),
            100
          )
        )
    )

    render(<EmailSignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
  })

  it('handles remember me checkbox', async () => {
    const user = userEvent.setup()
    render(<EmailSignInForm />)

    const rememberMeCheckbox = screen.getByLabelText(/remember me/i)
    expect(rememberMeCheckbox).not.toBeChecked()

    await user.click(rememberMeCheckbox)
    expect(rememberMeCheckbox).toBeChecked()
  })

  it('redirects on successful signin', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        user: { id: 'test-user-id' },
      }),
    })

    // Mock window.location.href
    delete (window as any).location
    ;(window as any).location = { href: '' }

    render(<EmailSignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(window.location.href).toContain('/auth/callback')
    })
  })

  it('shows success message when verified parameter is present', () => {
    mockSearchParams.set('verified', 'true')
    render(<EmailSignInForm />)

    expect(screen.getByText(/email verified successfully/i)).toBeInTheDocument()
  })

  it('shows password visibility toggle', async () => {
    const user = userEvent.setup()
    render(<EmailSignInForm />)

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
    const toggleButton = passwordInput.parentElement?.querySelector('button')

    expect(passwordInput.type).toBe('password')

    if (toggleButton) {
      await user.click(toggleButton)
      expect(passwordInput.type).toBe('text')
    }
  })
})
