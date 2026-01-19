import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check cookies and headers
 * Useful for debugging session creation issues
 */
export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, ...rest] = cookie.trim().split('=')
    if (name) {
      acc[name] = rest.join('=')
    }
    return acc
  }, {} as Record<string, string>)

  return NextResponse.json({
    cookies,
    cookieHeader,
    headers: {
      'user-agent': request.headers.get('user-agent'),
      'origin': request.headers.get('origin'),
      'referer': request.headers.get('referer'),
    },
    timestamp: new Date().toISOString(),
  })
}
