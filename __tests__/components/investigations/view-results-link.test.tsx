import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewResultsLink } from '@/components/investigations/view-results-link'
import { createClient, getValidSession } from '@/lib/supabase/client'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
  getValidSession: jest.fn(),
}))

// Mock useAuthSession hook
const mockSyncSession = jest.fn()
jest.mock('@/components/auth/auth-session-provider', () => ({
  useAuthSession: () => ({
    isSessionReady: true,
    syncSession: mockSyncSession,
  }),
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

describe('ViewResultsLink', () => {
  const mockRefreshSession = jest.fn()
  const mockGetSession = jest.fn()

  const mockSupabaseClient = {
    auth: {
      refreshSession: mockRefreshSession,
      getSession: mockGetSession,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    process.env.NODE_ENV = 'test'
  })

  it('renders button with default label', () => {
    render(<ViewResultsLink filePath="test-id/file.pdf" />)
    expect(screen.getByRole('button', { name: /view results/i })).toBeInTheDocument()
  })

  it('renders button with custom label', () => {
    render(<ViewResultsLink filePath="test-id/file.pdf" label="Download PDF" />)
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument()
  })

  it('shows loading state when clicked', async () => {
    const user = userEvent.setup()
    
    ;(getValidSession as jest.Mock).mockResolvedValue({
      access_token: 'test-token',
    })

    ;(global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ signedUrl: 'https://example.com/signed' }),
              }),
            100
          )
        )
    )

    render(<ViewResultsLink filePath="test-id/file.pdf" />)

    const button = screen.getByRole('button', { name: /view results/i })
    await user.click(button)

    expect(screen.getByText(/opening/i)).toBeInTheDocument()
  })

  it('opens signed URL in new tab on success', async () => {
    const user = userEvent.setup()

    ;(getValidSession as jest.Mock).mockResolvedValue({
      access_token: 'test-token',
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ signedUrl: 'https://storage.example.com/signed-url' }),
    })

    render(<ViewResultsLink filePath="test-id/file.pdf" />)

    const button = screen.getByRole('button', { name: /view results/i })
    await user.click(button)

    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://storage.example.com/signed-url',
        '_blank',
        'noopener,noreferrer'
      )
    })
  })

  it('shows error toast when session is missing', async () => {
    const user = userEvent.setup()

    ;(getValidSession as jest.Mock).mockResolvedValue(null)
    mockRefreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'No session' },
    })
    mockSyncSession.mockResolvedValue(false)

    render(<ViewResultsLink filePath="test-id/file.pdf" />)

    const button = screen.getByRole('button', { name: /view results/i })
    await user.click(button)

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Unable to Open File',
        description: expect.stringContaining('session'),
      })
    })
  })

  it('retries with server sync when local session fails', async () => {
    const user = userEvent.setup()

    // First attempt: no session
    ;(getValidSession as jest.Mock).mockResolvedValue(null)
    
    // Refresh fails
    mockRefreshSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    
    // Sync succeeds
    mockSyncSession.mockResolvedValue(true)
    
    // After sync, getSession returns token
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'synced-token' } },
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ signedUrl: 'https://storage.example.com/signed-url' }),
    })

    render(<ViewResultsLink filePath="test-id/file.pdf" />)

    const button = screen.getByRole('button', { name: /view results/i })
    await user.click(button)

    await waitFor(() => {
      expect(mockSyncSession).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalled()
    })
  })

  it('handles 401 error from API', async () => {
    const user = userEvent.setup()

    ;(getValidSession as jest.Mock).mockResolvedValue({
      access_token: 'test-token',
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    })

    render(<ViewResultsLink filePath="test-id/file.pdf" />)

    const button = screen.getByRole('button', { name: /view results/i })
    await user.click(button)

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Unable to Open File',
        description: expect.stringContaining('session'),
      })
    })
  })

  it('handles 403 error from API', async () => {
    const user = userEvent.setup()

    ;(getValidSession as jest.Mock).mockResolvedValue({
      access_token: 'test-token',
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Forbidden' }),
    })

    render(<ViewResultsLink filePath="test-id/file.pdf" />)

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

  it('handles 404 error from API', async () => {
    const user = userEvent.setup()

    ;(getValidSession as jest.Mock).mockResolvedValue({
      access_token: 'test-token',
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    })

    render(<ViewResultsLink filePath="test-id/file.pdf" />)

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

  it('normalizes file path correctly', async () => {
    const user = userEvent.setup()

    ;(getValidSession as jest.Mock).mockResolvedValue({
      access_token: 'test-token',
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ signedUrl: 'https://storage.example.com/signed-url' }),
    })

    // Test with path that has "investigations/" prefix
    render(<ViewResultsLink filePath="investigations/test-id/file.pdf" />)

    const button = screen.getByRole('button', { name: /view results/i })
    await user.click(button)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/investigations/signed-url',
        expect.objectContaining({
          body: JSON.stringify({ filePath: 'test-id/file.pdf' }),
        })
      )
    })
  })

  it('handles full storage URL', async () => {
    const user = userEvent.setup()

    ;(getValidSession as jest.Mock).mockResolvedValue({
      access_token: 'test-token',
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ signedUrl: 'https://storage.example.com/signed-url' }),
    })

    // Test with full storage URL
    render(
      <ViewResultsLink filePath="https://test.supabase.co/storage/v1/object/public/investigations/test-id/file.pdf" />
    )

    const button = screen.getByRole('button', { name: /view results/i })
    await user.click(button)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/investigations/signed-url',
        expect.objectContaining({
          body: JSON.stringify({ filePath: 'test-id/file.pdf' }),
        })
      )
    })
  })

  it('disables button while loading', async () => {
    const user = userEvent.setup()

    ;(getValidSession as jest.Mock).mockResolvedValue({
      access_token: 'test-token',
    })

    ;(global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ signedUrl: 'https://example.com/signed' }),
              }),
            500
          )
        )
    )

    render(<ViewResultsLink filePath="test-id/file.pdf" />)

    const button = screen.getByRole('button', { name: /view results/i })
    await user.click(button)

    // Button should be disabled while loading
    expect(button).toBeDisabled()
  })

  it('renders with different variants', () => {
    const { rerender } = render(<ViewResultsLink filePath="test-id/file.pdf" variant="link" />)
    expect(screen.getByRole('button')).toHaveClass('text-teal-600')

    rerender(<ViewResultsLink filePath="test-id/file.pdf" variant="outline" />)
    // Should not have link-specific class
    expect(screen.getByRole('button')).not.toHaveClass('text-teal-600')

    rerender(<ViewResultsLink filePath="test-id/file.pdf" variant="default" />)
    expect(screen.getByRole('button')).not.toHaveClass('text-teal-600')
  })
})
