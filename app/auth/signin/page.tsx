import Image from 'next/image'
import { GoogleSignInButton } from '@/components/auth/google-signin-button'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/carehaven logo.svg"
              alt="Care Haven Logo"
              width={200}
              height={64}
              className="h-16 w-auto"
              priority
            />
          </div>
          <p className="mt-2 text-gray-600">Sign in to continue</p>
        </div>
        <div className="mt-8">
          <GoogleSignInButton />
        </div>
      </div>
    </div>
  )
}

