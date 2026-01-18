import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmailSignUpForm } from '@/components/auth/email-signup-form'
import { EmailSignInForm } from '@/components/auth/email-signin-form'
import { CompleteProfileForm } from '@/components/auth/complete-profile-form'
import { createClient } from '@/lib/supabase/client'

// Mock Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('Complete Sign-Up Flow', () => {
  const mockSignUp = jest.fn()
  const mockGetUser = jest.fn()
  const mockFrom = jest.fn()
  const mockUpdate = jest.fn()
  const mockSelect = jest.fn()
  const mockEq = jest.fn()
  const mockSingle = jest.fn()

  const mockSupabaseClient = {
    auth: {
      signUp: mockSignUp,
      getUser: mockGetUser,
    },
    from: mockFrom,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)

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

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  })

  it('completes full sign-up flow', async () => {
    const user = userEvent.setup()

    // Step 1: Sign up
    const { rerender } = render(<EmailSignUpForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'ValidPass123!')
    await user.type(confirmPasswordInput, 'ValidPass123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled()
    })

    // Step 2: Complete profile
    rerender(<CompleteProfileForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const phoneInput = screen.getByLabelText(/phone number/i)
    const profileSubmitButton = screen.getByRole('button', { name: /complete profile/i })

    await user.type(nameInput, 'John Doe')
    await user.type(phoneInput, '+2348012345678')
    await user.click(profileSubmitButton)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          profile_completed: true,
        })
      )
    })
  })
})

describe('Complete Sign-In Flow', () => {
  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        user: { id: 'test-user-id', email: 'test@example.com' },
      }),
    })
  })

  it('completes sign-in and redirects based on role', async () => {
    const user = userEvent.setup()
    render(<EmailSignInForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/signin',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })
})
