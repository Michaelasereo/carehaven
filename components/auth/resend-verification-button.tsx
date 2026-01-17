'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Mail } from 'lucide-react'

interface ResendVerificationButtonProps {
  email: string
}

export function ResendVerificationButton({ email }: ResendVerificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const supabase = createClient()

  const handleResend = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      // Use our custom email sending API instead of Supabase
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Error resending verification email:', result.error)
        setMessage(result.error || 'Failed to send verification email')
      } else {
        setMessage('Verification email sent! Please check your inbox (and spam folder).')
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setMessage('Failed to send verification email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleResend}
        disabled={isLoading}
        variant="outline"
        className="w-full"
      >
        <Mail className="h-4 w-4 mr-2" />
        {isLoading ? 'Sending...' : 'Resend Verification Email'}
      </Button>
      {message && (
        <p className={`text-sm text-center ${message.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
