'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isBefore, startOfDay } from 'date-fns'

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
  disabled?: (date: Date) => boolean
  minDate?: Date
  maxDate?: Date
  className?: string
}

export function Calendar({
  selected,
  onSelect,
  disabled,
  minDate,
  maxDate,
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected || new Date()
  )

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get first day of month and fill with empty cells for alignment
  const firstDayOfWeek = monthStart.getDay()
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i)

  const isDateDisabled = (date: Date) => {
    if (minDate && isBefore(date, startOfDay(minDate))) return true
    if (maxDate && isBefore(startOfDay(maxDate), date)) return true
    if (disabled) return disabled(date)
    return false
  }

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return
    onSelect?.(date)
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={cn('p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handlePreviousMonth}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 p-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for alignment */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="p-2" />
        ))}

        {/* Days in month */}
        {daysInMonth.map((date) => {
          const isSelected = selected && isSameDay(date, selected)
          const isDisabled = isDateDisabled(date)
          const isCurrentMonth = isSameMonth(date, currentMonth)

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={isDisabled}
              className={cn(
                'p-2 text-sm rounded-md transition-colors',
                isSelected &&
                  'bg-teal-600 text-white font-semibold',
                !isSelected &&
                  !isDisabled &&
                  'hover:bg-teal-50 text-gray-900',
                isDisabled && 'text-gray-300 cursor-not-allowed',
                !isCurrentMonth && 'text-gray-400'
              )}
            >
              {format(date, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
