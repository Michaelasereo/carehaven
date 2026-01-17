'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotifications } from '@/lib/react-query/queries'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

export default function NotificationsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | undefined>()

  // Get user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    getUser()
  }, [supabase])

  const { data: notifications, isLoading } = useNotifications(userId)
  const unreadNotifications = notifications?.filter(n => !n.read) || []
  const readNotifications = notifications?.filter(n => n.read) || []

  const handleMarkAsRead = async (id: string) => {
    if (!userId) return
    await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', id)
  }

  const handleMarkAllAsRead = async () => {
    if (!userId || !notifications) return
    const unreadIds = unreadNotifications.map(n => n.id)
    if (unreadIds.length === 0) return

    await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .in('id', unreadIds)
  }

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    handleMarkAsRead(notification.id)

    // Navigate based on notification type
    if (notification.data) {
      if (notification.type === 'appointment' && notification.data.appointmentId) {
        router.push(`/patient/appointments`)
      } else if (notification.type === 'prescription' && notification.data.prescriptionId) {
        router.push(`/patient/prescriptions`)
      } else if (notification.type === 'investigation' && notification.data.investigationId) {
        router.push(`/patient/investigations`)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="h-8 w-8" />
          Notifications
        </h1>
        {unreadNotifications.length > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-600">
            You'll see appointment updates, prescription notifications, and other important updates here.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Unread Notifications */}
          {unreadNotifications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                Unread
                <Badge variant="default" className="bg-teal-600">
                  {unreadNotifications.length}
                </Badge>
              </h2>
              <div className="space-y-3">
                {unreadNotifications.map((notification: any) => (
                  <Card
                    key={notification.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-teal-600"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-teal-50 rounded-lg">
                            <Bell className="h-5 w-5 text-teal-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                            {notification.body && (
                              <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              {format(new Date(notification.created_at), 'PPp')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id)
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Read Notifications */}
          {readNotifications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Read</h2>
              <div className="space-y-3">
                {readNotifications.map((notification: any) => (
                  <Card
                    key={notification.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow opacity-75"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Bell className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        {notification.body && (
                          <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {format(new Date(notification.created_at), 'PPp')}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
