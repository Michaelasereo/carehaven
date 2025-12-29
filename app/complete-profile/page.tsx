import { CompleteProfileForm } from '@/components/auth/complete-profile-form'

export default function CompleteProfilePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="mt-2 text-gray-600">Please provide some additional information to get started</p>
        </div>
        <CompleteProfileForm />
      </div>
    </div>
  )
}

