'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

interface AvailabilitySlot {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
  active: boolean
}

interface AvailabilityManagerProps {
  doctorId: string
  initialAvailability: any[]
  licenseVerified?: boolean
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function AvailabilityManager({ doctorId, initialAvailability, licenseVerified = true }: AvailabilityManagerProps) {
  const router = useRouter()
  const supabase = createClient()
  const { addToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isVerified, setIsVerified] = useState(licenseVerified)

  // Subscribe to verification status changes
  useEffect(() => {
    const channel = supabase
      .channel(`availability-verification-${doctorId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${doctorId}`,
        },
        (payload) => {
          const newData = payload.new as any
          if (newData.license_verified !== undefined) {
            setIsVerified(newData.license_verified)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [doctorId, supabase])
  
  // Group availability by day
  const [availability, setAvailability] = useState<Record<number, AvailabilitySlot[]>>(() => {
    const grouped: Record<number, AvailabilitySlot[]> = {}
    
    // Initialize all days
    for (let i = 0; i < 7; i++) {
      grouped[i] = []
    }
    
    // Populate with existing data
    initialAvailability.forEach((slot) => {
      if (!grouped[slot.day_of_week]) {
        grouped[slot.day_of_week] = []
      }
      grouped[slot.day_of_week].push({
        id: slot.id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time.substring(0, 5), // Extract HH:MM from time
        end_time: slot.end_time.substring(0, 5),
        active: slot.active,
      })
    })
    
    return grouped
  })

  const addSlot = (dayOfWeek: number) => {
    setAvailability((prev) => ({
      ...prev,
      [dayOfWeek]: [
        ...(prev[dayOfWeek] || []),
        {
          day_of_week: dayOfWeek,
          start_time: '09:00',
          end_time: '17:00',
          active: true,
        },
      ],
    }))
  }

  const removeSlot = (dayOfWeek: number, index: number) => {
    setAvailability((prev) => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].filter((_, i) => i !== index),
    }))
  }

  const updateSlot = (dayOfWeek: number, index: number, field: keyof AvailabilitySlot, value: any) => {
    setAvailability((prev) => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }))
  }

  const handleSave = async () => {
    if (!isVerified) {
      addToast({
        variant: 'destructive',
        title: 'Verification Required',
        description: 'You must be verified to set availability. Please contact admin.',
      })
      return
    }

    setIsSaving(true)
    try {
      // Get all slots
      const allSlots = Object.values(availability).flat()

      // Delete existing slots
      const existingIds = allSlots.filter(s => s.id).map(s => s.id!)
      if (existingIds.length > 0) {
        // Get current slots from DB
        const { data: currentSlots } = await supabase
          .from('doctor_availability')
          .select('id')
          .eq('doctor_id', doctorId)

        const idsToDelete = currentSlots
          ?.filter(s => !existingIds.includes(s.id))
          .map(s => s.id) || []

        if (idsToDelete.length > 0) {
          await supabase
            .from('doctor_availability')
            .delete()
            .in('id', idsToDelete)
        }
      } else {
        // Delete all if no slots
        await supabase
          .from('doctor_availability')
          .delete()
          .eq('doctor_id', doctorId)
      }

      // Upsert slots
      for (const slot of allSlots) {
        const slotData = {
          doctor_id: doctorId,
          day_of_week: slot.day_of_week,
          start_time: `${slot.start_time}:00`,
          end_time: `${slot.end_time}:00`,
          active: slot.active,
        }

        if (slot.id) {
          // Update existing
          await supabase
            .from('doctor_availability')
            .update(slotData)
            .eq('id', slot.id)
        } else {
          // Insert new
          await supabase
            .from('doctor_availability')
            .insert(slotData)
        }
      }

      router.refresh()
      addToast({
        variant: 'success',
        title: 'Success',
        description: 'Availability saved successfully!',
      })
    } catch (error) {
      console.error('Error saving availability:', error)
      addToast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Failed to save availability. Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> All times are displayed in Lagos time (WAT - West Africa Time, UTC+1).
          Changes to availability will sync in real-time to the booking flow.
        </p>
      </div>
      {dayNames.map((dayName, dayIndex) => (
        <Card key={dayIndex} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{dayName}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addSlot(dayIndex)}
              disabled={!isVerified}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Time Slot
            </Button>
          </div>

          {availability[dayIndex] && availability[dayIndex].length > 0 ? (
            <div className="space-y-4">
              {availability[dayIndex].map((slot, slotIndex) => (
                <div
                  key={slotIndex}
                  className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={slot.active}
                      onCheckedChange={(checked) =>
                        updateSlot(dayIndex, slotIndex, 'active', checked)
                      }
                      disabled={!isVerified}
                    />
                    <Label className="text-sm font-medium">
                      {slot.active ? 'Active' : 'Inactive'}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor={`start-${dayIndex}-${slotIndex}`} className="text-sm">
                      From:
                    </Label>
                    <Input
                      id={`start-${dayIndex}-${slotIndex}`}
                      type="time"
                      value={slot.start_time}
                      onChange={(e) =>
                        updateSlot(dayIndex, slotIndex, 'start_time', e.target.value)
                      }
                      className="w-32"
                      disabled={!isVerified}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor={`end-${dayIndex}-${slotIndex}`} className="text-sm">
                      To:
                    </Label>
                    <Input
                      id={`end-${dayIndex}-${slotIndex}`}
                      type="time"
                      value={slot.end_time}
                      onChange={(e) =>
                        updateSlot(dayIndex, slotIndex, 'end_time', e.target.value)
                      }
                      className="w-32"
                      disabled={!isVerified}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSlot(dayIndex, slotIndex)}
                    className="ml-auto text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No time slots added. Click "Add Time Slot" to get started.</p>
          )}
        </Card>
      ))}

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || !isVerified}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : !isVerified ? 'Verification Required' : 'Save Availability'}
        </Button>
      </div>

      {!isVerified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Your access has been revoked. Please contact the administrator to restore your access.
          </p>
        </div>
      )}
    </div>
  )
}
