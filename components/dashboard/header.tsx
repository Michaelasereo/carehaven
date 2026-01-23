'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
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
import { Menu, Calendar as CalendarIcon } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const supabase = createClient()
  const { toggleSidebar } = useUIStore()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Extract user/profile fetch logic into reusable function
  const fetchUserAndProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('[Header] Error fetching user:', userError)
        setUser(null)
        setProfile(null)
        setIsLoading(false)
        return
      }

      if (user) {
        setUser(user)
        
        // Fetch profile with proper error handling
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*, avatar_url')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('[Header] Error fetching profile:', profileError)
          // Clear profile state on error to prevent stale data
          setProfile(null)
          setIsLoading(false)
          return
        }

        // Validate that profile belongs to the current user
        if (profileData && profileData.id === user.id) {
          setProfile(profileData)
        } else {
          console.warn('[Header] Profile ID mismatch:', {
            profileId: profileData?.id,
            userId: user.id,
          })
          // Clear profile if IDs don't match
          setProfile(null)
        }
      } else {
        // No user found, clear state
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error('[Header] Unexpected error fetching user/profile:', error)
      // Clear state on unexpected errors
      setUser(null)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Initial fetch on mount
  useEffect(() => {
    fetchUserAndProfile()
  }, [fetchUserAndProfile])

  // Listen for auth state changes and re-fetch user/profile
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Header] Auth state changed:', event, session?.user?.id)
        
        // Re-fetch user and profile when auth state changes
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          await fetchUserAndProfile()
        }
        
        // Clear state on sign out
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setIsLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserAndProfile])

  // Subscribe to real-time profile updates (for avatar_url and name changes)
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`header-profile-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as any
          // Validate that the update is for the current user
          if (newData && newData.id === user.id) {
            setProfile((prev: any) => ({
              ...prev,
              ...newData,
            }))
          } else {
            console.warn('[Header] Received profile update for different user:', {
              updateId: newData?.id,
              currentUserId: user.id,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  // Get display name with "Dr" prefix for doctors
  const getDisplayName = () => {
    // Ensure profile belongs to current user before using it
    if (profile && profile.id === user?.id) {
      const name = profile.full_name || user?.email?.split('@')[0] || 'User'
      if (profile.role === 'doctor') {
        return `Dr ${name}`
      }
      return name
    }
    // Fallback to user email if profile is not available or doesn't match
    return user?.email?.split('@')[0] || 'User'
  }

  const displayName = getDisplayName()
  // Only use profile data if it belongs to the current user
  const isValidProfile = profile && profile.id === user?.id
  const avatarUrl = isValidProfile ? (profile.avatar_url || '') : ''
  const initials = isValidProfile && profile.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : displayName.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden min-h-[44px] min-w-[44px] flex-shrink-0"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {isLoading ? (
          <span className="text-sm md:text-base text-gray-700 truncate">Loading...</span>
        ) : (
          <>
            <span className="text-sm md:text-base text-gray-700 truncate hidden sm:inline">
              Welcome, {displayName}
            </span>
            <span className="text-sm md:text-base text-gray-700 truncate sm:hidden">
              {displayName}
            </span>
          </>
        )}
        {!isLoading && (
          <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
            {avatarUrl ? (
              <AvatarImage 
                src={avatarUrl} 
                alt={displayName}
                onError={() => {
                  console.warn('Failed to load avatar image in header:', avatarUrl)
                }}
              />
            ) : null}
            <AvatarFallback className="bg-teal-100 text-teal-700 font-semibold text-xs md:text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="min-h-[44px] md:min-h-0 flex-shrink-0">▼</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {isValidProfile && profile.role === 'patient' && (
          <>
            <Button 
              className="bg-teal-600 hover:bg-teal-700 hidden md:flex min-h-[44px]" 
              onClick={() => router.push('/patient/appointments/book')}
            >
              + Book a Consultation
            </Button>
            <Button 
              className="bg-teal-600 hover:bg-teal-700 md:hidden min-h-[44px] min-w-[44px] p-0" 
              size="icon"
              onClick={() => router.push('/patient/appointments/book')}
              aria-label="Book Consultation"
            >
              <CalendarIcon className="h-5 w-5" />
            </Button>
          </>
        )}
        <NotificationBell userId={user?.id} />
      </div>
    </header>
  )
}

