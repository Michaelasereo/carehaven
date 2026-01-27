'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/lib/react-query/queries'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { NotificationDropdown } from './notification-dropdown'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useQueryClient } from '@tanstack/react-query'

interface NotificationBellProps {
  userId?: string
  userRole?: string
}

export function NotificationBell({ userId: propUserId, userRole }: NotificationBellProps) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [userId, setUserId] = useState<string | undefined>(propUserId)
  const [isOpen, setIsOpen] = useState(false)
  const { data: notifications, isLoading } = useNotifications(userId)
  const unreadCount = notifications?.filter(n => !n.read).length || 0

  // Debug: Log notifications when they change
  useEffect(() => {
    if (notifications) {
      console.log('[NotificationBell] Notifications:', notifications.length, 'Unread:', unreadCount)
    }
  }, [notifications, unreadCount])

  useEffect(() => {
    if (!propUserId) {
      const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUserId(user?.id)
      }
      getUser()
    } else {
      setUserId(propUserId)
    }
  }, [supabase, propUserId])

  // Real-time subscription for notifications
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch notifications when changes occur
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, queryClient])

  const handleMarkAsRead = async (id: string) => {
    if (!userId) return
    await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
  }

  const handleMarkAllAsRead = async () => {
    if (!userId || !notifications) return
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return
    await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .in('id', unreadIds)
    queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
  }

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={5}
          className="z-50"
        >
          <NotificationDropdown
            notifications={notifications || []}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            isLoading={isLoading}
            userRole={userRole}
          />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
