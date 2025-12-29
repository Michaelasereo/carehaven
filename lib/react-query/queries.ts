import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useProfile(userId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

export function useAppointments(userId: string | undefined, role: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['appointments', userId, role],
    queryFn: async () => {
      if (!userId) return []

      const column = role === 'doctor' ? 'doctor_id' : 'patient_id'
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq(column, userId)
        .order('scheduled_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!userId && !!role,
  })
}

export function useNotifications(userId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}

