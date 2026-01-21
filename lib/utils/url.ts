/**
 * Get the correct base URL for redirects
 * 
 * On Netlify, request.url can return the internal deploy URL instead of
 * the custom domain. This function ensures we always use the production
 * URL in production environments.
 */
export function getBaseUrl(request: Request): string {
  // In production, always use the configured app URL if available
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Check x-forwarded-host header (set by Netlify/proxies)
  // This header contains the original hostname the client requested
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  
  if (forwardedHost) {
    // Use the forwarded host but prefer https in production
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : forwardedProto
    return `${protocol}://${forwardedHost}`
  }
  
  // Fallback to request.url origin
  return new URL(request.url).origin
}
