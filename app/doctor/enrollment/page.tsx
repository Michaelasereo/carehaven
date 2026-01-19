import { redirect } from 'next/navigation'

/**
 * Redirect /doctor/enrollment to /doctor-enrollment for consistency
 * This maintains backward compatibility while using the primary public enrollment route
 */
export default function DoctorEnrollmentPage() {
  redirect('/doctor-enrollment')
}
