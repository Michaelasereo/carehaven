'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Settings,
  User,
  Stethoscope,
  TrendingUp,
} from 'lucide-react'

const doctorNavItems = [
  { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctor/appointments', label: 'Appointments', icon: Calendar },
  { href: '/doctor/sessions', label: 'Clients', icon: Stethoscope },
  { href: '/doctor/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/doctor/availability', label: 'Availability', icon: Clock },
]

const userNavItems = [
  { href: '/doctor/profile', label: 'Profile', icon: User },
  { href: '/doctor/settings', label: 'Settings', icon: Settings },
]

export function DoctorSidebar() {
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
        {doctorNavItems.map((item) => {
          const Icon = item.icon
          // Only match exact path or paths that are children (but not parent matches)
          const isActive = item.href === '/doctor/dashboard'
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
