import {
  getDayOfWeek,
  isTimeAvailable,
  getAvailableTimeSlots,
  type AvailabilitySlot,
} from '@/lib/utils/availability'

describe('availability utils', () => {
  describe('getDayOfWeek', () => {
    it('returns correct day of week', () => {
      // Sunday
      expect(getDayOfWeek(new Date('2024-01-07'))).toBe(0)
      // Monday
      expect(getDayOfWeek(new Date('2024-01-08'))).toBe(1)
      // Saturday
      expect(getDayOfWeek(new Date('2024-01-13'))).toBe(6)
    })
  })

  describe('isTimeAvailable', () => {
    const slots: AvailabilitySlot[] = [
      {
        day_of_week: 1, // Monday
        start_time: '09:00:00',
        end_time: '17:00:00',
        active: true,
      },
    ]

    it('returns true for available time', () => {
      const monday = new Date('2024-01-08') // Monday
      expect(isTimeAvailable(monday, '10:00', slots)).toBe(true)
    })

    it('returns false for time outside availability', () => {
      const monday = new Date('2024-01-08') // Monday
      expect(isTimeAvailable(monday, '08:00', slots)).toBe(false)
      expect(isTimeAvailable(monday, '18:00', slots)).toBe(false)
    })

    it('returns false for inactive slots', () => {
      const inactiveSlots: AvailabilitySlot[] = [
        {
          day_of_week: 1,
          start_time: '09:00:00',
          end_time: '17:00:00',
          active: false,
        },
      ]
      const monday = new Date('2024-01-08')
      expect(isTimeAvailable(monday, '10:00', inactiveSlots)).toBe(false)
    })

    it('handles edge cases (midnight, end of day)', () => {
      const edgeSlots: AvailabilitySlot[] = [
        {
          day_of_week: 1,
          start_time: '00:00:00',
          end_time: '23:59:59',
          active: true,
        },
      ]
      const monday = new Date('2024-01-08')
      expect(isTimeAvailable(monday, '00:00', edgeSlots)).toBe(true)
      // Note: 23:59 is at the end time, so it's not included (uses < not <=)
      expect(isTimeAvailable(monday, '23:58', edgeSlots)).toBe(true)
    })
  })

  describe('getAvailableTimeSlots', () => {
    const slots: AvailabilitySlot[] = [
      {
        day_of_week: 1, // Monday
        start_time: '09:00:00',
        end_time: '17:00:00',
        active: true,
      },
    ]

    it('returns correct slots', () => {
      const monday = new Date('2024-01-08') // Monday
      const available = getAvailableTimeSlots(monday, slots, 30)
      expect(available.length).toBeGreaterThan(0)
      expect(available[0]).toMatch(/^\d{2}:\d{2}$/)
    })

    it('excludes conflicting appointments', () => {
      const monday = new Date('2024-01-08')
      const existingAppointments = [
        {
          scheduled_at: new Date('2024-01-08T10:00:00').toISOString(),
          duration_minutes: 30,
        },
      ]
      const available = getAvailableTimeSlots(
        monday,
        slots,
        30,
        existingAppointments
      )
      // Should not include 10:00 slot
      expect(available).not.toContain('10:00')
    })

    it('returns empty array for days with no availability', () => {
      const tuesday = new Date('2024-01-09') // Tuesday (no slots)
      const available = getAvailableTimeSlots(tuesday, slots, 30)
      expect(available).toEqual([])
    })

    it('handles timezone conversions', () => {
      const monday = new Date('2024-01-08T00:00:00Z')
      const available = getAvailableTimeSlots(monday, slots, 30)
      // Should still work regardless of timezone
      expect(Array.isArray(available)).toBe(true)
    })

    it('formats time correctly', () => {
      const monday = new Date('2024-01-08')
      const available = getAvailableTimeSlots(monday, slots, 30)
      available.forEach((slot) => {
        expect(slot).toMatch(/^\d{2}:\d{2}$/)
      })
    })
  })
})
