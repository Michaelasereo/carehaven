'use client'

import Link from 'next/link'
import Image from 'next/image'
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
} from 'lucide-react'

const patientNavItems = [
  { href: '/patient', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patient/sessions', label: 'Sessions', icon: Calendar },
  { href: '/patient/appointments', label: 'Appointments', icon: CalendarDays },
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
    <div className="flex h-screen w-64 flex-col bg-gray-50 border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center">
          <Image
            src="/carehaven logo.svg"
            alt="Care Haven Logo"
            width={120}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {patientNavItems.map((item) => {
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

        <div className="my-4 border-t" />

        {userNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
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

      <div className="p-4 border-t">
        <div className="rounded-lg bg-gray-100 p-3 text-xs text-gray-600">
          <div className="flex items-start gap-2">
            <span className="font-semibold">i</span>
            <p>
              An integrated, opinionated platform that structures the entire research lifecycle,
              providing clarity on progress, centralizing communication, and automating administrative overhead.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

