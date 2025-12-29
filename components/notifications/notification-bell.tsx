'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/lib/react-query/queries'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function NotificationBell() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | undefined>()
  const { data: notifications } = useNotifications(userId)
  const unreadCount = notifications?.filter(n => !n.read).length || 0

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    getUser()
  }, [supabase])

  return (
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
          {unreadCount}
        </Badge>
      )}
    </Button>
  )
}

