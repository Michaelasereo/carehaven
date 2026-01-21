'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/lib/store/ui-store'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Always visible on desktop, toggleable on mobile */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-gray-50 border-r',
          'transition-transform duration-300 ease-in-out',
          // On mobile: show/hide based on sidebarOpen
          // On desktop: always visible (no transform)
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <div className="flex items-center">
            <img
              src="/carehaven-logo.svg"
              alt="Care Haven Logo"
              className="h-8 w-auto"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
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
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px] lg:min-h-0',
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
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px] lg:min-h-0',
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
    </>
  )
}

