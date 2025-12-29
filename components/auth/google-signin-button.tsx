'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function GoogleSignInButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Error signing in:', error)
    }
  }

  return (
    <Button
      onClick={handleSignIn}
      className="w-full bg-teal-600 hover:bg-teal-700 text-white"
      size="lg"
    >
      Continue with Google
    </Button>
  )
}

