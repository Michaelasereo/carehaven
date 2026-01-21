'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/lib/store/ui-store'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Settings,
  User,
  Stethoscope,
  FileText,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { NairaIcon } from '@/components/icons/naira-icon'

const doctorNavItems = [
  { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctor/appointments', label: 'Appointments', icon: Calendar },
  { href: '/doctor/session-notes', label: 'Session Notes', icon: FileText },
  { href: '/doctor/sessions', label: 'Clients', icon: Stethoscope },
  { href: '/doctor/analytics', label: 'Revenue', icon: NairaIcon },
  { href: '/doctor/availability', label: 'Availability', icon: Clock },
]

const userNavItems = [
  { href: '/doctor/profile', label: 'Profile', icon: User },
  { href: '/doctor/settings', label: 'Settings', icon: Settings },
]

export function DoctorSidebar() {
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

        {/* Doctors Tag */}
        <div className="px-4 pt-4 pb-2">
          <Badge variant="secondary" className="w-full justify-center py-1.5 bg-teal-50 text-teal-700 border-teal-200">
            Doctors
          </Badge>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4">
          {doctorNavItems.map((item) => {
            // Only match exact path or paths that are children (but not parent matches)
            const isActive = item.href === '/doctor/dashboard'
              ? pathname === item.href || pathname === '/doctor'
              : pathname === item.href || pathname?.startsWith(item.href + '/')
            
            const Icon = item.icon
            
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
                {Icon === NairaIcon ? (
                  <NairaIcon className="h-5 w-5" />
                ) : (
                  React.createElement(Icon as React.ComponentType<{ className?: string }>, { className: "h-5 w-5" })
                )}
                {item.label}
              </Link>
            )
          })}

          <div className="my-4 border-t" />

          {userNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon
            
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
                {React.createElement(Icon, { className: "h-5 w-5" })}
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
