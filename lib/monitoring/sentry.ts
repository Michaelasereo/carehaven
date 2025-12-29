// Sentry monitoring - optional
// Install @sentry/nextjs to enable error tracking
export function initSentry() {
  // Placeholder - implement when Sentry is installed
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log('Sentry DSN configured but @sentry/nextjs not installed')
  }
}

// For now, just export no-op functions
export const captureException = (error: Error) => {
  console.error('Error (Sentry not configured):', error)
}

export const captureMessage = (message: string) => {
  console.log('Message (Sentry not configured):', message)
}

// Export a Sentry-like object for compatibility
export const Sentry = {
  captureException,
  captureMessage,
  init: initSentry,
}
