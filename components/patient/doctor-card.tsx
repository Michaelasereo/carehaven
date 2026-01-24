'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Stethoscope, Star, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getConsultationPriceClient } from '@/lib/admin/system-settings-client'

interface DoctorCardProps {
  doctor: {
    id: string
    full_name: string | null
    specialty: string | null
    bio: string | null
    consultation_fee: number | null
    avatar_url: string | null
    years_experience: number | string | null
  }
  onSelect?: (doctor: DoctorCardProps['doctor']) => void
}

export function DoctorCard({ doctor, onSelect }: DoctorCardProps) {
  const [universalPrice, setUniversalPrice] = useState<number | null>(null)

  useEffect(() => {
    // Fetch universal consultation price from system settings
    getConsultationPriceClient()
      .then(price => setUniversalPrice(price))
      .catch(error => {
        console.error('Error fetching universal consultation price:', error)
        // Fallback to doctor's fee if universal price fetch fails
        setUniversalPrice(null)
      })
  }, [])

  const initials = doctor.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'DR'

  const handleSelect = () => {
    if (onSelect) {
      onSelect(doctor)
    }
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={doctor.avatar_url || undefined} alt={doctor.full_name || 'Doctor'} />
          <AvatarFallback className="bg-teal-100 text-teal-700 text-lg font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {doctor.full_name || 'Dr. Unknown'}
              </h3>
              {doctor.specialty && (
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                  <Stethoscope className="h-3 w-3" />
                  {doctor.specialty}
                </p>
              )}
            </div>
          </div>

          {doctor.years_experience && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>
                {typeof doctor.years_experience === 'string'
                  ? doctor.years_experience === '1-5'
                    ? '1-5 years experience'
                    : doctor.years_experience === '>5'
                    ? '5+ years experience'
                    : `${doctor.years_experience} years experience`
                  : `${doctor.years_experience} years experience`}
              </span>
            </div>
          )}

          {doctor.bio && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-2">{doctor.bio}</p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Consultation Fee</p>
              <p className="font-semibold text-teal-600">
                {universalPrice !== null
                  ? formatCurrency(universalPrice, 'NGN')
                  : doctor.consultation_fee
                    ? formatCurrency(doctor.consultation_fee, 'NGN')
                    : 'N/A'}
              </p>
            </div>

            {onSelect && (
              <Button
                onClick={handleSelect}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Book
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

