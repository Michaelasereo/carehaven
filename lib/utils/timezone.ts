/**
 * Timezone utilities for Lagos/WAT (West Africa Time)
 * Lagos timezone: Africa/Lagos (UTC+1)
 */

const LAGOS_TIMEZONE = 'Africa/Lagos'

/**
 * Get current time in Lagos timezone
 */
export function getLagosTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: LAGOS_TIMEZONE }))
}

/**
 * Convert a date to Lagos timezone
 */
export function convertToLagos(date: Date): Date {
  const lagosDate = new Date(date.toLocaleString('en-US', { timeZone: LAGOS_TIMEZONE }))
  return lagosDate
}

/**
 * Format date/time in Lagos timezone
 * @param date - Date to format
 * @param format - Format type: 'date', 'time', 'datetime', 'short'
 */
export function formatLagosTime(
  date: Date | string,
  format: 'date' | 'time' | 'datetime' | 'short' = 'datetime'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: LAGOS_TIMEZONE,
  }

  switch (format) {
    case 'date':
      options.year = 'numeric'
      options.month = 'short'
      options.day = 'numeric'
      break
    case 'time':
      options.hour = '2-digit'
      options.minute = '2-digit'
      options.hour12 = true
      break
    case 'datetime':
      options.year = 'numeric'
      options.month = 'short'
      options.day = 'numeric'
      options.hour = '2-digit'
      options.minute = '2-digit'
      options.hour12 = true
      break
    case 'short':
      options.month = 'short'
      options.day = 'numeric'
      options.hour = '2-digit'
      options.minute = '2-digit'
      options.hour12 = true
      break
  }

  return dateObj.toLocaleString('en-US', options)
}

/**
 * Check if current time is within a time range (in Lagos timezone)
 */
export function isTimeInLagosTimeframe(
  startTime: string, // HH:MM format
  endTime: string,   // HH:MM format
  date?: Date        // Optional date to check (defaults to now)
): boolean {
  const checkDate = date || getLagosTime()
  const now = convertToLagos(checkDate)
  
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

/**
 * Check if a date/time is within join window (15 minutes before appointment)
 * Returns true if current Lagos time is within 15 minutes before scheduled time
 */
export function isWithinJoinWindow(scheduledAt: Date | string): boolean {
  const scheduled = typeof scheduledAt === 'string' ? new Date(scheduledAt) : scheduledAt
  const now = getLagosTime()
  
  // Convert scheduled time to Lagos timezone for comparison
  const scheduledLagos = convertToLagos(scheduled)
  const nowLagos = convertToLagos(now)
  
  // 15 minutes in milliseconds
  const joinWindowStart = new Date(scheduledLagos.getTime() - 15 * 60 * 1000)
  
  return nowLagos >= joinWindowStart && nowLagos <= scheduledLagos
}

/**
 * Get Lagos timezone offset in hours from UTC
 */
export function getLagosTimezoneOffset(): number {
  const now = new Date()
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
  const lagosTime = new Date(utcTime + (1 * 3600000)) // UTC+1
  return 1 // Lagos is UTC+1
}

/**
 * Format time with WAT suffix
 */
export function formatLagosTimeWithSuffix(date: Date | string): string {
  return `${formatLagosTime(date, 'time')} WAT`
}
