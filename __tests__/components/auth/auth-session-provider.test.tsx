import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthSessionProvider, useAuthSession } from '@/components/auth/auth-session-provider'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

// Test component to access context
function TestConsumer() {
  const { isSessionReady, syncSession } = useAuthSession()
  return (
    <div>
      <span data-testid="session-ready">{isSessionReady ? 'ready' : 'not-ready'}</span>
      <button onClick={() => syncSession()} data-testid="sync-button">
        Sync
      </button>
    </div>
  )
}

describe('AuthSessionProvider', () => {
  const mockGetSession = jest.fn()
  const mockSetSession = jest.fn()
  const mockOnAuthStateChange = jest.fn()
  const mockUnsubscribe = jest.fn()

  const mockSupabaseClient = {
    auth: {
      getSession: mockGetSession,
      setSession: mockSetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })
  })

  it('renders children', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    })

    render(
      <AuthSessionProvider>
        <div data-testid="child">Child Content</div>
      </AuthSessionProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('does not call API when client session exists', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'existing-token' } },
    })

    render(
      <AuthSessionProvider>
        <TestConsumer />
      </AuthSessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('session-ready')).toHaveTextContent('ready')
    })

    // Should not call fetch since client already has session
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('syncs session from server when localStorage is empty', async () => {
    // First call: no session in localStorage
    mockGetSession.mockResolvedValue({
      data: { session: null },
    })

    // Mock server response with tokens
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'server-access-token',
        refresh_token: 'server-refresh-token',
      }),
    })

    mockSetSession.mockResolvedValue({ error: null })

    render(
      <AuthSessionProvider>
        <TestConsumer />
      </AuthSessionProvider>
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      })
    })

    await waitFor(() => {
      expect(mockSetSession).toHaveBeenCalledWith({
        access_token: 'server-access-token',
        refresh_token: 'server-refresh-token',
      })
    })
  })

  it('handles API errors gracefully', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    })

    render(
      <AuthSessionProvider>
        <TestConsumer />
      </AuthSessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('session-ready')).toHaveTextContent('ready')
    })

    // Should not throw error, just continue without session
    expect(mockSetSession).not.toHaveBeenCalled()
  })

  it('handles setSession errors gracefully', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'server-access-token',
        refresh_token: 'server-refresh-token',
      }),
    })

    mockSetSession.mockResolvedValue({
      error: { message: 'Invalid token' },
    })

    render(
      <AuthSessionProvider>
        <TestConsumer />
      </AuthSessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('session-ready')).toHaveTextContent('ready')
    })

    // Should still mark as ready even if setSession fails
  })

  it('does not sync when server returns no tokens', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ session: null }),
    })

    render(
      <AuthSessionProvider>
        <TestConsumer />
      </AuthSessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('session-ready')).toHaveTextContent('ready')
    })

    expect(mockSetSession).not.toHaveBeenCalled()
  })

  it('subscribes to auth state changes', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    })

    render(
      <AuthSessionProvider>
        <TestConsumer />
      </AuthSessionProvider>
    )

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled()
    })
  })

  it('unsubscribes from auth state changes on unmount', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    })

    const { unmount } = render(
      <AuthSessionProvider>
        <TestConsumer />
      </AuthSessionProvider>
    )

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled()
    })

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it('provides syncSession function via context', async () => {
    // Initial: no session
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
    })

    // After sync: has session
    mockGetSession.mockResolvedValueOnce({
      data: { session: { access_token: 'synced-token' } },
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'server-access-token',
        refresh_token: 'server-refresh-token',
      }),
    })

    mockSetSession.mockResolvedValue({ error: null })

    render(
      <AuthSessionProvider>
        <TestConsumer />
      </AuthSessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('session-ready')).toHaveTextContent('ready')
    })

    // syncSession should be available and callable
    const syncButton = screen.getByTestId('sync-button')
    expect(syncButton).toBeInTheDocument()
  })
})
