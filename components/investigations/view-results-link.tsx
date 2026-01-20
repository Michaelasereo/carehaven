'use client'

import { useState } from 'react'
import { createClient, getValidSession } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useAuthSession } from '@/components/auth/auth-session-provider'

interface ViewResultsLinkProps {
  filePath: string
  label?: string
  variant?: 'link' | 'outline' | 'default'
}

export function ViewResultsLink({ filePath, label = 'View Results', variant = 'link' }: ViewResultsLinkProps) {
  const supabase = createClient()
  const { addToast } = useToast()
  const { syncSession } = useAuthSession()
  const [loading, setLoading] = useState(false)

  const normalizeStorageObjectPath = (raw: string) => {
    let p = (raw || '').trim()

    // If a full Supabase Storage URL was stored, extract the object name portion.
    // Examples:
    // - .../storage/v1/object/public/investigations/<objectName>
    // - .../storage/v1/object/sign/investigations/<objectName>
    const urlMatch = p.match(/\/storage\/v1\/object\/(?:public|sign)\/investigations\/(.+)$/)
    if (urlMatch?.[1]) p = urlMatch[1]

    // Strip any leading slashes.
    p = p.replace(/^\/+/, '')

    // Some older data stored "investigations/<objectName>" (or even "investigations/investigations/<objectName>").
    // createSignedUrl expects objectName relative to the bucket root.
    while (p.startsWith('investigations/')) {
      p = p.slice('investigations/'.length)
    }

    return p
  }

  /**
   * Attempts to get a valid access token with multiple fallback strategies:
   * 1. Try getValidSession() (checks localStorage + refresh if needed)
   * 2. Try explicit refresh
   * 3. Try syncing session from server cookies
   */
  const getAccessToken = async (debug: boolean): Promise<string | null> => {
    // Strategy 1: Get valid session from localStorage
    let session = await getValidSession()
    if (session?.access_token) {
      if (debug) console.log('[ViewResultsLink] Got session from getValidSession')
      return session.access_token
    }

    // Strategy 2: Try explicit refresh
    if (debug) console.log('[ViewResultsLink] No session, trying refresh...')
    const { data: { session: refreshedSession }, error: refreshError } = 
      await supabase.auth.refreshSession()
    
    if (!refreshError && refreshedSession?.access_token) {
      if (debug) console.log('[ViewResultsLink] Got session from refresh')
      return refreshedSession.access_token
    }
    
    if (refreshError && debug) {
      console.warn('[ViewResultsLink] Refresh error:', refreshError.message)
    }

    // Strategy 3: Sync session from server cookies
    if (debug) console.log('[ViewResultsLink] Trying to sync session from server...')
    const synced = await syncSession()
    
    if (synced) {
      // After sync, try to get session again
      const { data: { session: syncedSession } } = await supabase.auth.getSession()
      if (syncedSession?.access_token) {
        if (debug) console.log('[ViewResultsLink] Got session after server sync')
        return syncedSession.access_token
      }
    }

    if (debug) console.warn('[ViewResultsLink] All session retrieval strategies failed')
    return null
  }

  const handleClick = async () => {
    setLoading(true)
    try {
      const normalizedPath = normalizeStorageObjectPath(filePath)
      const debug = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_STORAGE === '1'
      
      if (debug) {
        console.log('[ViewResultsLink]', { filePath, normalizedPath })
      }

      // Get access token with retry strategies
      const accessToken = await getAccessToken(debug)
      
      if (!accessToken) {
        throw new Error('Your session has expired. Please refresh the page or sign in again.')
      }

      // Server-side signing (service role) with explicit access check.
      // This avoids Storage-RLS masking (often returned as "Object not found").
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 10_000)
      
      const res = await fetch('/api/investigations/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ filePath: normalizedPath }),
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timeout))
      
      const payload = await res.json().catch(() => ({}))

      if (!res.ok || !payload?.signedUrl) {
        if (debug) console.warn('[ViewResultsLink] signed-url api error:', payload)
        
        // Handle specific error cases with improved messages
        if (res.status === 401) {
          throw new Error('Your session has expired. Please refresh the page or sign in again.')
        } else if (res.status === 403) {
          throw new Error('You do not have permission to view this file.')
        } else if (res.status === 404) {
          // Check if this is a "file not found in storage" error (test data scenario)
          if (payload?.error === 'File not found in storage' || payload?.message?.includes('test data')) {
            throw new Error(
              payload?.message || 
              'This investigation result file is not available. It may be test data or the file may have been removed.'
            )
          } else {
            // Generic 404 - investigation or file not found
            throw new Error(
              payload?.message || 
              'The file could not be found. It may have been deleted or the investigation may not exist.'
            )
          }
        } else {
          throw new Error(payload?.message || payload?.error || 'Could not generate download link. Please try again.')
        }
      }

      window.open(payload.signedUrl, '_blank', 'noopener,noreferrer')
    } catch (err: any) {
      console.error('Error creating signed URL:', err)
      
      let message: string
      let title = 'Unable to Open File'
      
      // Distinguish between different error types
      if (err?.name === 'AbortError') {
        message = 'Request timed out. Please check your connection and try again.'
        title = 'Request Timeout'
      } else if (err?.message?.includes('sign in') || err?.message?.includes('session')) {
        message = err.message
        title = 'Authentication Required'
      } else if (err?.message?.includes('test data') || err?.message?.includes('not available')) {
        message = err.message
        title = 'File Not Available'
      } else if (err?.message?.includes('permission') || err?.message?.includes('Forbidden')) {
        message = err.message
        title = 'Access Denied'
      } else if (err?.message?.includes('not found') || err?.message?.includes('deleted')) {
        message = err.message
        title = 'File Not Found'
      } else {
        message = err?.message || 'An unexpected error occurred. Please try again.'
      }
      
      addToast({
        variant: 'destructive',
        title,
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Map to Button variants we have; link styling uses Button variant="link" typically.
  const buttonVariant =
    variant === 'outline' ? 'outline' : variant === 'default' ? 'default' : 'link'

  return (
    <Button
      type="button"
      variant={buttonVariant as any}
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={buttonVariant === 'link' ? 'p-0 h-auto text-teal-600 hover:text-teal-700' : undefined}
    >
      {loading ? 'Opening…' : label}
    </Button>
  )
}
