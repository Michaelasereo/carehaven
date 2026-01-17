import Image from 'next/image'
import { EmailSignInForm } from '@/components/auth/email-signin-form'
import Link from 'next/link'
import { Suspense } from 'react'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/carehaven%20logo.svg"
              alt="Care Haven Logo"
              width={200}
              height={64}
              className="h-16 w-auto"
              priority
              unoptimized
            />
          </div>
          <p className="mt-2 text-gray-600">Sign in to continue</p>
        </div>
        
        <Suspense fallback={<div>Loading...</div>}>
          <EmailSignInForm />
        </Suspense>
      </div>
    </div>
  )
}

