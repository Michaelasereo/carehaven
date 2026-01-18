'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-2xl font-bold text-gray-900">Something went wrong!</h2>
        <p className="text-gray-600">{error.message || 'An unexpected error occurred'}</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} className="bg-teal-600 hover:bg-teal-700">
            Try again
          </Button>
          <Button 
            onClick={() => router.push('/auth/signin')} 
            variant="outline"
          >
            Sign in again
          </Button>
        </div>
      </div>
    </div>
  )
}
