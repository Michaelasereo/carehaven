'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { useUIStore } from '@/lib/store/ui-store'
import { Menu } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const supabase = createClient()
  const { toggleSidebar } = useUIStore()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profileData)
      }
    }
    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-gray-700">Welcome, {displayName}</span>
        <Avatar>
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">▼</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4">
        {profile?.role === 'patient' && (
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => router.push('/patient/appointments/book')}>
            + Book a Consultation
          </Button>
        )}
        <NotificationBell userId={user?.id} />
      </div>
    </header>
  )
}

