import { Suspense } from 'react'
import { AdminSignInForm } from '@/components/auth/admin-signin-form'

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/carehaven-logo.svg"
              alt="Care Haven Logo"
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
          <p className="mt-2 text-gray-600">Sign in to access the admin dashboard</p>
        </div>
        
        <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
          <AdminSignInForm />
        </Suspense>
      </div>
    </div>
  )
}
