import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Minimal middleware - NO external dependencies, NO Edge Runtime issues
// Auth will be handled in individual route handlers
export function middleware(request: NextRequest) {
  // Just pass through for now - no auth checks
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
  // Explicitly NOT using Edge Runtime to avoid eval() issues
}
