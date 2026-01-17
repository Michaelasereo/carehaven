'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Settings, DollarSign } from 'lucide-react'

const settingsTabs = [
  {
    name: 'System Settings',
    href: 'system',
    icon: Settings,
  },
  {
    name: 'Pricing',
    href: 'pricing',
    icon: DollarSign,
  },
]

export function AdminSettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-gray-200">
      <div className="flex space-x-8">
        {settingsTabs.map((tab) => {
          const href = `/admin/settings/${tab.href}`
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
