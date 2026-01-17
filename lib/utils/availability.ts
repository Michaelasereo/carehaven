/**
 * Utility functions for checking doctor availability
 */

export interface AvailabilitySlot {
  day_of_week: number
  start_time: string
  end_time: string
  active: boolean
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday) from a date
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay()
}

/**
 * Check if a time falls within availability slots
 */
export function isTimeAvailable(
  selectedDate: Date,
  selectedTime: string,
  availabilitySlots: AvailabilitySlot[]
): boolean {
  const dayOfWeek = getDayOfWeek(selectedDate)
  
  // Find active slots for this day
  const daySlots = availabilitySlots.filter(
    slot => slot.day_of_week === dayOfWeek && slot.active
  )

  if (daySlots.length === 0) {
    return false // No availability for this day
  }

  // Parse selected time (HH:MM format)
  const [selectedHour, selectedMinute] = selectedTime.split(':').map(Number)
  const selectedTimeMinutes = selectedHour * 60 + selectedMinute

  // Check if time falls within any slot
  return daySlots.some(slot => {
    // Handle TIME format from database (HH:MM:SS or HH:MM)
    const startTimeStr = typeof slot.start_time === 'string' 
      ? slot.start_time.split(':').slice(0, 2).join(':')
      : slot.start_time
    const endTimeStr = typeof slot.end_time === 'string'
      ? slot.end_time.split(':').slice(0, 2).join(':')
      : slot.end_time
    
    const [startHour, startMinute] = startTimeStr.split(':').map(Number)
    const [endHour, endMinute] = endTimeStr.split(':').map(Number)
    
    const startTimeMinutes = startHour * 60 + startMinute
    const endTimeMinutes = endHour * 60 + endMinute

    return selectedTimeMinutes >= startTimeMinutes && selectedTimeMinutes < endTimeMinutes
  })
}

/**
 * Generate available time slots for a given date
 */
export function getAvailableTimeSlots(
  selectedDate: Date,
  availabilitySlots: AvailabilitySlot[],
  durationMinutes: number = 30,
  existingAppointments: Array<{ scheduled_at: string; duration_minutes: number }> = []
): string[] {
  const dayOfWeek = getDayOfWeek(selectedDate)
  
  // Find active slots for this day
  const daySlots = availabilitySlots.filter(
    slot => slot.day_of_week === dayOfWeek && slot.active
  )

  if (daySlots.length === 0) {
    return []
  }

  const availableSlots: string[] = []

  daySlots.forEach(slot => {
    // Handle TIME format from database (HH:MM:SS or HH:MM)
    const startTimeStr = typeof slot.start_time === 'string' 
      ? slot.start_time.split(':').slice(0, 2).join(':')
      : slot.start_time
    const endTimeStr = typeof slot.end_time === 'string'
      ? slot.end_time.split(':').slice(0, 2).join(':')
      : slot.end_time
    
    const [startHour, startMinute] = startTimeStr.split(':').map(Number)
    const [endHour, endMinute] = endTimeStr.split(':').map(Number)
    
    const startTimeMinutes = startHour * 60 + startMinute
    const endTimeMinutes = endHour * 60 + endMinute

    // Generate 30-minute slots
    for (let time = startTimeMinutes; time + durationMinutes <= endTimeMinutes; time += durationMinutes) {
      const hours = Math.floor(time / 60)
      const minutes = time % 60
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      
      // Check if this slot conflicts with existing appointments
      const slotDateTime = new Date(selectedDate)
      slotDateTime.setHours(hours, minutes, 0, 0)
      
      const hasConflict = existingAppointments.some(apt => {
        const aptDate = new Date(apt.scheduled_at)
        const aptEnd = new Date(aptDate.getTime() + (apt.duration_minutes || 30) * 60000)
        const slotEnd = new Date(slotDateTime.getTime() + durationMinutes * 60000)
        
        // Check for overlap
        return (slotDateTime < aptEnd && slotEnd > aptDate)
      })

      if (!hasConflict) {
        availableSlots.push(timeString)
      }
    }
  })

  return availableSlots.sort()
}
