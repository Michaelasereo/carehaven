'use client'

import * as React from 'react'
import { Bell, Calendar, FileText, MessageSquare, Pill, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'appointment' | 'prescription' | 'investigation' | 'message' | 'system'
  title: string
  body: string
  read: boolean
  created_at: string
  data?: Record<string, any>
}

interface NotificationDropdownProps {
  notifications: Notification[]
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  isLoading?: boolean
  className?: string
  userRole?: string
}

const notificationIcons = {
  appointment: Calendar,
  prescription: Pill,
  investigation: FileText,
  message: MessageSquare,
  system: Bell,
}

export function NotificationDropdown({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  isLoading = false,
  className,
  userRole,
}: NotificationDropdownProps) {
  const unreadCount = notifications.filter((n) => !n.read).length
  const isAdmin = userRole === 'admin' || userRole === 'super_admin'
  const isDoctor = userRole === 'doctor'

  const viewAllHref = isAdmin
    ? '/admin/notifications'
    : isDoctor
      ? '/doctor/notifications'
      : '/patient/notifications'

  const getNotificationLink = (notification: Notification): string => {
    const { type, data } = notification
    const aptId = data?.appointment_id ?? data?.appointmentId

    if (isAdmin) {
      if ((type === 'appointment' || type === 'system') && aptId) {
        return `/admin/appointments/${aptId}`
      }
      return '/admin/notifications'
    }

    if (isDoctor) {
      if (type === 'appointment' && aptId) {
        return `/doctor/appointments/${aptId}`
      }
      if (type === 'investigation' && (data?.investigation_id ?? data?.investigationId)) {
        return '/doctor/investigations'
      }
      return '/doctor/notifications'
    }

    switch (type) {
      case 'appointment':
        return `/patient/appointments${aptId ? `/${aptId}` : ''}`
      case 'prescription':
        return `/patient/prescriptions${data?.prescription_id ? `/${data.prescription_id}` : ''}`
      case 'investigation':
        return `/patient/investigations${data?.investigation_id ? `/${data.investigation_id}` : ''}`
      case 'message':
        return `/patient/messages${data?.sender_id ? `?sender=${data.sender_id}` : ''}`
      default:
        return '/patient/notifications'
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg shadow-lg w-96 max-h-[500px] overflow-hidden flex flex-col', className)}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && onMarkAllAsRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-xs text-teal-600 hover:text-teal-700"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell
                const link = getNotificationLink(notification)

                return (
                  <Link
                    key={notification.id}
                    href={link}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'block p-4 hover:bg-gray-50 transition-colors',
                      !notification.read && 'bg-teal-50/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        notification.type === 'appointment' && 'bg-blue-50',
                        notification.type === 'prescription' && 'bg-purple-50',
                        notification.type === 'investigation' && 'bg-green-50',
                        notification.type === 'message' && 'bg-yellow-50',
                        notification.type === 'system' && 'bg-gray-50'
                      )}>
                        <Icon className={cn(
                          'h-4 w-4',
                          notification.type === 'appointment' && 'text-blue-600',
                          notification.type === 'prescription' && 'text-purple-600',
                          notification.type === 'investigation' && 'text-green-600',
                          notification.type === 'message' && 'text-yellow-600',
                          notification.type === 'system' && 'text-gray-600'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            'text-sm font-medium',
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          )}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-teal-600 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <Link
              href={viewAllHref}
              className="block text-center text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              View all notifications
            </Link>
          </div>
        )}
    </div>
  )
}
