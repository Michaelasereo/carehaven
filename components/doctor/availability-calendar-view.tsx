import { Card } from '@/components/ui/card'

interface AvailabilitySlot {
  day_of_week: number
  start_time: string
  end_time: string
  active: boolean
}

interface AvailabilityCalendarViewProps {
  availability: AvailabilitySlot[]
  weeks?: number
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatTime(t: string) {
  return t.substring(0, 5) // HH:MM
}

export function AvailabilityCalendarView({ availability, weeks = 1 }: AvailabilityCalendarViewProps) {
  const byDay: Record<number, AvailabilitySlot[]> = {}
  for (let i = 0; i < 7; i++) {
    byDay[i] = []
  }
  availability
    .filter((s) => s.active)
    .forEach((s) => {
      byDay[s.day_of_week].push(s)
    })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
      {dayNames.map((name, i) => {
        const slots = byDay[i] || []
        return (
          <Card key={i} className="p-4">
            <div className="text-sm font-medium text-gray-900 mb-2">{name}</div>
            {slots.length > 0 ? (
              <ul className="text-xs text-gray-600 space-y-1">
                {slots.map((s, j) => (
                  <li key={j}>
                    {formatTime(s.start_time)} – {formatTime(s.end_time)}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-xs text-gray-400">—</span>
            )}
          </Card>
        )
      })}
    </div>
  )
}
