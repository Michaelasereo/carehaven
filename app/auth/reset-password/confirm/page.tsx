import Image from 'next/image'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default function ResetPasswordConfirmPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/carehaven-logo.svg"
              alt="Care Haven Logo"
              width={200}
              height={64}
              className="h-16 w-auto"
              priority
              unoptimized
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="mt-2 text-gray-600">Enter your new password below</p>
        </div>
        
        <ResetPasswordForm />
      </div>
    </div>
  )
}
