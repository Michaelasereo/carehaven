import Image from 'next/image'
import { Suspense } from 'react'
import { DoctorSignInForm } from '@/components/auth/doctor-signin-form'

export default function DoctorLoginPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">Doctor Portal</h1>
          <p className="mt-2 text-gray-600">Sign in to access the doctor dashboard</p>
        </div>
        
        <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
          <DoctorSignInForm />
        </Suspense>
      </div>
    </div>
  )
}
