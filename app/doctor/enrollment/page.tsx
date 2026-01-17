import { Footer } from '@/components/layout/Footer'
import { DoctorEnrollmentForm } from '@/components/enrollment/doctor-enrollment-form'

export default function DoctorEnrollmentPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <DoctorEnrollmentForm />
      </main>
      <Footer />
    </div>
  )
}
