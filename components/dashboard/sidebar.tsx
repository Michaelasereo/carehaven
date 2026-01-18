'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Stethoscope,
  Bell,
  User,
  Settings,
  Pill,
} from 'lucide-react'

const patientNavItems = [
  { href: '/patient', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patient/sessions', label: 'Sessions', icon: Calendar },
  { href: '/patient/appointments', label: 'Appointments', icon: CalendarDays },
  { href: '/patient/prescriptions', label: 'Prescriptions', icon: Pill },
  { href: '/patient/investigations', label: 'Investigations', icon: Stethoscope },
  { href: '/patient/notifications', label: 'Notifications', icon: Bell },
]

const userNavItems = [
  { href: '/patient/profile', label: 'Profile', icon: User },
  { href: '/patient/settings', label: 'Settings & Preferences', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col bg-gray-50 border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center">
          <img
            src="/carehaven-logo.svg"
            alt="Care Haven Logo"
            className="h-8 w-auto"
          />
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {patientNavItems.map((item) => {
          const Icon = item.icon
          // Only match exact path or paths that are children (but not parent matches)
          const isActive = item.href === '/patient'
            ? pathname === item.href
            : pathname === item.href || pathname?.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}

        <div className="my-4 border-t" />

        {userNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

