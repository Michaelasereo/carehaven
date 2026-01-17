import { redirect } from 'next/navigation'

export default async function DoctorPage() {
  redirect('/doctor/dashboard')
}
