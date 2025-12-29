export function logError(error: Error, context?: Record<string, any>) {
  console.error('Error:', error, context)
  
  // In production, send to Sentry or other error tracking service
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // Sentry.captureException(error, { extra: context })
  }
}

