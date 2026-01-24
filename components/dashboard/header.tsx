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

  // Fetch user and profile data
  const fetchUserAndProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      // Get current user - this validates against the server
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('[Header] Error fetching user:', userError)
        setUser(null)
        setProfile(null)
        setIsLoading(false)
        return
      }

      if (!user) {
        // No user authenticated - clear all data
        console.log('[Header] No authenticated user found')
        setUser(null)
        setProfile(null)
        setIsLoading(false)
        return
      }

      // Log the user ID for debugging
      console.log('[Header] Fetching profile for user:', user.id, 'email:', user.email)

      // Update user state first
      setUser(user)

      // Fetch profile from server-side API route (uses cookie-based auth, same as dashboard)
      let profileResponse: Response
      try {
        profileResponse = await fetch('/api/profile')
      } catch (fetchError) {
        console.error('[Header] Fetch error:', fetchError)
        setProfile(null)
        setIsLoading(false)
        return
      }
      
      if (!profileResponse.ok) {
        if (profileResponse.status === 401) {
          console.error('[Header] Unauthorized - user not authenticated')
          setUser(null)
          setProfile(null)
          setIsLoading(false)
          return
        }
        let errorData: any = {}
        try {
          errorData = await profileResponse.json()
        } catch (jsonError) {
          console.error('[Header] Error parsing error response:', jsonError)
        }
        console.error('[Header] Error fetching profile from API:', {
          status: profileResponse.status,
          error: errorData.error || 'Unknown error',
          userId: user.id,
        })
        setProfile(null)
        setIsLoading(false)
        return
      }

      let profileData: any
      try {
        profileData = await profileResponse.json()
      } catch (jsonError) {
        console.error('[Header] JSON parse error:', jsonError)
        setProfile(null)
        setIsLoading(false)
        return
      }

      if (profileData) {
        // Verify profile matches the authenticated user
        if (profileData.id !== user.id) {
          console.error('[Header] Profile ID mismatch!', {
            profileId: profileData.id,
            userId: user.id,
          })
          setProfile(null)
          setIsLoading(false)
          return
        }

        console.log('[Header] Profile loaded:', {
          id: profileData.id,
          name: profileData.full_name,
          role: profileData.role,
          avatarUrl: profileData.avatar_url ? 'present' : 'missing',
          avatarUrlValue: profileData.avatar_url || 'null/undefined',
        })
        
        setProfile(profileData)
      } else {
        // No profile data found
        console.warn('[Header] No profile data found for user:', user.id)
        setProfile(null)
      }
    } catch (error) {
      console.error('[Header] Unexpected error:', error)
      setUser(null)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Initial fetch and auth state change listener
  useEffect(() => {
    // Initial fetch
    fetchUserAndProfile()

    // Listen to auth state changes to refresh user/profile when auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Header] Auth state changed:', event, session?.user?.id)
      
      // Handle sign out - clear data immediately
      if (event === 'SIGNED_OUT' || !session) {
        console.log('[Header] User signed out, clearing state')
        setUser(null)
        setProfile(null)
        setIsLoading(false)
        return
      }
      
      // On sign in or token refresh, always refetch to ensure we have the correct user
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        console.log('[Header] Auth state changed:', event, 'refetching user and profile')
        // Clear existing state first to prevent showing stale data
        if (event === 'SIGNED_IN') {
          setUser(null)
          setProfile(null)
        }
        await fetchUserAndProfile()
      }
    })

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
          console.log('[Header] Profile updated via realtime:', {
            userId: user.id,
            payload: payload.new,
            avatarUrl: (payload.new as any)?.avatar_url,
          })
          const newData = payload.new as any
          
          // Verify the update is for the current user
          if (newData.id !== user.id) {
            console.warn('[Header] Realtime update for different user, ignoring')
            return
          }
          
          // Update profile state with new data
          setProfile((prev: any) => {
            const updated = {
              ...prev,
              ...newData,
            }
            // Ensure avatar_url is preserved if present
            if (newData.avatar_url) {
              updated.avatar_url = newData.avatar_url
            }
            console.log('[Header] Updated profile state:', {
              name: updated.full_name,
              avatarUrl: updated.avatar_url ? 'present' : 'missing',
            })
            return updated
          })
          
          // Also trigger a manual refetch to ensure we have the latest data
          setTimeout(() => {
            fetchUserAndProfile()
          }, 100)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Header] Realtime subscription active for profile updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Header] Realtime subscription error, will rely on manual refetch')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, supabase, fetchUserAndProfile])

  // Listen for custom avatar update events from profile form
  useEffect(() => {
    if (!user?.id) return

    const handleAvatarUpdate = (event: CustomEvent) => {
      const { avatarUrl, userId } = event.detail
      console.log('[Header] Received avatar update event:', { userId, avatarUrl, currentUserId: user?.id })
      
      if (userId === user.id) {
        console.log('[Header] Avatar updated via custom event, updating state and refetching')
        setProfile((prev: any) => ({
          ...prev,
          avatar_url: avatarUrl,
        }))
        // Trigger refetch to ensure consistency
        setTimeout(() => {
          fetchUserAndProfile()
        }, 200)
      } else {
        console.warn('[Header] Avatar update event for different user, ignoring')
      }
    }

    const handleProfileUpdate = (event: CustomEvent) => {
      const { userId } = event.detail
      console.log('[Header] Received profile update event:', { userId, currentUserId: user?.id })
      
      if (userId === user.id) {
        console.log('[Header] Profile updated via custom event, refetching...')
        setTimeout(() => {
          fetchUserAndProfile()
        }, 200)
      } else {
        console.warn('[Header] Profile update event for different user, ignoring')
      }
    }

    window.addEventListener('profile-avatar-updated', handleAvatarUpdate as EventListener)
    window.addEventListener('profile-updated', handleProfileUpdate as EventListener)
    
    return () => {
      window.removeEventListener('profile-avatar-updated', handleAvatarUpdate as EventListener)
      window.removeEventListener('profile-updated', handleProfileUpdate as EventListener)
    }
  }, [user?.id, fetchUserAndProfile])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  // Get display name with "Dr" prefix for doctors
  const getDisplayName = () => {
    const name = profile?.full_name || user?.email?.split('@')[0] || 'User'
    if (profile?.role === 'doctor') {
      return `Dr ${name}`
    }
    return name
  }

  const displayName = getDisplayName()
  const avatarUrl = profile?.avatar_url || ''
  const initials = profile?.full_name 
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : displayName.charAt(0).toUpperCase()

  // Debug logging for avatar
  if (profile && !avatarUrl) {
    console.warn('[Header] Profile loaded but avatar_url is missing:', {
      profileId: profile.id,
      hasProfile: !!profile,
      avatarUrl: profile.avatar_url,
    })
  }

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
        <span className="text-base md:text-lg font-medium text-gray-900">{isLoading ? 'Loading...' : displayName}</span>
      </div>

      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {profile?.role === 'patient' && (
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8 md:h-10 md:w-10 p-0 min-h-[44px] md:min-h-0 flex-shrink-0"
              aria-label="Account menu"
            >
              <Avatar className="h-8 w-8 md:h-10 md:w-10">
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
                  {isLoading ? '?' : initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <NotificationBell userId={user?.id} />
      </div>
    </header>
  )
}

