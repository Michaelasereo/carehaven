import { BookAppointmentForm } from '@/components/patient/book-appointment-form'

export default function BookAppointmentPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Book an Appointment</h1>
      <p className="text-gray-600">
        Connect with licensed healthcare professionals via secure video consultations. 
        Get prescriptions, request investigations, and manage your health—all from one platform.
      </p>
      <BookAppointmentForm />
    </div>
  )
}

