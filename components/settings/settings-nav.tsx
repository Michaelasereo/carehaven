'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, User, Settings as SettingsIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsNavProps {
  basePath: string
  className?: string
}

const settingsTabs = [
  {
    name: 'Notifications',
    href: 'notifications',
    icon: Bell,
  },
  {
    name: 'Account',
    href: 'account',
    icon: User,
  },
]

export function SettingsNav({ basePath, className }: SettingsNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn('border-b border-gray-200', className)}>
      <div className="flex space-x-8">
        {settingsTabs.map((tab) => {
          const href = `${basePath}/settings/${tab.href}`
          const isActive = pathname === href
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                'flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors',
                isActive
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.name}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
