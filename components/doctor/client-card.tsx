'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface ClientCardProps {
  patient: any
}

export function ClientCard({ patient }: ClientCardProps) {
  const [latestAppointment, setLatestAppointment] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchLatestAppointment = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('appointments')
        .select('id')
        .eq('patient_id', patient.id)
        .eq('doctor_id', user.id)
        .order('scheduled_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setLatestAppointment(data)
      }
    }

    fetchLatestAppointment()
  }, [patient.id, supabase])

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
        {latestAppointment ? (
          <Link href={`/doctor/appointments/${latestAppointment.id}`}>
            <Button className="bg-teal-600 hover:bg-teal-700">
              View Session Details
            </Button>
          </Link>
        ) : (
          <Button disabled variant="outline">
            No Appointments
          </Button>
        )}
      </div>
    </Card>
  )
}

