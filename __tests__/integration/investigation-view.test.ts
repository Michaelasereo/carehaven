import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewResultsLink } from '@/components/investigations/view-results-link'
import { AuthSessionProvider } from '@/components/auth/auth-session-provider'
import { createClient, getValidSession } from '@/lib/supabase/client'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
  getValidSession: jest.fn(),
}))

// Mock toast
const mockAddToast = jest.fn()
jest.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}))

// Mock fetch and window.open
global.fetch = jest.fn()
const mockWindowOpen = jest.fn()
window.open = mockWindowOpen

describe('Investigation View Integration', () => {
  const mockGetSession = jest.fn()
  const mockSetSession = jest.fn()
  const mockRefreshSession = jest.fn()
  const mockOnAuthStateChange = jest.fn()
  const mockUnsubscribe = jest.fn()

  const mockSupabaseClient = {
    auth: {
      getSession: mockGetSession,
      setSession: mockSetSession,
      refreshSession: mockRefreshSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }

  // Render ViewResultsLink with AuthSessionProvider
  function renderWithProvider(filePath: string) {
    return render(
      <AuthSessionProvider>
        <ViewResultsLink filePath={filePath} />
      </AuthSessionProvider>
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })
    process.env.NODE_ENV = 'test'
  })

  describe('Session Sync Flow', () => {
    it('syncs session from server and allows file viewing', async () => {
      const user = userEvent.setup()

      // Initial state: no session in localStorage
      mockGetSession.mockResolvedValue({
        data: { session: null },
      })
      ;(getValidSession as jest.Mock).mockResolvedValue(null)

      // Server returns session tokens
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'server-access-token',
            refresh_token: 'server-refresh-token',
          }),
        })
        // Signed URL request
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            signedUrl: 'https://storage.example.com/signed-file.pdf',
          }),
        })

      mockSetSession.mockResolvedValue({ error: null })
      
      // After sync, refresh succeeds
      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      // After sync, getSession returns token
      mockGetSession.mockResolvedValueOnce({
        data: { session: { access_token: 'server-access-token' } },
      })

      renderWithProvider('investigation-123/results.pdf')

      // Wait for provider to sync session
      await waitFor(() => {
        expect(mockSetSession).toHaveBeenCalledWith({
          access_token: 'server-access-token',
          refresh_token: 'server-refresh-token',
        })
      })

      // Now click view results
      ;(getValidSession as jest.Mock).mockResolvedValue({
        access_token: 'server-access-token',
      })

      const button = screen.getByRole('button', { name: /view results/i })
      await user.click(button)

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith(
          'https://storage.example.com/signed-file.pdf',
          '_blank',
          'noopener,noreferrer'
        )
      })
    })

    it('handles case where server also has no session', async () => {
      const user = userEvent.setup()

      // No session in localStorage
      mockGetSession.mockResolvedValue({
        data: { session: null },
      })
      ;(getValidSession as jest.Mock).mockResolvedValue(null)

      // Server also returns no session
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ session: null }),
      })

      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      renderWithProvider('investigation-123/results.pdf')

      // Wait for initial sync attempt
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        })
      })

      // Click view results should fail
      const button = screen.getByRole('button', { name: /view results/i })
      await user.click(button)

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Unable to Open File',
          description: expect.stringContaining('session'),
        })
      })

      // Window.open should not be called
      expect(mockWindowOpen).not.toHaveBeenCalled()
    })
  })

  describe('Authenticated User Flow', () => {
    it('allows viewing when session already exists', async () => {
      const user = userEvent.setup()

      // Session already in localStorage
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'existing-token' } },
      })
      ;(getValidSession as jest.Mock).mockResolvedValue({
        access_token: 'existing-token',
      })

      // Signed URL request
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          signedUrl: 'https://storage.example.com/signed-file.pdf',
        }),
      })

      renderWithProvider('investigation-123/results.pdf')

      const button = screen.getByRole('button', { name: /view results/i })
      await user.click(button)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/investigations/signed-url',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              Authorization: 'Bearer existing-token',
            }),
          })
        )
      })

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith(
          'https://storage.example.com/signed-file.pdf',
          '_blank',
          'noopener,noreferrer'
        )
      })
    })

    it('handles forbidden access gracefully', async () => {
      const user = userEvent.setup()

      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'existing-token' } },
      })
      ;(getValidSession as jest.Mock).mockResolvedValue({
        access_token: 'existing-token',
      })

      // API returns forbidden
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      })

      renderWithProvider('investigation-123/results.pdf')

      const button = screen.getByRole('button', { name: /view results/i })
      await user.click(button)

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Unable to Open File',
          description: expect.stringContaining('permission'),
        })
      })
    })

    it('handles file not found gracefully', async () => {
      const user = userEvent.setup()

      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'existing-token' } },
      })
      ;(getValidSession as jest.Mock).mockResolvedValue({
        access_token: 'existing-token',
      })

      // API returns not found
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Investigation not found' }),
      })

      renderWithProvider('investigation-123/results.pdf')

      const button = screen.getByRole('button', { name: /view results/i })
      await user.click(button)

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Unable to Open File',
          description: expect.stringContaining('not be found'),
        })
      })
    })
  })

  describe('Path Normalization', () => {
    it('handles various file path formats', async () => {
      const user = userEvent.setup()

      mockGetSession.mockResolvedValue({
        data: { session: { access_token: 'token' } },
      })
      ;(getValidSession as jest.Mock).mockResolvedValue({
        access_token: 'token',
      })

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ signedUrl: 'https://storage.example.com/signed' }),
      })

      const testCases = [
        {
          input: 'investigation-123/file.pdf',
          expected: 'investigation-123/file.pdf',
        },
        {
          input: 'investigations/investigation-123/file.pdf',
          expected: 'investigation-123/file.pdf',
        },
        {
          input: '/investigations/investigation-123/file.pdf',
          expected: 'investigation-123/file.pdf',
        },
        {
          input: 'https://test.supabase.co/storage/v1/object/public/investigations/investigation-123/file.pdf',
          expected: 'investigation-123/file.pdf',
        },
      ]

      for (const testCase of testCases) {
        jest.clearAllMocks()
        
        const { unmount } = renderWithProvider(testCase.input)

        const button = screen.getByRole('button', { name: /view results/i })
        await user.click(button)

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/investigations/signed-url',
            expect.objectContaining({
              body: JSON.stringify({ filePath: testCase.expected }),
            })
          )
        })

        unmount()
      }
    })
  })
})
