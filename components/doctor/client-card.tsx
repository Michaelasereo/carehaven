import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ClientCardProps {
  patient: any
}

export function ClientCard({ patient }: ClientCardProps) {
  const age = patient.date_of_birth
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : null

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            {patient.full_name}
            {age && ` ${age}yrs`}
            {patient.gender && ` ${patient.gender.charAt(0).toUpperCase()}`}
          </h3>
        </div>
        <Link href={`/doctor/patients/${patient.id}`}>
          <Button className="bg-teal-600 hover:bg-teal-700">
            View Session Details
          </Button>
        </Link>
      </div>
    </Card>
  )
}

